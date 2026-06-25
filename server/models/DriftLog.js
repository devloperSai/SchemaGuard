import mongoose from "mongoose";

const driftLogSchema = new mongoose.Schema(
  {
    endpointId: { type: String, ref: "Endpoint", required: true },
    endpointName: { type: String },
    detectedAt: { type: Date, default: Date.now },
    addedFields: { type: Array, default: [] },
    removedFields: { type: Array, default: [] },
    typeChangedFields: { type: Array, default: [] },
    summary: { type: String, default: "" },
    // Aligned with the frontend's Severity type (low/medium/high/critical)
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["unacknowledged", "acknowledged", "resolved"],
      default: "unacknowledged",
    },
    acknowledgedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("DriftLog", driftLogSchema);
