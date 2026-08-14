import { Request, Response } from 'express';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';

export const createReview = async (req: Request, res: Response) => {
  const authorId = req.user!.id;
  const { orderId, rating, comment } = req.body;

  if (!orderId || rating === undefined) {
    return res.status(400).json({ success: false, message: 'Order ID and rating are required.' });
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5.' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.userId !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only review your own orders.' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'You can only review delivered orders.' });
    }

    if (order.review) {
      return res.status(409).json({ success: false, message: 'A review for this order already exists.' });
    }

    const newReview = await prisma.review.create({
      data: {
        orderId,
        rating,
        comment: comment || null,
        authorId,
        targetUserId: order.vendorId, // The vendor is the target of the review
      },
    });

    return res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create review');
    return res.status(500).json({ success: false, message: 'Failed to create review.' });
  }
};