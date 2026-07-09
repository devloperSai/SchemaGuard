import axios from "axios";
import extractSchema from "./schemaExtractor.js";
import diffSchemas from "./schemaDiff.js";
import {
  saveSchemaSnapshot,
  getBaselineSchema,
  saveDataSnapshot,
  updateEndpointStatus,
  touchEndpoint,
} from "./snapshotManager.js";
import Endpoint from "../models/Endpoint.js";
import Environment from "../models/Environment.js";
import { sendDriftAlert, sendDowntimeAlert } from "./alertService.js";

// How many consecutive check failures are required before we actually alert,
// per the Monitoring Wizard's "Alert after" setting.
const ALERT_ON_THRESHOLD = {
  first_failure: 1,
  consecutive_2: 2,
  consecutive_3: 3,
  consecutive_5: 5,
};

// Resolves {{VAR}} tokens against an Environment doc's enabled variables.
// Mirrors utils.resolve() in the frontend (lib/store.ts) — kept in sync
// deliberately since the poller must apply the SAME resolution the user
// sees in "Send" testing, or a saved monitor silently breaks on env vars.
function resolveVars(input, env) {
  if (typeof input !== "string" || !env) return input;
  return input.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = env.variables?.find((x) => x.enabled && x.key === key);
    return v ? v.value : `{{${key}}}`;
  });
}

function getValueAtPath(obj, path) {
  if (!path) return undefined;
  return path
    .split(".")
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function buildHeaders(endpoint, env) {
  const headers = {};
  for (const h of endpoint.headersKv ?? []) {
    if (h.enabled && h.key) headers[h.key] = resolveVars(h.value, env);
  }
  if (endpoint.auth?.kind === "bearer" && endpoint.auth.bearer) {
    headers["Authorization"] =
      `Bearer ${resolveVars(endpoint.auth.bearer, env)}`;
  }
  if (endpoint.auth?.kind === "apiKey" && endpoint.auth.apiKey?.key) {
    if ((endpoint.auth.apiKey.in ?? "header") === "header") {
      headers[endpoint.auth.apiKey.key] = resolveVars(
        endpoint.auth.apiKey.value,
        env,
      );
    }
  }
  if (endpoint.auth?.kind === "basic" && endpoint.auth.basic?.user) {
    const token = Buffer.from(
      `${resolveVars(endpoint.auth.basic.user, env)}:${resolveVars(endpoint.auth.basic.pass ?? "", env)}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${token}`;
  }
  return headers;
}

// Ad-hoc request executor — backs the "Send" button in EndpointBuilder.
// Runs server-side so the browser never has to deal with CORS or mixed content.
// NOTE: this path is for unsaved/draft requests and intentionally does NOT
// resolve env vars server-side — the frontend already resolves them (via
// utils.resolve) before calling this, since a draft has no environmentId
// guaranteed to exist on the server yet.
export const executeRequest = async ({
  method = "GET",
  url,
  headers = {},
  params = {},
  body,
  timeoutMs = 8000,
}) => {
  const start = Date.now();
  try {
    const response = await axios({
      method,
      url,
      headers,
      params,
      data: body,
      timeout: timeoutMs,
      validateStatus: () => true,
    });
    const time = Date.now() - start;
    const bodyStr =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    return {
      status: response.status,
      time,
      size: `${(Buffer.byteLength(bodyStr || "", "utf8") / 1024).toFixed(2)} KB`,
      headers: response.headers,
      body: bodyStr,
    };
  } catch (err) {
    return {
      status: 0,
      time: Date.now() - start,
      size: "0 KB",
      headers: {},
      body: JSON.stringify({ error: err.message }),
      error: err.message,
    };
  }
};

// Shared failure handler for uptime / response-time / content-match / network
// errors. Bumps consecutiveFailures and only actually alerts + flips status
// once the endpoint's configured alertOn threshold is reached.
async function handleCheckFailure(endpoint, message) {
  const fresh = await Endpoint.findByIdAndUpdate(
    endpoint._id,
    { $inc: { consecutiveFailures: 1 }, lastCheckedAt: new Date() },
    { new: true },
  );

  const threshold = ALERT_ON_THRESHOLD[endpoint.alertOn] || 1;
  if (fresh.consecutiveFailures >= threshold) {
    // Reusing "drifted" as the generic "at risk" status since the Endpoint
    // status enum is currently healthy|drifted|paused. Consider splitting
    // into a dedicated "failing" status if the UI needs to distinguish
    // schema drift from uptime/latency/content failures.
    await updateEndpointStatus(endpoint._id, "drifted");
    await sendDowntimeAlert(endpoint._id, message);
  }
  return {
    status: "error",
    endpoint: endpoint.name,
    error: message,
    consecutiveFailures: fresh.consecutiveFailures,
  };
}

// Poller-driven check against a saved Endpoint — does drift detection plus
// whatever check types the Monitoring Wizard enabled for it.
export const checkEndpoint = async (endpoint) => {
  const checkTypes = endpoint.checkTypes?.length
    ? endpoint.checkTypes
    : ["schema_drift", "uptime"];

  try {
    const env = endpoint.environmentId
      ? await Environment.findOne({
          _id: endpoint.environmentId,
          userId: endpoint.userId,
        })
      : null;

    const headers = buildHeaders(endpoint, env);
    const url = resolveVars(endpoint.url, env);

    const params = {};
    for (const p of endpoint.params ?? [])
      if (p.enabled && p.key) params[p.key] = resolveVars(p.value, env);

    let data;
    if (endpoint.body?.kind === "json" || endpoint.body?.kind === "raw") {
      const raw = resolveVars(
        endpoint.body.raw || endpoint.body.json || "",
        env,
      );
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    const start = Date.now();
    const response = await axios({
      method: endpoint.method,
      url,
      headers,
      params,
      data,
      timeout: endpoint.timeoutMs || 10000,
      maxRedirects: endpoint.followRedirects === false ? 0 : 5,
      // We evaluate uptime/expectedStatus ourselves below, so don't let
      // axios throw on non-2xx — that would collapse into the catch block
      // and get misreported as a network error rather than an uptime failure.
      validateStatus: () => true,
    });
    const responseTime = Date.now() - start;

    const failures = [];

    if (checkTypes.includes("uptime")) {
      const expected = endpoint.expectedStatus;
      const ok = expected
        ? response.status === expected
        : response.status >= 200 && response.status < 300;
      if (!ok)
        failures.push(
          `Uptime: expected ${expected || "2xx"}, got ${response.status}`,
        );
    }

    if (
      checkTypes.includes("response_time") &&
      endpoint.responseTimeThresholdMs
    ) {
      if (responseTime > endpoint.responseTimeThresholdMs) {
        failures.push(
          `Response time ${responseTime}ms exceeded ${endpoint.responseTimeThresholdMs}ms threshold`,
        );
      }
    }

    if (checkTypes.includes("content_match") && endpoint.contentMatch?.field) {
      const actual = getValueAtPath(response.data, endpoint.contentMatch.field);
      if (String(actual) !== endpoint.contentMatch.value) {
        failures.push(
          `Content mismatch at "${endpoint.contentMatch.field}": expected "${endpoint.contentMatch.value}", got "${actual}"`,
        );
      }
    }

    if (failures.length > 0) {
      return await handleCheckFailure(endpoint, failures.join("; "));
    }

    // Clean pass — reset the failure streak.
    if (endpoint.consecutiveFailures > 0) {
      await Endpoint.findByIdAndUpdate(endpoint._id, {
        consecutiveFailures: 0,
      });
    }

    const responseData = response.data;

    if (checkTypes.includes("schema_drift")) {
      const currentSchema = extractSchema(responseData);
      const baselineSnapshot = await getBaselineSchema(endpoint._id);

      if (!baselineSnapshot) {
        await saveSchemaSnapshot(endpoint._id, currentSchema, true);
        await saveDataSnapshot(endpoint._id, responseData);
        await updateEndpointStatus(endpoint._id, "healthy");
        return { status: "baseline_set", endpoint: endpoint.name };
      }

      const diffResult = diffSchemas(baselineSnapshot.schema, currentSchema);
      if (diffResult.hasDrift) {
        await updateEndpointStatus(endpoint._id, "drifted");
        await Endpoint.findByIdAndUpdate(endpoint._id, {
          $inc: { driftCount: 1 },
        });
        await sendDriftAlert(endpoint._id, diffResult);
        return { status: "drifted", endpoint: endpoint.name, diffResult };
      }
    }

    // Always keep the last-good snapshot fresh, even when schema_drift isn't
    // one of this endpoint's enabled checks — proxy.controller's frozen-data
    // fallback depends on a DataSnapshot existing.
    await saveDataSnapshot(endpoint._id, responseData);
    await updateEndpointStatus(endpoint._id, "healthy");
    return { status: "healthy", endpoint: endpoint.name };
  } catch (err) {
    await touchEndpoint(endpoint._id);
    return await handleCheckFailure(endpoint, err.message);
  }
};
