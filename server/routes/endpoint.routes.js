import express from "express";
import {
  getEndpoints,
  getEndpoint,
  upsertEndpoint,
  deleteEndpoint,
  toggleEndpoint,
  checkEndpointNow,
} from "../controllers/endpoint.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getEndpoints);
router
  .route("/:id")
  .get(getEndpoint)
  .put(upsertEndpoint)
  .delete(deleteEndpoint);
router.patch("/:id/toggle", toggleEndpoint);
router.post("/:id/check", checkEndpointNow);

export default router;
