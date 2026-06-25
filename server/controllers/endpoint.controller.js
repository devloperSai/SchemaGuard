import Endpoint from "../models/Endpoint.js";
import { AppError } from "../middleware/error.middleware.js";
import { checkEndpoint } from "../services/proxyService.js";

export const getEndpoints = async (req, res, next) => {
  try {
    const endpoints = await Endpoint.find({ userId: req.user._id }).sort({
      updatedAt: -1,
    });
    res.status(200).json({ success: true, count: endpoints.length, endpoints });
  } catch (err) {
    next(err);
  }
};

export const getEndpoint = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));
    res.status(200).json({ success: true, endpoint });
  } catch (err) {
    next(err);
  }
};

// Matches store.ts's `upsertEndpoint` exactly: create if missing, replace if present.
export const upsertEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    delete payload.id;
    delete payload._id;
    delete payload.userId;

    if (!payload.name || !payload.url) {
      return next(new AppError("Name and URL are required", 400));
    }

    const endpoint = await Endpoint.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: payload, $setOnInsert: { userId: req.user._id } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    res.status(200).json({ success: true, endpoint });
  } catch (err) {
    next(err);
  }
};

export const deleteEndpoint = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));
    res.status(200).json({ success: true, message: "Endpoint deleted" });
  } catch (err) {
    next(err);
  }
};

export const toggleEndpoint = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));
    endpoint.status = endpoint.status === "paused" ? "healthy" : "paused";
    await endpoint.save();
    res.status(200).json({ success: true, endpoint });
  } catch (err) {
    next(err);
  }
};

// Manual "check now" — runs the same drift-detection logic the poller uses,
// but on demand, so you can test without waiting up to a minute.
export const checkEndpointNow = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));

    const result = await checkEndpoint(endpoint);
    const fresh = await Endpoint.findById(endpoint._id);
    res.status(200).json({ success: true, result, endpoint: fresh });
  } catch (err) {
    next(err);
  }
};
