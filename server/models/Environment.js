import mongoose from "mongoose";

const envVarSchema = new mongoose.Schema(
  {
    id: String,
    key: String,
    value: String,
    enabled: { type: Boolean, default: true },
    secret: { type: Boolean, default: false },
  },
  { _id: false },
);

// _id is a client-generated string ("env_xxxxx") for the same reason as
// Endpoint/Collection — upsert-by-id, zero id-translation between frontend
// store and API.
const environmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    variables: { type: [envVarSchema], default: [] },
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

export default mongoose.model("Environment", environmentSchema);
