import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import { RequestWithUser } from "../middleware/auth.js";

const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(100)
});

const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER")
});

export const createWorkspace = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const result = createWorkspaceSchema.safeParse(req.body);
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

    const workspace = new Workspace({
      name: result.data.name,
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          role: "OWNER"
        }
      ]
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      data: workspace
    });
  } catch (err: any) {
    next(err);
  }
};

export const getWorkspaces = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const workspaces = await Workspace.find({
      "members.user": req.user.id
    }).populate("members.user", "name email");

    res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (err: any) {
    next(err);
  }
};

export const getWorkspaceById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const workspace = await Workspace.findById(id).populate("members.user", "name email");

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }
      });
    }

    // Authorization check
    const isMember = workspace.members.some((m: any) => m.user?._id.toString() === req.user?.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have access to this workspace" }
      });
    }

    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (err: any) {
    next(err);
  }
};

export const addMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = inviteMemberSchema.safeParse(req.body);
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

    const { email, role } = result.data;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }
      });
    }

    // Only OWNER can add members
    const memberRequesting = workspace.members.find((m: any) => m.user.toString() === req.user?.id);
    if (!memberRequesting || memberRequesting.role !== "OWNER") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only workspace owners can add members" }
      });
    }

    // Find the user to invite
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User with this email was not found" }
      });
    }

    // Check if user is already a member
    const alreadyMember = workspace.members.some((m: any) => m.user.toString() === invitedUser._id.toString());
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        error: { code: "ALREADY_MEMBER", message: "User is already a member of this workspace" }
      });
    }

    // Add to members list
    workspace.members.push({ user: invitedUser._id as any, role: role as any });
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(id).populate("members.user", "name email");

    res.status(200).json({
      success: true,
      data: populatedWorkspace
    });
  } catch (err: any) {
    next(err);
  }
};

export const removeMember = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: { code: "WORKSPACE_NOT_FOUND", message: "Workspace not found" }
      });
    }

    // Only OWNER can remove members (except self leaving - members can leave on their own, wait, owner cannot leave unless transferring ownership)
    const memberRequesting = workspace.members.find((m: any) => m.user.toString() === req.user?.id);
    if (!memberRequesting) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have access to this workspace" }
      });
    }

    const isSelfRemove = userId === req.user?.id;
    if (!isSelfRemove && memberRequesting.role !== "OWNER") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only workspace owners can remove members" }
      });
    }

    // Prevent removing the owner if they are the only owner
    const targetMember = workspace.members.find((m: any) => m.user.toString() === userId);
    if (targetMember?.role === "OWNER") {
      const otherOwners = workspace.members.filter((m: any) => m.role === "OWNER" && m.user.toString() !== userId);
      if (otherOwners.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: "OWNER_REQUIRED", message: "Cannot remove the only owner of a workspace" }
        });
      }
    }

    // Remove from members list
    workspace.members = workspace.members.filter((m: any) => m.user.toString() !== userId) as any;
    
    // If the workspace becomes completely empty, we can clean up or keep it. Mongoose schema handles array filtering.
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(id).populate("members.user", "name email");

    res.status(200).json({
      success: true,
      data: populatedWorkspace
    });
  } catch (err: any) {
    next(err);
  }
};
