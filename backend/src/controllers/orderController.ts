import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '@/utils/errors.js';
import { ProfileType } from '@prisma/client';
import { prisma } from '@/db/prisma.js';

/**
 * Handles the creation of a new order.
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
 * If the user is a VENDOR, it fetches orders assigned to them.
 * If the user is a regular USER, it fetches their own orders.
 */
export const getOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const profileType = req.user!.profile?.profileType;

    let orders;
    if (profileType === ProfileType.VENDOR) {
      // Vendor: get all orders assigned to them
      orders = await prisma.order.findMany({
        where: { vendorId: userId },
        include: { items: true, user: { select: { name: true, profile: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Customer: get their order history
      orders = await orderService.getOrderHistory(userId);
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching orders');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * Handles a user cancelling their own order.
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
 */
export const acceptOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const updatedOrder = await orderService.acceptOrder(orderId, vendorId);
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
 * Handles a vendor rejecting an order.
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