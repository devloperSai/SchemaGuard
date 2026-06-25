import mongoose from "mongoose";

const dataSnapshotSchema = new mongoose.Schema(
  {
    endpointId: { type: String, ref: "Endpoint", required: true }, // String id now
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    isLastGood: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("DataSnapshot", dataSnapshotSchema);
