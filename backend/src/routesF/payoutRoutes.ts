import { Router } from 'express';
import { authenticate, authorizeVendor } from '../controllers/authControl.js';
import { getPayoutHistory } from '../controllers/payoutController.js';

const router = Router();

/**
 * @swagger
 * /api/payouts/history:
 *   get:
 *     summary: Get payout history for the authenticated vendor
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the vendor's payouts, including order details.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (not a vendor).
 */
router.get('/history', authenticate, authorizeVendor, getPayoutHistory);

export default router;