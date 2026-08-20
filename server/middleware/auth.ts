import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface RequestWithUser extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

export const authenticate = (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "No token provided, authorization denied"
                }
            });
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "fallback_secret_key";
        const decoded = jwt.verify(token, secret) as { id: string; email: string; name: string };
        
        req.user = decoded;
        next();
    } catch (err: any) {
        return res.status(401).json({
            success: false,
            error: {
                code: "TOKEN_INVALID",
                message: "Token is not valid"
            }
        });
    }
};
