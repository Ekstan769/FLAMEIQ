import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, vendorId, items, type } = req.body;

    if (!userId || !vendorId || !items || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['standard', 'quick'].includes(type)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    const order = await orderService.createOrder(userId, vendorId, items, type);
    return res.status(201).json(order);
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to create order');
    return res.status(500).json({ error: 'An unexpected error occurred while creating the order.' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '`userId` is required' });
    }

    const order = await orderService.cancelOrder(id, userId);
    return res.json(order);
  } catch (error: any) {
    logger.error({ err: error, orderId: req.params.id }, 'Failed to cancel order');
    return res.status(500).json({ error: 'An unexpected error occurred while canceling the order.' });
  }
};

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: '`vendorId` is required' });
    }

    const order = await orderService.acceptOrder(id, vendorId);
    return res.json(order);
  } catch (error: any) {
    logger.error({ err: error, orderId: req.params.id }, 'Failed to accept order');
    return res.status(500).json({ error: 'An unexpected error occurred while accepting the order.' });
  }
};

export const getActiveOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required' });
    }

    const orders = await orderService.getActiveOrders(userId);
    return res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderHistory = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string; // Note: This should be async if orderService is

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required' });
    }

    const orders = orderService.getOrderHistory(userId);
    return res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
