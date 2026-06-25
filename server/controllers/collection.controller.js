import Collection from "../models/Collection.js";
import Endpoint from "../models/Endpoint.js";
import { AppError } from "../middleware/error.middleware.js";

export const getCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ userId: req.user._id }).sort({
      createdAt: 1,
    });
    res.status(200).json({ success: true, collections });
  } catch (err) {
    next(err);
  }
};

export const upsertCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    if (!name) return next(new AppError("Collection name is required", 400));

    const collection = await Collection.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        $set: { name, parentId: parentId ?? null },
        $setOnInsert: { userId: req.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    res.status(200).json({ success: true, collection });
  } catch (err) {
    next(err);
  }
};

export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const all = await Collection.find({ userId: req.user._id });

    // Cascade: collect descendant ids (mirrors store.ts's local cascade logic)
    const ids = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      for (const c of all) {
        if (c.parentId && ids.has(c.parentId) && !ids.has(c._id)) {
          ids.add(c._id);
          added = true;
        }
      }
    }

    await Collection.deleteMany({
      _id: { $in: [...ids] },
      userId: req.user._id,
    });
    await Endpoint.updateMany(
      { collectionId: { $in: [...ids] }, userId: req.user._id },
      { $set: { collectionId: null } },
    );
    res.status(200).json({ success: true, message: "Collection deleted" });
  } catch (err) {
    next(err);
  }
};

export const moveCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { parentId: req.body.parentId ?? null } },
      { new: true },
    );
    if (!collection) return next(new AppError("Collection not found", 404));
    res.status(200).json({ success: true, collection });
  } catch (err) {
    next(err);
  }
};
