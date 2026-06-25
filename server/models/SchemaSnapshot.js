import mongoose from "mongoose";

const schemaSnapshotSchema = new mongoose.Schema(
  {
    endpointId: { type: String, ref: "Endpoint", required: true }, // String id now
    schema: { type: mongoose.Schema.Types.Mixed, required: true },
    isBaseline: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("SchemaSnapshot", schemaSnapshotSchema);
