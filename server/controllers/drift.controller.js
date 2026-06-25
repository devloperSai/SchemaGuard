import DriftLog from "../models/DriftLog.js";
import Endpoint from "../models/Endpoint.js";
import { AppError } from "../middleware/error.middleware.js";

export const getDriftLogs = async (req, res, next) => {
  try {
    const endpoints = await Endpoint.find({ userId: req.user._id }).select(
      "_id",
    );
    const endpointIds = endpoints.map((e) => e._id);

    const logs = await DriftLog.find({ endpointId: { $in: endpointIds } })
      .populate("endpointId", "name url")
      .sort({ detectedAt: -1 });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

export const getDriftLogsByEndpoint = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOne({
      _id: req.params.endpointId,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));

    const logs = await DriftLog.find({
      endpointId: req.params.endpointId,
    }).sort({
      detectedAt: -1,
    });
    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

export const acknowledgeDrift = async (req, res, next) => {
  try {
    const log = await DriftLog.findById(req.params.id).populate("endpointId");
    if (!log) return next(new AppError("Drift log not found", 404));
    if (log.endpointId.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized", 403));
    }
    log.status = "acknowledged";
    log.acknowledgedAt = new Date();
    await log.save();
    res.status(200).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// Resolve a drift log — resets endpoint baseline to current schema
export const resolveDrift = async (req, res, next) => {
  try {
    const log = await DriftLog.findById(req.params.id).populate("endpointId");
    if (!log) return next(new AppError("Drift log not found", 404));
    if (log.endpointId.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized", 403));
    }

    log.status = "resolved";
    log.resolvedAt = new Date();
    await log.save();

    // FIX: "unknown" is not a valid Endpoint.status value (enum is
    // healthy|drifted|paused). Mark it healthy — the next poll will set a
    // fresh baseline anyway since we clear isBaseline below.
    await Endpoint.findByIdAndUpdate(log.endpointId._id, { status: "healthy" });

    const SchemaSnapshot = (await import("../models/SchemaSnapshot.js"))
      .default;
    await SchemaSnapshot.updateMany(
      { endpointId: log.endpointId._id },
      { isBaseline: false },
    );

    res.status(200).json({
      success: true,
      message: "Drift resolved — new baseline will be set on next poll",
      log,
    });
  } catch (err) {
    next(err);
  }
};
