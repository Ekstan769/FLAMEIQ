import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { ProfileType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { uploadToCloudinary } from '../utils/upload.js';

/**
 * Handles the creation of a new order.
 * Order starts at PAYMENT_PENDING until payment is confirmed.
 */
export const createOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const { vendorId, items, type, cylinderId } = req.body;

    const order = await orderService.createOrder(userId, vendorId, items, type, cylinderId);
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error creating order');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Retrieves orders for the authenticated user.
 * - VENDOR: fetches all orders assigned to them (includes buyer info).
 * - USER: fetches their own order history.
 */
export const getOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const profileType = req.user!.profile?.profileType;

    let orders;
    if (profileType === ProfileType.VENDOR) {
      orders = await prisma.order.findMany({
        where: { vendorId: userId },
        include: {
          items: true,
          user: { select: { name: true, profile: { select: { phone: true, address: true, profilePic: true } } } },
          transactions: { select: { status: true, type: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await orderService.getOrderHistory(userId);
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching orders');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Retrieves a single order by ID.
 */
export const getOrderById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user!.id;
    const profileType = req.user!.profile?.profileType;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        transactions: true,
        vendor: { select: { name: true, profile: { select: { businessName: true, phone: true, profilePic: true, address: true } } } },
        user: { select: { name: true, profile: { select: { phone: true, address: true } } } },
        payout: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Only the buyer or the assigned vendor can view the order
    if (order.userId !== userId && order.vendorId !== userId && profileType !== ProfileType.ADMIN) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching order by ID');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a user cancelling their own order (only while PAYMENT_PENDING).
 */
export const cancelOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user!.id;

    const updatedOrder = await orderService.cancelOrder(orderId, userId);
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error cancelling order');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a vendor accepting an order.
 * Requires multipart form data with beforeFillImage and afterFillImage file uploads.
 */
export const acceptOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const beforeFile = files?.['beforeFillImage']?.[0];
    const afterFile = files?.['afterFillImage']?.[0];

    if (!beforeFile || !afterFile) {
      return res.status(400).json({
        success: false,
        message: 'Both beforeFillImage and afterFillImage are required to accept an order.',
      });
    }

    // Upload both images to Cloudinary
    const [beforeFillImage, afterFillImage] = await Promise.all([
      uploadToCloudinary(beforeFile.buffer, 'flameiq/cylinder-fills'),
      uploadToCloudinary(afterFile.buffer, 'flameiq/cylinder-fills'),
    ]);

    const updatedOrder = await orderService.acceptOrder(orderId, vendorId, beforeFillImage, afterFillImage);
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error accepting order');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a vendor marking an order as "On Route".
 */
export const setOrderOnRoute = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const updatedOrder = await orderService.markOrderAsOnRoute(orderId, vendorId);
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error setting order on route');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a vendor marking an order as "Delivered".
 * After this, the buyer must confirm receipt to trigger the payout.
 */
export const setOrderDelivered = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const updatedOrder = await orderService.markOrderAsDelivered(orderId, vendorId);
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error setting order as delivered');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles the buyer confirming they received their order.
 * This CONFIRMS the order and triggers the vendor payout (minus commission).
 */
export const confirmDelivery = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user!.id;

    const updatedOrder = await orderService.confirmDelivery(orderId, userId);
    return res.status(200).json({
      success: true,
      message: 'Delivery confirmed. The vendor payout has been initiated.',
      data: updatedOrder,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error confirming delivery');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a vendor rejecting an order. A refund is initiated automatically.
 */
export const rejectOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const updatedOrder = await orderService.rejectOrder(orderId, vendorId);
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error rejecting order');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};