import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';

export const createOrder = (req: Request, res: Response) => {
  try {
    const { userId, vendorId, items, type } = req.body;

    if (!userId || !vendorId || !items || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type !== 'standard' && type !== 'quick') {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    const order = orderService.createOrder(userId, vendorId, items, type);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const order = orderService.cancelOrder(id, userId);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const acceptOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }

    const order = orderService.acceptOrder(id, vendorId);
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getActiveOrders = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const orders = orderService.getActiveOrders(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderHistory = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    const orders = orderService.getOrderHistory(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
