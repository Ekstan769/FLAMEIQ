import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Query options for the admin user list.
 */
interface GetAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  profileType?: string; // 'USER' | 'VENDOR' | 'ADMIN'
}

/**
 * Fetches all registered users with profile data, pagination, search, and filtering.
 * Passwords are automatically excluded for security.
 */
export const getAllUsers = async (options: GetAllUsersOptions = {}) => {
  const { page = 1, limit = 20, search, profileType } = options;
  const skip = (page - 1) * limit;

  try {
    // Build dynamic where clause
    const where: Record<string, unknown> = { deletedAt: null };

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by profile type (USER, VENDOR, ADMIN)
    if (profileType) {
      where.profile = { profileType };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              profileType: true,
              businessName: true,
              phone: true,
              profilePic: true,
              address: true,
              isVerified: true,
              walletBalance: true,
              flagCount: true,
              flagReason: true,
            },
          },
          _count: {
            select: {
              orders: true,
              vendorOrders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error({ err: error }, "Database error while fetching all users");
    throw error;
  }
};

/**
 * Flags a vendor. After 3 flags the vendor account is automatically soft-deleted.
 * Returns the updated flag count and whether the vendor was auto-deleted.
 */
export const flagVendor = async (vendorId: string, reason: string) => {
  try {
    // Verify the user exists and has a VENDOR profile
    const user = await prisma.user.findUnique({
      where: { id: vendorId, deletedAt: null },
      include: { profile: true },
    });

    if (!user) {
      return { error: 'User not found or already deleted.', status: 404 };
    }

    if (!user.profile || user.profile.profileType !== 'VENDOR') {
      return { error: 'User is not a vendor.', status: 400 };
    }

    const newFlagCount = user.profile.flagCount + 1;
    const autoDeleted = newFlagCount >= 3;

    // Update flag count and reason in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { userId: vendorId },
        data: {
          flagCount: newFlagCount,
          flagReason: reason,
        },
      });

      // Auto-delete vendor after 3 flags
      if (autoDeleted) {
        await tx.user.update({
          where: { id: vendorId },
          data: { deletedAt: new Date() },
        });
        await tx.profile.update({
          where: { userId: vendorId },
          data: { deletedAt: new Date() },
        });
      }
    });

    logger.info(
      `Vendor ${vendorId} flagged (${newFlagCount}/3). Reason: ${reason}.${autoDeleted ? ' Auto-deleted.' : ''}`
    );

    return {
      flagCount: newFlagCount,
      autoDeleted,
      message: autoDeleted
        ? `Vendor has been flagged ${newFlagCount} times and has been automatically deleted.`
        : `Vendor has been flagged. Current flag count: ${newFlagCount}/3.`,
    };
  } catch (error) {
    logger.error({ err: error }, `Failed to flag vendor ${vendorId}`);
    throw error;
  }
};

/**
 * Admin soft-deletes a user and cascades the deletion to their Profile.
 * Returns the deleted user's basic info for confirmation.
 */
export const adminDeleteUser = async (targetUserId: string, adminId: string) => {
  try {
    // Verify the target user exists and is not already deleted
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return { error: 'User not found or already deleted.', status: 404 };
    }

    if (targetUserId === adminId) {
      return { error: 'You cannot delete your own account through this endpoint.', status: 400 };
    }

    const now = new Date();

    // Soft-delete user and cascade to profile in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { deletedAt: now },
      });

      // Cascade soft-delete to the profile (if it exists)
      await tx.profile.updateMany({
        where: { userId: targetUserId, deletedAt: null },
        data: { deletedAt: now },
      });
    });

    logger.info(`Admin ${adminId} soft-deleted user ${targetUserId} (${targetUser.email})`);

    return {
      message: `User account "${targetUser.name}" (${targetUser.email}) has been deleted.`,
      deletedUser: targetUser,
    };
  } catch (error) {
    logger.error({ err: error }, `Admin delete failed for target user ID: ${targetUserId} by Admin ID: ${adminId}`);
    throw error;
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