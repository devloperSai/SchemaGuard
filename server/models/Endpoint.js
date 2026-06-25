import mongoose from "mongoose";

const kvSchema = new mongoose.Schema(
  {
    id: String,
    key: String,
    value: String,
    enabled: { type: Boolean, default: true },
    description: String,
  },
  { _id: false },
);

const authSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["none", "bearer", "apiKey", "basic", "inherit"],
      default: "none",
    },
    bearer: String,
    apiKey: {
      key: String,
      value: String,
      in: { type: String, enum: ["header", "query"], default: "header" },
    },
    basic: {
      user: String,
      pass: String,
    },
  },
  { _id: false },
);

const bodySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: [
        "none",
        "json",
        "form-data",
        "x-www-form-urlencoded",
        "raw",
        "binary",
        "graphql",
      ],
      default: "none",
    },
    json: String,
    raw: String,
    rawLang: String,
    form: [kvSchema],
    urlencoded: [kvSchema],
  },
  { _id: false },
);

// _id is a plain String (e.g. "ep_4f9a2cz") because the frontend generates
// its own ids client-side and persists via upsert-by-id. This keeps the
// store.ts <-> API contract a 1:1 passthrough — no id translation needed.
const endpointSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Endpoint name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    url: { type: String, required: [true, "URL is required"], trim: true },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      default: "GET",
    },
    status: {
      type: String,
      enum: ["healthy", "drifted", "paused"],
      default: "healthy",
    },
    lastCheckedAt: { type: Date, default: Date.now },
    driftCount: { type: Number, default: 0 },
    collectionId: { type: String, default: null },
    intervalMin: { type: Number, default: 5, min: 1, max: 1440 },
    timeoutMs: { type: Number, default: 8000 },
    followRedirects: { type: Boolean, default: true },
    sslVerify: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    environmentId: { type: String, default: null },
    params: { type: [kvSchema], default: [] },
    headersKv: { type: [kvSchema], default: [] },
    auth: { type: authSchema, default: () => ({ kind: "none" }) },
    body: { type: bodySchema, default: () => ({ kind: "none" }) },
    preScript: { type: String, default: "" },
    postScript: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

endpointSchema.index({ userId: 1, collectionId: 1 });

export default mongoose.model("Endpoint", endpointSchema);
