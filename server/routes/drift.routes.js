import express from "express";
import {
  getDriftLogs,
  getDriftLogsByEndpoint,
  acknowledgeDrift,
  resolveDrift,
} from "../controllers/drift.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getDriftLogs);
router.get("/endpoint/:endpointId", getDriftLogsByEndpoint);
router.patch("/:id/acknowledge", acknowledgeDrift);
router.patch("/:id/resolve", resolveDrift);

export default router;
