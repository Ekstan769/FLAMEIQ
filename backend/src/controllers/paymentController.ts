import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { paymentService } from '../services/paymentService.js';
import { AppError, BadRequestError } from '@/utils/errors.js';
import { prisma } from '@/db/prisma.js';
import { payWithBankTransferSchema, payWithCardSchema, payWithCardTokenSchema } from '@/validators/paymentValidators.js';
import { Order, Transaction } from '@/generated/prisma/client.js';

async function getPendingOrderPayment(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.userId !== userId) throw new AppError('You are not allowed to pay for this order.', 403);

  const transaction = await prisma.transaction.findFirst({
    where: { orderId, status: 'PENDING', type: 'PAYMENT' },
  });
  if (!transaction) throw new AppError('No pending payment transaction found for this order.', 404);
  
  // Return a tuple for easier destructuring
  return [order, transaction] as [Order, Transaction];
}

export const paymentController = {
  async initiatePayment(req: Request, res: Response) {
    const { orderId, method } = req.body as { orderId?: string; method?: string };
    if (!orderId || !['flutterwave', 'wallet'].includes(method ?? '')) {
      throw new BadRequestError('orderId and a valid payment method (flutterwave, wallet) are required.');
    }
    const [order, transaction] = await getPendingOrderPayment(orderId, req.user!.id);
    
    if (method === 'flutterwave') {
      const payment = await paymentService.createVirtualAccountForOrder(order, transaction);
      return res.status(200).json({ success: true, data: payment });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
    if (!profile || profile.walletBalance.lessThan(order.totalAmount)) {
      throw new BadRequestError('Insufficient wallet balance.');
    }
    await prisma.$transaction([
      prisma.profile.update({ where: { userId: req.user!.id }, data: { walletBalance: { decrement: order.totalAmount } } }),
      prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'SUCCESS', gateway: 'wallet' } }),
      prisma.order.update({ where: { id: order.id }, data: { status: 'PENDING' } }),
    ]);
    return res.status(200).json({ success: true, data: { reference: transaction.reference, status: 'SUCCESS' } });
  },

  async verifyPayment(req: Request, res: Response) {
    const transaction = await prisma.transaction.findUnique({ where: { reference: req.params.reference } });
    if (!transaction || (transaction.sourceUserId !== req.user!.id && transaction.userId !== req.user!.id)) {
      throw new AppError('Payment not found.', 404);
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
    const amount = Number(req.body?.amount);
    const data = await paymentService.initiateWalletFunding(req.user!.id, amount);
    return res.status(201).json({ success: true, data });
  },
  /**
   * Provides the Flutterwave public key to the client for encryption.
   */
  async getPublicKey(req: Request, res: Response) {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;

    if (!publicKey) {
      logger.error('FLUTTERWAVE_PUBLIC_KEY is not set in environment variables.');
      return res.status(503).json({ // Using 503 Service Unavailable is appropriate here
        success: false, // This is already consistent, which is good.
        message: 'Payment service is not configured correctly.',
      });
    }

    return res.status(200).json({ // Standardizing response format
      success: true,
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
        success: false,
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }
    const { orderId, encryptedCardDetails, redirectUrl } = result.data;
    const userId = req.user!.id;

    const [order, transaction] = await getPendingOrderPayment(orderId, userId);

    const paymentData = await paymentService.initiateCardPayment(
      order,
      transaction,
      JSON.stringify(encryptedCardDetails), // FIX: Ensure the object is stringified
      redirectUrl
    );

    return res.status(200).json({
      success: true,
      message: 'Card payment initiated successfully.',
      data: paymentData,
    });
  },

  /**
   * Charges a Flutterwave tokenized payment method. Card details never pass
   * through this endpoint and must never be decrypted by the application.
   */
  async payWithCardToken(req: Request, res: Response) {
    const result = payWithCardTokenSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { orderId, paymentMethodId, redirectUrl } = result.data;
    const [order, transaction] = await getPendingOrderPayment(orderId, req.user!.id);
    const paymentData = await paymentService.initiateTokenizedCardPayment(
      order,
      transaction,
      paymentMethodId,
      redirectUrl,
    );

    return res.status(200).json({
      success: true,
      message: 'Tokenized card payment initiated successfully.',
      data: paymentData,
    });
  },

  /**
   * Creates a virtual bank account for a bank transfer payment.
   */
  async payWithBankTransfer(req: Request, res: Response) {
    const result = payWithBankTransferSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body.',
        errors: result.error.flatten().fieldErrors,
      });
    }
    const { orderId } = result.data;
    const userId = req.user!.id;

    const [order, transaction] = await getPendingOrderPayment(orderId, userId);
    const paymentData = await paymentService.createVirtualAccountForOrder(order, transaction);

    return res.status(200).json({
      success: true,
      message: 'Virtual account created successfully.',
      data: paymentData,
    });
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
  },
};
