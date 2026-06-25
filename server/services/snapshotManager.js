import SchemaSnapshot from "../models/SchemaSnapshot.js";
import DataSnapshot from "../models/DataSnapshot.js";
import Endpoint from "../models/Endpoint.js";

export const saveSchemaSnapshot = async (
  endpointId,
  schema,
  isBaseline = false,
) => {
  if (isBaseline)
    await SchemaSnapshot.updateMany({ endpointId }, { isBaseline: false });
  return await SchemaSnapshot.create({ endpointId, schema, isBaseline });
};

export const getBaselineSchema = async (endpointId) =>
  await SchemaSnapshot.findOne({ endpointId, isBaseline: true }).sort({
    createdAt: -1,
  });

export const saveDataSnapshot = async (endpointId, data) => {
  await DataSnapshot.updateMany(
    { endpointId, isLastGood: true },
    { isLastGood: false },
  );
  return await DataSnapshot.create({ endpointId, data, isLastGood: true });
};

export const getLastGoodSnapshot = async (endpointId) =>
  await DataSnapshot.findOne({ endpointId, isLastGood: true }).sort({
    createdAt: -1,
  });

export const updateEndpointStatus = async (endpointId, status) =>
  await Endpoint.findByIdAndUpdate(
    endpointId,
    { status, lastCheckedAt: new Date() },
    { new: true },
  );

export const touchEndpoint = async (endpointId) =>
  await Endpoint.findByIdAndUpdate(
    endpointId,
    { lastCheckedAt: new Date() },
    { new: true },
  );
