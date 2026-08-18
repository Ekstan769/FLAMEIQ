import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { paymentService } from '../services/paymentService.js';
import { AppError } from '@/utils/errors.js';
import { prisma } from '@/db/prisma.js';
import { payWithBankTransferSchema, payWithCardSchema, payWithCardTokenSchema } from '@/validators/paymentValidators.js';

async function getPendingOrderPayment(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.userId !== userId) throw new AppError('You are not allowed to pay for this order.', 403);

  const transaction = await prisma.transaction.findFirst({
    where: { orderId, status: 'PENDING', type: 'PAYMENT' },
  });
  if (!transaction) throw new AppError('No pending payment transaction found for this order.', 404);
  return { order, transaction };
}

export const paymentController = {
  async initiatePayment(req: Request, res: Response) {
    try {
      const { orderId, method } = req.body as { orderId?: string; method?: string };
      if (!orderId || !['flutterwave', 'wallet'].includes(method ?? '')) {
        return res.status(400).json({ success: false, message: 'orderId and a valid payment method are required.' });
      }
      const { order, transaction } = await getPendingOrderPayment(orderId, req.user!.id);

      if (method === 'flutterwave') {
        const payment = await paymentService.createVirtualAccountForOrder(order, transaction);
        return res.status(200).json({ success: true, data: payment });
      }

      const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
      if (!profile || profile.walletBalance.lessThan(order.totalAmount)) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
      }
      await prisma.$transaction([
        prisma.profile.update({ where: { userId: req.user!.id }, data: { walletBalance: { decrement: order.totalAmount } } }),
        prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'SUCCESS', gateway: 'wallet' } }),
        prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING' } }),
      ]);
      return res.status(200).json({ success: true, data: { reference: transaction.reference, status: 'SUCCESS' } });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({ success: false, message: error instanceof AppError ? error.message : 'Unable to initiate payment.' });
    }
  },

  async verifyPayment(req: Request, res: Response) {
    const transaction = await prisma.transaction.findUnique({ where: { reference: req.params.reference } });
    if (!transaction || (transaction.sourceUserId !== req.user!.id && transaction.userId !== req.user!.id)) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    return res.status(200).json({ success: true, data: transaction });
  },

  async getWalletBalance(req: Request, res: Response) {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { walletBalance: true } });
    return res.status(200).json({ success: true, data: { balance: profile?.walletBalance ?? 0 } });
  },

  async getWalletTransactions(req: Request, res: Response) {
    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ userId: req.user!.id }, { sourceUserId: req.user!.id }, { destinationUserId: req.user!.id }] },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: transactions });
  },

  async fundWallet(req: Request, res: Response) {
    try {
      const amount = Number(req.body?.amount);
      const data = await paymentService.initiateWalletFunding(req.user!.id, amount);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({ success: false, message: error instanceof AppError ? error.message : 'Unable to start wallet funding.' });
    }
  },
  /**
   * Provides the Flutterwave public key to the client for encryption.
   */
  async getPublicKey(req: Request, res: Response) {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;

    if (!publicKey) {
      logger.error('FLUTTERWAVE_PUBLIC_KEY is not set in environment variables.');
      return res.status(503).json({
        status: 'error',
        message: 'Payment service is not configured correctly.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        publicKey,
      },
    });
  },
  /**
   * Initiates a card payment for a given order.
   */
  async payWithCard(req: Request, res: Response) {
    const result = payWithCardSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }
    const { orderId, encryptedCardDetails, redirectUrl } = result.data;

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found.' });
      }
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ status: 'error', message: 'You are not allowed to pay for this order.' });
      }

      const transaction = await prisma.transaction.findFirst({
        where: { orderId, status: 'PENDING', type: 'PAYMENT' },
      });

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'No pending payment transaction found for this order.',
        });
      }

      const paymentData = await paymentService.initiateCardPayment(
        order,
        transaction,
        encryptedCardDetails,
        redirectUrl
      );

      return res.status(200).json({
        status: 'success',
        message: 'Card payment initiated successfully.',
        data: paymentData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message });
      }
      logger.error({ err: error }, 'Error initiating card payment');
      return res.status(500).json({
        status: 'error',
        message: 'An internal server error occurred during card payment initiation.',
      });
    }
  },

  /**
   * Charges a Flutterwave tokenized payment method. Card details never pass
   * through this endpoint and must never be decrypted by the application.
   */
  async payWithCardToken(req: Request, res: Response) {
    const result = payWithCardTokenSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { orderId, paymentMethodId, redirectUrl } = result.data;
    try {
      const { order, transaction } = await getPendingOrderPayment(orderId, req.user!.id);
      const paymentData = await paymentService.initiateTokenizedCardPayment(
        order,
        transaction,
        paymentMethodId,
        redirectUrl,
      );

      return res.status(200).json({
        status: 'success',
        message: 'Tokenized card payment initiated successfully.',
        data: paymentData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message });
      }
      logger.error({ err: error }, 'Error initiating tokenized card payment');
      return res.status(500).json({ status: 'error', message: 'Unable to initiate tokenized card payment.' });
    }
  },

  /**
   * Creates a virtual bank account for a bank transfer payment.
   */
  async payWithBankTransfer(req: Request, res: Response) {
    const result = payWithBankTransferSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }
    const { orderId } = result.data;

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found.' });
      }

      const transaction = await prisma.transaction.findFirst({
        where: { orderId, status: 'PENDING', type: 'PAYMENT' },
      });

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'No pending payment transaction found for this order.',
        });
      }

      const paymentData = await paymentService.createVirtualAccountForOrder(order, transaction);

      return res.status(200).json({
        status: 'success',
        message: 'Virtual account created successfully.',
        data: paymentData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message });
      }
      logger.error({ err: error }, 'Error creating virtual account');
      return res.status(500).json({
        status: 'error',
        message: 'An internal server error occurred during virtual account creation.',
      });
    }
  },

  /**
   * Handles incoming webhooks from Flutterwave.
   */
  async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['flutterwave-signature'] as string;

    // Securely verify webhook signature
    if (!paymentService.verifyWebhookSignature(signature)) {
      logger.warn('Invalid webhook signature received.');
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    logger.info(`Received Flutterwave webhook: ${event.type}`);

    try {
      // Process based on event type
      switch (event.type) {
        case 'charge.completed':
          await paymentService.processSuccessfulCharge(event.data);
          break;
        case 'transfer.disburse':
          await paymentService.processPayoutDisbursement(event.data);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      res.status(200).send('Received');
    } catch (error) {
      logger.error({ err: error }, 'Error processing webhook');
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const message =
        error instanceof AppError ? error.message : 'Internal server error while processing webhook';
      res.status(statusCode).json({ status: 'error', message });
    }
  },
};
