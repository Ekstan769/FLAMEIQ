import { Router } from 'express';
import {
  createOrder,
  getOrders,
  cancelOrder,
  acceptOrder,
  setOrderOnRoute,
  setOrderDelivered,
  rejectOrder,
} from '../controllers/orderController.js';
import { authenticate, authorizeVendor } from '../controllers/authControl.js';

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(authenticate);

// Routes for creating and fetching orders
router.route('/')
  .post(createOrder)
  .get(getOrders);

// Route for a user to cancel their own order
router.patch('/:id/cancel', cancelOrder);

// Routes for vendors to manage order status
router.patch('/:id/accept', authorizeVendor, acceptOrder);
router.patch('/:id/on-route', authorizeVendor, setOrderOnRoute);
router.patch('/:id/delivered', authorizeVendor, setOrderDelivered);
router.patch('/:id/reject', authorizeVendor, rejectOrder);

export default router;