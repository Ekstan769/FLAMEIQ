import { Router } from 'express';
import multer from 'multer';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  acceptOrder,
  setOrderOnRoute,
  setOrderDelivered,
  confirmDelivery,
  rejectOrder,
} from '../controllers/orderController.js';
import { authenticate, authorizeVendor } from '../controllers/authControl.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

// List all orders / create a new order
router.route('/')
  .post(createOrder)
  .get(getOrders);

// Get a specific order by ID
router.get('/:id', getOrderById);

// Buyer cancels their order (only while PAYMENT_PENDING)
router.patch('/:id/cancel', cancelOrder);

// Buyer confirms they received the order → triggers vendor payout
router.patch('/:id/confirm', confirmDelivery);

// Vendor routes — require VENDOR profile
router.patch(
  '/:id/accept',
  authorizeVendor,
  upload.fields([
    { name: 'beforeFillImage', maxCount: 1 },
    { name: 'afterFillImage', maxCount: 1 },
  ]),
  acceptOrder,
);
router.patch('/:id/on-route', authorizeVendor, setOrderOnRoute);
router.patch('/:id/delivered', authorizeVendor, setOrderDelivered);
router.patch('/:id/reject', authorizeVendor, rejectOrder);

export default router;