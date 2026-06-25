import { getLastGoodSnapshot } from "../services/snapshotManager.js";
import { checkEndpoint, executeRequest } from "../services/proxyService.js";
import Endpoint from "../models/Endpoint.js";
import { AppError } from "../middleware/error.middleware.js";

export const proxyRequest = async (req, res, next) => {
  try {
    const endpoint = await Endpoint.findOne({
      _id: req.params.endpointId,
      userId: req.user._id,
    });
    if (!endpoint) return next(new AppError("Endpoint not found", 404));
    if (endpoint.status === "paused")
      return next(new AppError("Endpoint is paused", 400));

    if (endpoint.status === "drifted") {
      const lastGood = await getLastGoodSnapshot(endpoint._id);
      if (!lastGood)
        return next(new AppError("No good snapshot available", 404));
      return res.status(200).json({
        success: true,
        frozen: true,
        frozenAt: lastGood.createdAt,
        message: "Schema drift detected — serving last known good data",
        data: lastGood.data,
      });
    }

    const result = await checkEndpoint(endpoint);

    if (result.status === "error") {
      const lastGood = await getLastGoodSnapshot(endpoint._id);
      if (lastGood) {
        return res.status(200).json({
          success: true,
          frozen: true,
          frozenAt: lastGood.createdAt,
          message: "API error — serving last known good data",
          data: lastGood.data,
        });
      }
      return next(
        new AppError("API unreachable and no snapshot available", 502),
      );
    }

    const freshSnapshot = await getLastGoodSnapshot(endpoint._id);
    res
      .status(200)
      .json({
        success: true,
        frozen: false,
        data: freshSnapshot?.data ?? null,
      });
  } catch (err) {
    next(err);
  }
};

// Backs the "Send" button — works even for an unsaved draft request.
export const executeAdhoc = async (req, res, next) => {
  try {
    const { method, url, headers, params, body, timeoutMs } = req.body;
    if (!url) return next(new AppError("URL is required", 400));
    const result = await executeRequest({
      method,
      url,
      headers,
      params,
      body,
      timeoutMs,
    });
    res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
};
