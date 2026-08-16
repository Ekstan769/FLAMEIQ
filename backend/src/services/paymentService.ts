import { Prisma, TxStatus, TxType, OrderStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { notificationService } from './notificationService.js';
import { AppError, BadRequestError, OrderNotFoundError } from '../utils/errors.js';

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? '0.10');
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;

class PaymentService {
  /**
   * Initiates a Flutterwave inline payment for an order.
   * Returns the payment link data to pass to the Flutterwave SDK on the frontend.
   */
  public async initiateFlutterwavePayment(
    orderId: string,
    userId: string,
    email: string,
    name: string,
  ): Promise<{ paymentLink: string; reference: string }> {
    if (!FLW_SECRET_KEY || !FLW_PUBLIC_KEY) {
      throw new AppError('Payment gateway is not configured.', 500);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transactions: true },
    });

    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) throw new AppError('Unauthorized.', 403);
    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new AppError('This order is not awaiting payment.', 400);
    }

    const pendingTx = order.transactions.find(
      (tx) => tx.type === TxType.PAYMENT && tx.status === TxStatus.PENDING,
    );
    if (!pendingTx) throw new AppError('No pending transaction found for this order.', 404);

    // Build the Flutterwave payment link via their API
    const payload = {
      tx_ref: pendingTx.reference,
      amount: Number(order.totalAmount),
      currency: 'NGN',
      redirect_url: `${process.env.FRONTEND_URL}/customer/orders/${orderId}?payment=redirect`,
      customer: { email, name },
      customizations: {
        title: 'FlameIQ Gas Order',
        description: `Payment for Order #${orderId.substring(0, 8)}`,
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { status: string; data?: { link: string }; message?: string };
    if (result.status !== 'success' || !result.data?.link) {
      logger.error({ result }, 'Flutterwave payment initiation failed');
      throw new AppError('Failed to initiate payment. Please try again.', 502);
    }

    return { paymentLink: result.data.link, reference: pendingTx.reference };
  }

  /**
   * Processes a payment from the user's in-app wallet balance.
   * Atomically deducts wallet, marks transaction as SUCCESS, and moves order to PENDING.
   */
  public async initiateWalletPayment(orderId: string, userId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transactions: true, vendor: true },
    });

    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) throw new AppError('Unauthorized.', 403);
    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new AppError('This order is not awaiting payment.', 400);
    }

    const pendingTx = order.transactions.find(
      (tx) => tx.type === TxType.PAYMENT && tx.status === TxStatus.PENDING,
    );
    if (!pendingTx) throw new AppError('No pending transaction found for this order.', 404);

    const totalAmount = new Prisma.Decimal(order.totalAmount);

    await prisma.$transaction(async (tx) => {
      // Check and deduct wallet balance atomically
      const profile = await tx.profile.findUnique({ where: { userId } });
      if (!profile) throw new AppError('User profile not found.', 404);
      if (profile.walletBalance.lessThan(totalAmount)) {
        throw new BadRequestError('Insufficient wallet balance.');
      }

      await tx.profile.update({
        where: { userId },
        data: { walletBalance: { decrement: totalAmount } },
      });

      // Mark payment transaction as SUCCESS
      await tx.transaction.update({
        where: { id: pendingTx.id },
        data: {
          status: TxStatus.SUCCESS,
          type: TxType.WALLET_PAY,
          gateway: 'wallet',
          gatewayReference: `WALLET-${Date.now()}`,
        },
      });

      // Move order from PAYMENT_PENDING → PENDING (awaiting vendor)
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING },
      });
    });

    // Notify buyer
    await notificationService.sendToUser(userId, {
      title: 'Payment Successful',
      message: 'Your wallet payment was successful. The vendor has been notified.',
      type: 'success',
    });

    // Notify vendor
    await notificationService.sendToUser(order.vendorId, {
      title: 'New Order Received!',
      message: `A new order has been placed and paid for. Order #${orderId.substring(0, 8)}.`,
      type: 'info',
    });
  }

  /**
   * Called after a confirmed payment (from Flutterwave webhook or redirect verify).
   * Marks transaction SUCCESS, moves order to PENDING, notifies buyer and vendor.
   */
  public async processSuccessfulPayment(
    transactionReference: string,
    gatewayReference: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { reference: transactionReference },
        include: { order: { include: { vendor: true } } },
      });

      if (!transaction || !transaction.orderId) {
        logger.warn(`No transaction found for reference: ${transactionReference}`);
        return;
      }

      if (transaction.status === TxStatus.SUCCESS) {
        logger.info(`Transaction ${transactionReference} already processed. Skipping.`);
        return;
      }

      // Mark transaction as SUCCESS
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TxStatus.SUCCESS, gatewayReference: String(gatewayReference) },
      });

      // Move order from PAYMENT_PENDING → PENDING
      await tx.order.update({
        where: { id: transaction.orderId },
        data: { status: OrderStatus.PENDING },
      });

      logger.info(`Payment confirmed for order ${transaction.orderId}`);

      // Notifications (fire after transaction commits)
      const order = transaction.order;
      if (order) {
        // Notify buyer
        setImmediate(async () => {
          await notificationService.sendToUser(order.userId, {
            title: 'Payment Confirmed!',
            message: `Your payment for Order #${order.id.substring(0, 8)} was successful. The vendor has been notified.`,
            type: 'success',
          });
          // Notify vendor
          await notificationService.sendToUser(order.vendorId, {
            title: 'New Order Ready!',
            message: `Order #${order.id.substring(0, 8)} has been paid. Please accept or reject it.`,
            type: 'info',
          });
        });
      }
    });
  }

  /**
   * Funds a user's in-app wallet after a successful Flutterwave top-up.
   * Called from the webhook handler when event type is a wallet funding transaction.
   */
  public async processWalletFunding(
    transactionReference: string,
    gatewayReference: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { reference: transactionReference },
      });

      if (!transaction || !transaction.sourceUserId) {
        logger.warn(`Wallet funding transaction not found: ${transactionReference}`);
        return;
      }

      if (transaction.status === TxStatus.SUCCESS) {
        logger.info(`Wallet funding ${transactionReference} already processed.`);
        return;
      }

      const amount = transaction.amount;

      // Credit wallet
      await tx.profile.update({
        where: { userId: transaction.sourceUserId },
        data: { walletBalance: { increment: amount } },
      });

      // Mark transaction SUCCESS
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TxStatus.SUCCESS, gatewayReference: String(gatewayReference) },
      });

      logger.info(`Wallet funded for user ${transaction.sourceUserId}: +${amount}`);

      setImmediate(async () => {
        await notificationService.sendToUser(transaction.sourceUserId!, {
          title: 'Wallet Funded!',
          message: `₦${Number(amount).toLocaleString()} has been added to your FlameIQ wallet.`,
          type: 'success',
        });
      });
    });
  }

  /**
   * Triggers a vendor payout via Flutterwave Transfer API.
   * Called after the buyer confirms receipt of an order.
   */
  public async triggerVendorPayout(orderId: string): Promise<void> {
    const payout = await prisma.payout.findUnique({
      where: { orderId },
      include: { vendor: { include: { profile: true } } },
    });

    if (!payout) {
      logger.warn(`No payout record found for order ${orderId}`);
      return;
    }

    if (payout.status !== 'PENDING') {
      logger.info(`Payout for order ${orderId} is already ${payout.status}. Skipping.`);
      return;
    }

    if (!FLW_SECRET_KEY) {
      logger.error('FLUTTERWAVE_SECRET_KEY not set. Cannot process payout.');
      return;
    }

    // Mark as PROCESSING before hitting the gateway
    await prisma.payout.update({
      where: { orderId },
      data: { status: 'PROCESSING' },
    });

    try {
      const response = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_bank: process.env.DEFAULT_PAYOUT_BANK ?? '044', // vendor's bank code
          account_number: payout.vendor.profile?.phone ?? '0000000000',
          amount: Number(payout.amount),
          currency: 'NGN',
          narration: `FlameIQ Payout - Order #${orderId.substring(0, 8)}`,
          reference: `PAYOUT-${orderId.substring(0, 8)}-${Date.now()}`,
        }),
      });

      const result = (await response.json()) as { status: string; data?: { id: number }; message?: string };

      if (result.status === 'success') {
        await prisma.payout.update({
          where: { orderId },
          data: {
            status: 'PAID',
            gatewayReference: String(result.data?.id),
          },
        });
        logger.info(`Payout successful for vendor ${payout.vendorId}, order ${orderId}`);

        await notificationService.sendToUser(payout.vendorId, {
          title: 'Payout Sent!',
          message: `₦${Number(payout.amount).toLocaleString()} has been sent to your account for Order #${orderId.substring(0, 8)}.`,
          type: 'success',
        });
      } else {
        throw new Error(result.message ?? 'Payout API failed');
      }
    } catch (err) {
      logger.error({ err }, `Payout failed for order ${orderId}. Marking as FAILED.`);
      await prisma.payout.update({
        where: { orderId },
        data: { status: 'FAILED' },
      });

      await notificationService.sendToUser(payout.vendorId, {
        title: 'Payout Failed',
        message: `We encountered an issue sending your payout for Order #${orderId.substring(0, 8)}. Our team will resolve this.`,
        type: 'error',
      });
    }
  }

  /**
   * Initiates a wallet top-up via Flutterwave.
   * Creates a PENDING WALLET_FUND transaction, then returns a payment link.
   */
  public async initiatWalletFund(
    userId: string,
    email: string,
    name: string,
    amount: number,
  ): Promise<{ paymentLink: string; reference: string }> {
    if (!FLW_SECRET_KEY || !FLW_PUBLIC_KEY) {
      throw new AppError('Payment gateway is not configured.', 500);
    }

    if (amount <= 0) throw new BadRequestError('Amount must be positive.');

    const reference = `FLM-WLT-${userId.substring(0, 8)}-${Date.now()}`;

    // Create PENDING WALLET_FUND transaction record
    await prisma.transaction.create({
      data: {
        sourceUserId: userId,
        amount: new Prisma.Decimal(amount),
        type: TxType.WALLET_FUND,
        status: TxStatus.PENDING,
        reference,
        description: `Wallet top-up of ₦${amount.toLocaleString()}`,
        gateway: 'flutterwave',
      },
    });

    const payload = {
      tx_ref: reference,
      amount,
      currency: 'NGN',
      redirect_url: `${process.env.FRONTEND_URL}/customer/wallet?fund=redirect`,
      customer: { email, name },
      customizations: {
        title: 'FlameIQ Wallet Top-Up',
        description: `Fund your FlameIQ wallet with ₦${amount.toLocaleString()}`,
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { status: string; data?: { link: string }; message?: string };
    if (result.status !== 'success' || !result.data?.link) {
      logger.error({ result }, 'Flutterwave wallet funding initiation failed');
      throw new AppError('Failed to initiate wallet funding. Please try again.', 502);
    }

    return { paymentLink: result.data.link, reference };
  }
}

export const paymentService = new PaymentService();