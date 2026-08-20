import { Response, NextFunction } from "express";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import { RequestWithUser } from "./auth.js";

export interface RequestWithWorkspace extends RequestWithUser {
  workspaceMemberRole?: "OWNER" | "MEMBER";
  task?: any;
}

export const authorizeWorkspace = (allowedRoles: ("OWNER" | "MEMBER")[]) => {
  return async (req: RequestWithWorkspace, res: Response, next: NextFunction) => {
    try {
      let workspaceId = req.params.workspaceId || req.query.workspaceId || req.body?.workspace || req.body?.workspaceId || req.headers["x-workspace-id"];
      
      // If we are touching a task route (e.g. /tasks/:id) and there's a task ID in params
      const taskId = req.params.id;
      if (!workspaceId && taskId && req.baseUrl.includes("/tasks")) {
        const task = await Task.findById(taskId);
        if (!task) {
          return res.status(404).json({
            success: false,
            error: { code: "TASK_NOT_FOUND", message: "Task not found" }
          });
        }
        if (!task.workspace) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_TASK", message: "Task is not associated with any workspace" }
          });
        }
        workspaceId = task.workspace.toString();
        req.task = task; // attach task so controller doesn't need to query it again
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "WORKSPACE_ID_REQUIRED",
            message: "Workspace context (workspaceId) is required."
          }
        });
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({
          success: false,
          error: {
            code: "WORKSPACE_NOT_FOUND",
            message: "Workspace not found"
          }
        });
      }

      const member = workspace.members.find((m: any) => m.user.toString() === req.user?.id);
      if (!member) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied. You are not a member of this workspace."
          }
        });
      }

      if (!allowedRoles.includes(member.role as any)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied. Insufficient permissions."
          }
        });
      }

      req.workspaceMemberRole = member.role as "OWNER" | "MEMBER";
      next();
    } catch (err: any) {
      next(err);
    }
  };
};
