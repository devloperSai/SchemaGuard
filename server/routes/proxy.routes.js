import express from "express";
import { proxyRequest, executeAdhoc } from "../controllers/proxy.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.post("/execute", executeAdhoc);
router.get("/:endpointId", proxyRequest);

export default router;
