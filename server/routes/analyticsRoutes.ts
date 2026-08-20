import express from "express";
import { getWorkspaceAnalytics } from "../controllers/analyticsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Analytics routes require JWT authentication
router.get("/", authenticate as any, getWorkspaceAnalytics as any);

export default router;
