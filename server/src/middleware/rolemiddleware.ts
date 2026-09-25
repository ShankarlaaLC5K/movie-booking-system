import { NextFunction, Response } from "express";
import { AuthRequest } from "./authMiddleware";
import { User } from "../models/User";

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const user = await User.findById(req.userId).select("role");

      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Admin access required",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Admin authorization error:", error);

      res.status(500).json({
        success: false,
        message: "Authorization check failed",
      });
    }
  })();
}
