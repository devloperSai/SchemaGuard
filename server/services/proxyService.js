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
import { sendDriftAlert, sendDowntimeAlert } from "./alertService.js";

function buildHeaders(endpoint) {
  const headers = {};
  for (const h of endpoint.headersKv ?? []) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }
  if (endpoint.auth?.kind === "bearer" && endpoint.auth.bearer) {
    headers["Authorization"] = `Bearer ${endpoint.auth.bearer}`;
  }
  if (endpoint.auth?.kind === "apiKey" && endpoint.auth.apiKey?.key) {
    if ((endpoint.auth.apiKey.in ?? "header") === "header") {
      headers[endpoint.auth.apiKey.key] = endpoint.auth.apiKey.value;
    }
  }
  if (endpoint.auth?.kind === "basic" && endpoint.auth.basic?.user) {
    const token = Buffer.from(
      `${endpoint.auth.basic.user}:${endpoint.auth.basic.pass ?? ""}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${token}`;
  }
  return headers;
}

// Ad-hoc request executor — backs the "Send" button in EndpointBuilder.
// Runs server-side so the browser never has to deal with CORS or mixed content.
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

// Poller-driven check against a saved Endpoint — does drift detection.
export const checkEndpoint = async (endpoint) => {
  try {
    const headers = buildHeaders(endpoint);
    const params = {};
    for (const p of endpoint.params ?? [])
      if (p.enabled && p.key) params[p.key] = p.value;

    let data;
    if (endpoint.body?.kind === "json" || endpoint.body?.kind === "raw") {
      const raw = endpoint.body.raw || endpoint.body.json || "";
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      headers,
      params,
      data,
      timeout: endpoint.timeoutMs || 10000,
      maxRedirects: endpoint.followRedirects === false ? 0 : 5,
    });

    const responseData = response.data;
    const currentSchema = extractSchema(responseData);
    const baselineSnapshot = await getBaselineSchema(endpoint._id);

    if (!baselineSnapshot) {
      await saveSchemaSnapshot(endpoint._id, currentSchema, true);
      await saveDataSnapshot(endpoint._id, responseData);
      await updateEndpointStatus(endpoint._id, "healthy");
      return { status: "baseline_set", endpoint: endpoint.name };
    }

    const diffResult = diffSchemas(baselineSnapshot.schema, currentSchema);

    if (!diffResult.hasDrift) {
      await saveDataSnapshot(endpoint._id, responseData);
      await updateEndpointStatus(endpoint._id, "healthy");
      return { status: "healthy", endpoint: endpoint.name };
    }

    // Drift detected — flip status, bump the counter the UI displays
    // (dashboard table + endpoint badges read `driftCount` directly),
    // and fire the alert (email + socket).
    await updateEndpointStatus(endpoint._id, "drifted");
    await Endpoint.findByIdAndUpdate(endpoint._id, { $inc: { driftCount: 1 } });
    await sendDriftAlert(endpoint._id, diffResult);
    return { status: "drifted", endpoint: endpoint.name, diffResult };
  } catch (err) {
    await touchEndpoint(endpoint._id);
    await sendDowntimeAlert(endpoint._id, err.message);
    return { status: "error", endpoint: endpoint.name, error: err.message };
  }
};

