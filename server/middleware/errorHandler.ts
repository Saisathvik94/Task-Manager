import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    errors?: any;
}

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const code = err.code || "INTERNAL_SERVER_ERROR";

    // Log the error for internal tracking
    console.error(`[Error] ${code}: ${message}`, err.errors || err.stack);

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
            ...(err.errors && { details: err.errors })
        }
    });
};
