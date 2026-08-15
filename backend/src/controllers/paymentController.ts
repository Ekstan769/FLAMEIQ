import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { TxType } from '@prisma/client';
import { paymentService } from '../services/paymentService.js';
import { AppError, BadRequestError } from '../utils/errors.js';

/**
 * POST /api/payments/initiate
 * Buyer initiates payment for an order via Flutterwave or Wallet.
 * Body: { orderId, method: 'flutterwave' | 'wallet' }
 */
export const initiatePayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const name = req.user!.name;
    const { orderId, method } = req.body;

    if (!orderId || !method) {
      throw new BadRequestError('orderId and method are required.');
    }

    if (method === 'wallet') {
      await paymentService.initiateWalletPayment(orderId, userId);
      return res.status(200).json({ success: true, message: 'Payment deducted from wallet successfully.' });
    }

    if (method === 'flutterwave') {
      const result = await paymentService.initiateFlutterwavePayment(orderId, userId, email, name);
      return res.status(200).json({ success: true, data: result });
    }

    throw new BadRequestError('Invalid payment method. Use "flutterwave" or "wallet".');
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error initiating payment');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * GET /api/payments/verify/:reference
 * Verifies payment status after a Flutterwave redirect.
 * Called on the frontend after user is redirected back from Flutterwave checkout.
 */
export const verifyPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { reference } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { order: true },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: transaction.status,
        orderId: transaction.orderId,
        amount: transaction.amount,
        type: transaction.type,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error verifying payment');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * GET /api/payments/wallet/balance
 * Returns the authenticated user's current wallet balance.
 */
export const getWalletBalance = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: { walletBalance: profile.walletBalance },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching wallet balance');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * POST /api/payments/wallet/fund
 * Initiates a wallet top-up via Flutterwave.
 * Body: { amount: number }
 */
export const fundWallet = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const name = req.user!.name;
    const { amount } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestError('A valid positive amount is required.');
    }

    const result = await paymentService.initiatWalletFund(userId, email, name, Number(amount));
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error({ err: error }, 'Error initiating wallet funding');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * GET /api/payments/wallet/transactions
 * Returns the wallet transaction history for the authenticated user.
 */
export const getWalletTransactions = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ sourceUserId: userId }, { destinationUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching wallet transactions');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * POST /api/payments/webhook/flutterwave
 * Handles incoming webhooks from Flutterwave for charge.completed events.
 * Supports both order payments and wallet funding events.
 */
export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'] as string;

  if (!secretHash) {
    logger.error('FLUTTERWAVE_SECRET_HASH is not set. Cannot verify webhook.');
    return res.status(500).send('Webhook secret not configured.');
  }

  // Validate signature using timing-safe comparison
  let isSignatureValid = false;
  if (signature) {
    try {
      const expectedBuf = Buffer.from(secretHash);
      const receivedBuf = Buffer.from(signature);
      if (expectedBuf.length === receivedBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error during webhook signature validation.');
      isSignatureValid = false;
    }
  }

  if (!isSignatureValid) {
    logger.warn('Invalid webhook signature received.');
    return res.status(401).send('Invalid signature.');
  }

  // Acknowledge receipt immediately (Flutterwave expects fast response)
  res.status(200).send('Webhook received.');

  const payload = req.body;
  if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
    const { tx_ref: transactionReference, id: gatewayReference } = payload.data;

    try {
      // Determine if this is an order payment or a wallet top-up
      const transaction = await prisma.transaction.findUnique({
        where: { reference: transactionReference },
      });

      if (!transaction) {
        logger.warn(`Webhook: no transaction found for reference ${transactionReference}`);
        return;
      }

      if (transaction.type === TxType.WALLET_FUND) {
        await paymentService.processWalletFunding(transactionReference, String(gatewayReference));
      } else {
        await paymentService.processSuccessfulPayment(transactionReference, String(gatewayReference));
      }

      logger.info(`Webhook processed successfully for reference: ${transactionReference}`);
    } catch (error) {
      logger.error({ err: error }, `Error processing webhook for reference: ${transactionReference}`);
    }
  }
};