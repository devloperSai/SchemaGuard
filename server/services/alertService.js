import nodemailer from "nodemailer";
import { getIO } from "../config/socket.js";
import DriftLog from "../models/DriftLog.js";
import Endpoint from "../models/Endpoint.js";
import User from "../models/User.js";

// Don't re-send a downtime email more than once per 30 min while the
// endpoint is still unreachable — avoids spamming on every poll cycle.
const DOWNTIME_ALERT_COOLDOWN_MS = 30 * 60 * 1000;

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === "465",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// Single choke point for every outgoing alert email (drift AND downtime).
// TEAM_ALERT_EMAIL is optional — CC a shared/on-call inbox alongside the
// endpoint owner without needing a real multi-user/team model yet.
const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SchemaGuard" <${process.env.EMAIL_USER}>`,
      to,
      cc: process.env.TEAM_ALERT_EMAIL || undefined,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

const emitSocketAlert = (userId, payload) => {
  try {
    getIO().to(userId.toString()).emit("drift_alert", payload);
  } catch (err) {
    console.error("Socket alert failed:", err.message);
  }
};

function buildSummary(diffResult) {
  const parts = [];
  if (diffResult.removedFields.length)
    parts.push(`${diffResult.removedFields.length} removed`);
  if (diffResult.typeChangedFields.length)
    parts.push(`${diffResult.typeChangedFields.length} type-changed`);
  if (diffResult.addedFields.length)
    parts.push(`${diffResult.addedFields.length} added`);
  return parts.join(", ") || "Schema changed";
}

export const sendDriftAlert = async (endpointId, diffResult) => {
  try {
    const endpoint = await Endpoint.findById(endpointId);
    if (!endpoint) return;

    const user = await User.findById(endpoint.userId);
    if (!user) return;

    const driftLog = await DriftLog.create({
      endpointId,
      endpointName: endpoint.name,
      addedFields: diffResult.addedFields,
      removedFields: diffResult.removedFields,
      typeChangedFields: diffResult.typeChangedFields,
      severity: diffResult.severity,
      summary: buildSummary(diffResult),
    });

    emitSocketAlert(endpoint.userId, {
      endpointId,
      endpointName: endpoint.name,
      severity: diffResult.severity,
      detectedAt: driftLog.detectedAt,
      driftLogId: driftLog._id,
    });

    const removedList = driftLog.removedFields
      .map((f) => `- REMOVED: ${f.field} (${f.baselineType})`)
      .join("\n");
    const addedList = driftLog.addedFields
      .map((f) => `- ADDED: ${f.field} (${f.liveType})`)
      .join("\n");
    const typeChangedList = driftLog.typeChangedFields
      .map(
        (f) =>
          `- TYPE CHANGED: ${f.field} (${f.baselineType} -> ${f.liveType})`,
      )
      .join("\n");
    const changes = [removedList, addedList, typeChangedList]
      .filter(Boolean)
      .join("\n");

    await sendEmail({
      to: user.email,
      subject: `[SchemaGuard] Schema drift detected — ${endpoint.name}`,
      text: `Schema drift detected on: ${endpoint.name}
URL: ${endpoint.url}
Detected at: ${new Date().toLocaleString()}
Severity: ${diffResult.severity.toUpperCase()}

Changes:
${changes}

Dashboard is protected — showing last good data.
Log in to SchemaGuard to acknowledge and remap fields.`,
    });

    return driftLog;
  } catch (err) {
    console.error("sendDriftAlert error:", err.message);
  }
};

// Fires whenever a poll/on-demand check throws — network error, timeout,
// DNS failure, connection refused, etc. Reuses the same DriftLog collection
// (severity "critical", empty diff arrays) so downtime shows up in the
// existing Alerts page / endpoint Drift History with zero new UI or schema.
export const sendDowntimeAlert = async (endpointId, errorMessage) => {
  try {
    const endpoint = await Endpoint.findById(endpointId);
    if (!endpoint) return;

    const user = await User.findById(endpoint.userId);
    if (!user) return;

    const recentOpenAlert = await DriftLog.findOne({
      endpointId,
      summary: { $regex: "^API unreachable" },
      status: { $ne: "resolved" },
      detectedAt: { $gte: new Date(Date.now() - DOWNTIME_ALERT_COOLDOWN_MS) },
    }).sort({ detectedAt: -1 });

    if (recentOpenAlert) return recentOpenAlert; // already alerted recently, stay quiet

    const driftLog = await DriftLog.create({
      endpointId,
      endpointName: endpoint.name,
      addedFields: [],
      removedFields: [],
      typeChangedFields: [],
      severity: "critical",
      summary: `API unreachable: ${errorMessage}`.slice(0, 500),
    });

    emitSocketAlert(endpoint.userId, {
      endpointId,
      endpointName: endpoint.name,
      severity: "critical",
      detectedAt: driftLog.detectedAt,
      driftLogId: driftLog._id,
    });

    await sendEmail({
      to: user.email,
      subject: `[SchemaGuard] API DOWN — ${endpoint.name}`,
      text: `SchemaGuard could not reach one of your monitored endpoints.

Endpoint: ${endpoint.name}
URL: ${endpoint.url}
Detected at: ${new Date().toLocaleString()}
Error: ${errorMessage}

We'll keep serving the last known-good response to your dashboard until this recovers.
Log in to SchemaGuard for details.`,
    });

    console.log(`Downtime alert sent for ${endpoint.name} to ${user.email}`);
    return driftLog;
  } catch (err) {
    console.error("sendDowntimeAlert error:", err.message);
  }
};
