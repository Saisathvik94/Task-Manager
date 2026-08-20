import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  addMember,
  removeMember
} from "../controllers/workspaceController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All workspace routes require authentication
router.use(authenticate as any);

router.post("/", createWorkspace as any);
router.get("/", getWorkspaces as any);
router.get("/:id", getWorkspaceById as any);
router.post("/:id/members", addMember as any);
router.delete("/:id/members/:userId", removeMember as any);

export default router;
