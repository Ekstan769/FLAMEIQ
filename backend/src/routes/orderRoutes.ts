import { Router } from 'express';
import {
  createOrder,
  cancelOrder,
  acceptOrder,
  getActiveOrders,
  getOrderHistory,
} from '../controllers/orderController.js';

const router = Router();

// Create an order
router.post('/', createOrder);

// User cancels an order
router.post('/:id/cancel', cancelOrder);

// Vendor accepts an order
router.post('/:id/accept', acceptOrder);

// Get active orders for a user
router.get('/', getActiveOrders);

// Get order history for a user
router.get('/history', getOrderHistory);

export default router;
