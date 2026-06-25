import nodemailer from "nodemailer";
import { getIO } from "../config/socket.js";
import DriftLog from "../models/DriftLog.js";
import Endpoint from "../models/Endpoint.js";
import User from "../models/User.js";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

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

const sendEmailAlert = async (user, endpoint, driftLog) => {
  try {
    const transporter = createTransporter();
    const removedList = driftLog.removedFields
      .map((f) => `• REMOVED: ${f.field} (${f.baselineType})`)
      .join("\n");
    const addedList = driftLog.addedFields
      .map((f) => `• ADDED: ${f.field} (${f.liveType})`)
      .join("\n");
    const typeChangedList = driftLog.typeChangedFields
      .map(
        (f) => `• TYPE CHANGED: ${f.field} (${f.baselineType} → ${f.liveType})`,
      )
      .join("\n");
    const changes = [removedList, addedList, typeChangedList]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from: `"SchemaGuard" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 Schema Drift Detected — ${endpoint.name}`,
      text: `Schema drift detected on: ${endpoint.name}\nURL: ${endpoint.url}\nDetected at: ${new Date().toLocaleString()}\nSeverity: ${driftLog.severity.toUpperCase()}\n\nChanges:\n${changes}\n\nDashboard is protected — showing last good data.\nLog in to SchemaGuard to acknowledge and remap fields.`,
    });
    console.log(`Email alert sent to ${user.email}`);
  } catch (err) {
    console.error("Email alert failed:", err.message);
  }
};

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

    try {
      const io = getIO();
      io.to(endpoint.userId.toString()).emit("drift_alert", {
        endpointId,
        endpointName: endpoint.name,
        severity: diffResult.severity,
        detectedAt: driftLog.detectedAt,
        driftLogId: driftLog._id,
      });
    } catch (socketErr) {
      console.error("Socket alert failed:", socketErr.message);
    }

    await sendEmailAlert(user, endpoint, driftLog);
    return driftLog;
  } catch (err) {
    console.error("sendDriftAlert error:", err.message);
  }
};
