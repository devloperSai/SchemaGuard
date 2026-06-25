import express from "express";
import {
  getSample,
  toggleSchema,
  getSchemaStatus,
} from "../controllers/test.controller.js";

const router = express.Router();

router.get("/sample", getSample);
router.get("/schema-status", getSchemaStatus);
router.post("/toggle", toggleSchema);

export default router;
