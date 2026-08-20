import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "../middleware/auth.js";

// Validation schemas
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required")
});

const generateToken = (user: any) => {
    return jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        process.env.JWT_SECRET || "fallback_secret_key",
        { expiresIn: "7d" }
    );
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = registerSchema.safeParse(req.body);
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

        const { name, email, password } = result.data;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "An account with this email address already exists"
                }
            });
        }

        // Create new user
        const user = new User({ name, email, password });
        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (err: any) {
        next(err);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = loginSchema.safeParse(req.body);
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

        const { email, password } = result.data;

        // Find user by email
        const user: any = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password"
                }
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (err: any) {
        next(err);
    }
};

export const getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Not authenticated"
                }
            });
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(444).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found"
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (err: any) {
        next(err);
    }
};

export const logout = async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Successfully logged out"
    });
};
