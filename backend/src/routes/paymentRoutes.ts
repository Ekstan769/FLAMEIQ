import { Router } from 'express';
import {
  initiatePayment,
  verifyPayment,
  getWalletBalance,
  fundWallet,
  getWalletTransactions,
  handleFlutterwaveWebhook,
} from '../controllers/paymentController.js';
import { authenticate } from '../controllers/authControl.js';

const router = Router();

// --- Webhook (no auth — called by Flutterwave servers) ---
router.post('/webhook/flutterwave', handleFlutterwaveWebhook);

// --- All routes below require authentication ---
router.use(authenticate);

// Initiate payment for an order (Flutterwave or Wallet)
router.post('/initiate', initiatePayment);

// Verify payment status by reference (called after Flutterwave redirect)
router.get('/verify/:reference', verifyPayment);

// Wallet endpoints
router.get('/wallet/balance', getWalletBalance);
router.post('/wallet/fund', fundWallet);
router.get('/wallet/transactions', getWalletTransactions);

export default router;
