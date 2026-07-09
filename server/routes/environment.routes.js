import express from "express";
import {
  getEnvironments,
  upsertEnvironment,
  deleteEnvironment,
} from "../controllers/environment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getEnvironments);
router.route("/:id").put(upsertEnvironment).delete(deleteEnvironment);

export default router;
