import { Request, Response } from 'express';
import { orderService } from '@/services/orderService.js';
import { logger } from '@/utils/logger.js';
import { AppError, BadRequestError, InvalidOrderStatusError, OrderNotFoundError, UnauthorizedError } from '@/utils/errors.js';

export const createOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { vendorId, items, type, cylinderId } = req.body;

  if (!vendorId || !items || !type) {
    return res.status(400).json({ success: false, message: 'vendorId, items, and type are required.' });
  }

  try {
    const order = await orderService.createOrder(userId, vendorId, items, type, cylinderId);
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error({ err: error }, 'Order creation failed in controller');
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const order = await orderService.cancelOrder(id, userId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    logger.warn({ err: error, orderId: id, userId }, 'Order cancellation failed');
    // Handle custom errors with a status code property
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;
  const { id } = req.params;

  try {
    const order = await orderService.acceptOrder(id, vendorId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    logger.warn({ err: error, orderId: id, vendorId }, 'Accepting order failed');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const markOrderAsOnRoute = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;
  const { id } = req.params;
  try {
    const order = await orderService.markOrderAsOnRoute(id, vendorId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    logger.warn({ err: error, orderId: id, vendorId }, 'Marking order as on-route failed');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const markOrderAsDelivered = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;
  const { id } = req.params;
  try {
    const order = await orderService.markOrderAsDelivered(id, vendorId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    logger.warn({ err: error, orderId: id, vendorId }, 'Marking order as delivered failed');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectOrder = async (req: Request, res: Response) => {
  const vendorId = req.user!.id;
  const { id } = req.params;
  try {
    const order = await orderService.rejectOrder(id, vendorId);
    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    logger.warn({ err: error, orderId: id, vendorId }, 'Rejecting order failed');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    try {
        const orders = await orderService.getOrderHistory(userId);
        return res.status(200).json({ success: true, data: orders });
    } catch (error) {
        logger.error({ err: error, userId }, 'Failed to get user orders');
        return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
    }
};
