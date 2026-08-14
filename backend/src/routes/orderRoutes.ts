import { Router } from 'express';
import { authenticate, authorizeVendor } from '../controllers/authControl.js';
import { createOrder, cancelOrder, acceptOrder, getMyOrders, markOrderAsOnRoute, markOrderAsDelivered, rejectOrder } from '../controllers/orderController.js';

const router = Router();

// All order routes require a user to be authenticated
router.use(authenticate);

router.route('/').post(createOrder).get(getMyOrders);

router.patch('/:id/cancel', cancelOrder);

// Vendor-specific actions
router.patch('/:id/accept', authorizeVendor, acceptOrder);
router.patch('/:id/reject', authorizeVendor, rejectOrder);
router.patch('/:id/on-route', authorizeVendor, markOrderAsOnRoute);
router.patch('/:id/delivered', authorizeVendor, markOrderAsDelivered);

export default router;