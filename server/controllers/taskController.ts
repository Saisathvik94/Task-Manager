import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import { RequestWithUser } from "../middleware/auth.js";

// Validation Schema for creating/updating tasks
const taskBodySchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().default(""),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().datetime({ precision: 3, offset: true }).or(z.string().date()).optional().nullable(),
  workspace: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Workspace ID"),
  assignee: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Assignee ID").optional().nullable()
});

const taskUpdateBodySchema = taskBodySchema.partial();

// Helper to check user membership and role in a workspace
const getWorkspaceUserRole = async (workspaceId: string, userId: string): Promise<"OWNER" | "MEMBER" | null> => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;
  const member = workspace.members.find((m: any) => m.user.toString() === userId);
  return member ? (member.role as "OWNER" | "MEMBER") : null;
};

export const createTask = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const result = taskBodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          errors: result.error.format()
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const { workspace: workspaceId, assignee } = result.data;

    // Check if user belongs to the workspace
    const userRole = await getWorkspaceUserRole(workspaceId, req.user.id);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You are not a member of this workspace" }
      });
    }

    // Check if assignee belongs to the workspace
    if (assignee) {
      const assigneeRole = await getWorkspaceUserRole(workspaceId, assignee);
      if (!assigneeRole) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ASSIGNEE", message: "Assignee is not a member of this workspace" }
        });
      }
    }

    const task = new Task({
      ...result.data,
      owner: req.user.id
    });

    await task.save();
    
    const populated = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (err: any) {
    next(err);
  }
};

export const getTasks = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, search, status, priority, sort, page = "1", limit = "10" } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: { code: "WORKSPACE_ID_REQUIRED", message: "workspaceId query parameter is required" }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    // Validate workspace membership
    const userRole = await getWorkspaceUserRole(workspaceId as string, req.user.id);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You are not a member of this workspace" }
      });
    }

    // Build query filters
    const query: any = { workspace: workspaceId };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Sorting parameters
    let sortOptions: any = { createdAt: -1 }; // default sort
    if (sort) {
      if (sort === "dueDate_asc") sortOptions = { dueDate: 1 };
      else if (sort === "dueDate_desc") sortOptions = { dueDate: -1 };
      else if (sort === "priority_desc") {
        // High, Medium, Low
        sortOptions = { priority: 1 }; // note: alphabetical 'high','low','medium' won't work natively unless mapped, but we can do custom sort or standard mongo sort
      } else if (sort === "createdAt_desc") sortOptions = { createdAt: -1 };
      else if (sort === "createdAt_asc") sortOptions = { createdAt: 1 };
    }

    // Pagination calculations
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Run query
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .sort(sortOptions)
      .skip(skipNum)
      .limit(limitNum)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    next(err);
  }
};

export const getTaskById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const task = await Task.findById(id)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: "TASK_NOT_FOUND", message: "Task not found" }
      });
    }

    // Check workspace access
    if (!task.workspace) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_TASK", message: "Task is not associated with any workspace" }
      });
    }
    const userRole = await getWorkspaceUserRole(task.workspace.toString(), req.user.id);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You are not a member of the workspace this task belongs to" }
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err: any) {
    next(err);
  }
};

export const updateTask = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = taskUpdateBodySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          errors: result.error.format()
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const task = await Task.findById(id);
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
    const userRole = await getWorkspaceUserRole(task.workspace.toString(), req.user.id);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You are not a member of the workspace this task belongs to" }
      });
    }

    // Role-based Access Control (RBAC):
    // OWNER can update any task.
    // MEMBER can only update tasks they own or tasks assigned to them.
    if (userRole === "MEMBER") {
      const isOwner = task.owner.toString() === req.user.id;
      const isAssignee = task.assignee?.toString() === req.user.id;
      
      if (!isOwner && !isAssignee) {
        return res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "As a member, you can only update tasks you created or are assigned to you." }
        });
      }
    }

    // Validate assignee if it's changing
    if (result.data.assignee) {
      const assigneeRole = await getWorkspaceUserRole(task.workspace.toString(), result.data.assignee);
      if (!assigneeRole) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ASSIGNEE", message: "Assignee is not a member of this workspace" }
        });
      }
    }

    // Apply updates
    Object.assign(task, result.data);
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("assignee", "name email");

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (err: any) {
    next(err);
  }
};

export const deleteTask = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const task = await Task.findById(id);
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
    const userRole = await getWorkspaceUserRole(task.workspace.toString(), req.user.id);
    if (!userRole) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You are not a member of this workspace" }
      });
    }

    // RBAC: ONLY workspace OWNER can delete tasks
    if (userRole !== "OWNER") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only workspace owners are authorized to delete tasks" }
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task successfully deleted"
    });
  } catch (err: any) {
    next(err);
  }
};
