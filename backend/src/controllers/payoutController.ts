import { Request, Response } from 'express';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';

/**
 * Retrieves the payout history for the authenticated vendor.
 */
export const getPayoutHistory = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;

  try {
    const payouts = await prisma.payout.findMany({
      where: { vendorId },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    logger.error({ err: error, vendorId }, 'Failed to fetch payout history');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};