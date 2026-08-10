import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Fetches all registered users from the database.
 * Passwords are automatically excluded for security.
 */
export const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  } catch (error) {
    logger.error({ err: error }, "Database error while fetching all users");
    throw error;
  }
};

export const adminDeleteUser = async (req: Request, res: Response): Promise<Response> => {
  const { id: targetUserId } = req.params;

  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized access." });
  }

  // Security: Ensure the user performing the action is an admin.
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to perform this action." });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account through this endpoint." });
  }

  try {
    const result = await prisma.user.updateMany({
      where: { id: targetUserId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: "User not found or already deleted." });
    }

    return res.status(200).json({ success: true, message: `User account (ID: ${targetUserId}) has been soft-deleted by Admin.` });
  } catch (error) {
    logger.error({ err: error }, `Admin delete failed for target user ID: ${targetUserId} by Admin ID: ${req.user.id}`);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
};

export const selfDeleteUser = async (req: Request, res: Response): Promise<Response> => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized access." });
  }

  const targetUserId = req.user.id;

  try {
    const result = await prisma.user.updateMany({
      where: { id: targetUserId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: "Account not found or already deleted." });
    }

    return res.status(200).json({ success: true, message: "Your account has been soft-deleted successfully." });
  } catch (error) {
    logger.error({ err: error }, `Self-delete failed for user ID: ${targetUserId}`);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
  }
};