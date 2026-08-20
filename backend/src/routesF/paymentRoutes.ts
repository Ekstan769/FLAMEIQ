import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../controllers/authControl.js';

const router = Router();

// --- Webhook (no auth — called by Flutterwave servers) ---
router.post('/webhook/flutterwave', paymentController.handleWebhook);

// --- All routes below require authentication ---
router.use(authenticate);

router.get('/public-key', paymentController.getPublicKey);
router.post('/card', paymentController.payWithCard);
router.post('/card/token', paymentController.payWithCardToken);
router.post('/bank-transfer', paymentController.payWithBankTransfer);
router.post('/initiate', paymentController.initiatePayment);
router.get('/verify/:reference', paymentController.verifyPayment);
router.get('/wallet/balance', paymentController.getWalletBalance);
router.get('/wallet/transactions', paymentController.getWalletTransactions);
router.post('/wallet/fund', paymentController.fundWallet);

export default router;
