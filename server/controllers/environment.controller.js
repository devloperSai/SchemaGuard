import Environment from "../models/Environment.js";
import { AppError } from "../middleware/error.middleware.js";

export const getEnvironments = async (req, res, next) => {
  try {
    const environments = await Environment.find({ userId: req.user._id }).sort({
      createdAt: 1,
    });
    res.status(200).json({ success: true, environments });
  } catch (err) {
    next(err);
  }
};

export const upsertEnvironment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, variables } = req.body;
    if (!name) return next(new AppError("Environment name is required", 400));

    const environment = await Environment.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        $set: { name, variables: variables ?? [] },
        $setOnInsert: { userId: req.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    res.status(200).json({ success: true, environment });
  } catch (err) {
    next(err);
  }
};

export const deleteEnvironment = async (req, res, next) => {
  try {
    const environment = await Environment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!environment) return next(new AppError("Environment not found", 404));
    res.status(200).json({ success: true, message: "Environment deleted" });
  } catch (err) {
    next(err);
  }
};
