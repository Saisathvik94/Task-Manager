import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizeWorkspace } from "../middleware/rbac.js";

const router = express.Router();

// All task routes require JWT authentication
router.use(authenticate as any);

// RBAC middleware checks: members can view/create/update, but only OWNER can delete
router.post("/", authorizeWorkspace(["OWNER", "MEMBER"]) as any, createTask as any);
router.get("/", authorizeWorkspace(["OWNER", "MEMBER"]) as any, getTasks as any);
router.get("/:id", authorizeWorkspace(["OWNER", "MEMBER"]) as any, getTaskById as any);
router.put("/:id", authorizeWorkspace(["OWNER", "MEMBER"]) as any, updateTask as any);
router.delete("/:id", authorizeWorkspace(["OWNER"]) as any, deleteTask as any);

export default router;
