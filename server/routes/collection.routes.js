import express from "express";
import {
  getCollections,
  upsertCollection,
  deleteCollection,
  moveCollection,
} from "../controllers/collection.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getCollections);
router.route("/:id").put(upsertCollection).delete(deleteCollection);
router.patch("/:id/move", moveCollection);

export default router;
