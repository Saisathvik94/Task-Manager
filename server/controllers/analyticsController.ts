import { Request, Response, NextFunction } from "express";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import { RequestWithUser } from "../middleware/auth.js";
import mongoose from "mongoose";

export const getWorkspaceAnalytics = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { workspaceId } = req.query;

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

    // Verify workspace membership
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }
      });
    }

    const isMember = workspace.members.some((m: any) => m.user.toString() === req.user?.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have access to this workspace" }
      });
    }

    const wsObjectId = new mongoose.Types.ObjectId(workspaceId as string);
    const now = new Date();

    // 1. Run basic task counts aggregation
    const countsPipeline = [
      { $match: { workspace: wsObjectId } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          pendingTasks: { $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] } },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "done"] },
                    { $lt: ["$dueDate", now] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const [countsResult] = await Task.aggregate(countsPipeline);
    
    const totalTasks = countsResult?.totalTasks || 0;
    const completedTasks = countsResult?.completedTasks || 0;
    const pendingTasks = countsResult?.pendingTasks || 0;
    const overdueTasks = countsResult?.overdueTasks || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Tasks by Status
    const statusResult = await Task.aggregate([
      { $match: { workspace: wsObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    statusResult.forEach((item: any) => {
      if (item._id in statusMap) {
        statusMap[item._id as keyof typeof statusMap] = item.count;
      }
    });

    // 3. Tasks by Priority
    const priorityResult = await Task.aggregate([
      { $match: { workspace: wsObjectId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const priorityMap = { low: 0, medium: 0, high: 0 };
    priorityResult.forEach((item: any) => {
      if (item._id in priorityMap) {
        priorityMap[item._id as keyof typeof priorityMap] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionPercentage
        },
        byStatus: statusMap,
        byPriority: priorityMap
      }
    });
  } catch (err: any) {
    next(err);
  }
};
