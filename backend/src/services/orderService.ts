import { Order, OrderItem, OrderStatus, OrderType, PayoutStatus, Prisma, TxStatus, TxType } from '../generated/prisma/client.js';
import { prisma } from '../db/prisma.js';
import { notificationService } from './notificationService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import {
  OrderNotFoundError,
  UnauthorizedError,
  InvalidOrderStatusError,
  BadRequestError,
  AppError,
} from '../utils/errors.js';


// Use a type for creation that doesn't require all Order fields
type OrderItemCreateInput = Omit<OrderItem, 'id' | 'orderId' | 'price'> & {
  price: number | Prisma.Decimal;
};

const PLATFORM_COMMISSION_RATE = config.platformCommissionRate;

class OrderService {
  /**
   * Creates a new order. Order starts at PAYMENT_PENDING until payment is confirmed.
   * Commission is calculated and recorded; payout record is created for the vendor.
   */
  public async createOrder(
    userId: string,
    vendorId: string,
    items: OrderItemCreateInput[],
    type: OrderType,
    cylinderId?: string,
  ): Promise<Order> {
    if (!userId || !vendorId || !items || items.length === 0) {
      throw new BadRequestError('User ID, Vendor ID, and items are required to create an order.');
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const commission = totalAmount * PLATFORM_COMMISSION_RATE;
    const payoutAmount = totalAmount - commission;

    if (totalAmount <= 0) {
      throw new BadRequestError('Order total must be positive.');
    }

    try {
      const newOrder = await prisma.$transaction(async (tx) => {
        // Create the Order starting at PAYMENT_PENDING
        const order = await tx.order.create({
          data: {
            userId,
            vendorId,
            type,
            totalAmount,
            cylinderId,
            status: OrderStatus.PAYMENT_PENDING, // ← awaits payment before vendor is notified
            items: {
              create: items.map((item) => ({
                ...item,
                price: new Prisma.Decimal(item.price),
              })),
            },
          },
          include: { items: true },
        });

        // Create the PAYMENT transaction record (PENDING until confirmed by gateway)
        await tx.transaction.create({
          data: {
            orderId: order.id,
            sourceUserId: userId,
            amount: new Prisma.Decimal(totalAmount),
            commission: new Prisma.Decimal(commission),
            type: TxType.PAYMENT,
            status: TxStatus.PENDING,
            reference: `FLM-ORD-${order.id.substring(0, 8)}-${Date.now()}`,
            description: `Payment for Order #${order.id.substring(0, 8)}`,
            gateway: 'flutterwave',
          },
        });

        // Pre-create the Payout record for the vendor (PENDING until buyer confirms receipt)
        await tx.payout.create({
          data: {
            orderId: order.id,
            vendorId,
            amount: new Prisma.Decimal(payoutAmount),
            status: 'PENDING',
          },
        });

        return order;
      });

      // Notify buyer to proceed to payment
      await notificationService.sendToUser(userId, {
        title: 'Order Created!',
        message: `Order #${newOrder.id.substring(0, 8)} is ready. Please complete your payment to confirm.`,
        type: 'info',
      });

      return newOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Failed to create order in database');
      throw new AppError('Database operation failed during order creation.', 500);
    }
  }

  /**
   * Vendor accepts the order. Requires before-fill and after-fill image URLs.
   * Order must be in PENDING status (i.e., payment already confirmed).
   */
  public async acceptOrder(
    orderId: string,
    vendorId: string,
    beforeFillImage: string,
    afterFillImage: string,
  ): Promise<Order> {
    if (!beforeFillImage || !afterFillImage) {
      throw new BadRequestError(
        'Both before-fill and after-fill cylinder images are required to accept an order.',
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundError();
    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to accept this order.');
    }

    // Can only accept a PENDING (paid) order
    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusError( // This logic is now correct with the updated status flow
        `Order cannot be accepted in ${order.status} status. Payment must be confirmed first.`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.ACCEPTED,
        beforeFillImage,
        afterFillImage,
      },
    });

    await notificationService.sendToUser(order.userId, {
      title: 'Order Accepted!',
      message: `Your order #${orderId.substring(0, 8)} has been accepted by the vendor and is being prepared.`,
      type: 'success',
    });

    return updatedOrder;
  }

  /**
   * Vendor rejects a pending (paid) order. A refund transaction is recorded.
   */
  public async rejectOrder(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transactions: true },
    });
    if (!order) throw new OrderNotFoundError();
    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to reject this order.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusError(
        `Order cannot be rejected in ${order.status} status.`,
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REJECTED },
      });

      // Cancel the payout record
      await tx.payout.update({
        where: { orderId },
        data: { status: 'FAILED' },
      });

      // Create a REFUND transaction record (actual refund processing would happen via gateway)
      const paymentTx = order.transactions.find((t) => t.type === TxType.PAYMENT && t.status === TxStatus.SUCCESS);
      if (paymentTx) {
        await tx.transaction.create({
          data: {
            orderId: order.id,
            sourceUserId: order.userId,
            amount: paymentTx.amount,
            type: TxType.REFUND,
            status: TxStatus.PENDING, // Pending until gateway processes refund
            reference: `FLM-REFUND-${orderId.substring(0, 8)}-${Date.now()}`,
            description: `Refund for rejected Order #${orderId.substring(0, 8)}`,
          },
        });
      }

      return updated;
    });

    await notificationService.sendToUser(order.userId, {
      title: 'Order Rejected',
      message: `Your order #${orderId.substring(0, 8)} was rejected by the vendor. A refund will be processed shortly.`,
      type: 'error',
    });

    return updatedOrder;
  }

  /**
   * Vendor marks an accepted order as on route for delivery.
   */
  public async markOrderAsOnRoute(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundError();
    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to update this order.');
    }

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new InvalidOrderStatusError(
        `Order must be ACCEPTED before it can be marked as on route. Current: ${order.status}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ON_ROUTE },
    });

    await notificationService.sendToUser(order.userId, {
      title: 'Order On Route 🚚',
      message: `Your gas order #${orderId.substring(0, 8)} is on its way to you!`,
      type: 'info',
    });

    return updatedOrder;
  }

  /**
   * Vendor marks an on-route order as delivered.
   * Buyer must then confirm receipt to close the session and trigger payout.
   */
  public async markOrderAsDelivered(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundError();
    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to mark this order as delivered.');
    }

    if (order.status !== OrderStatus.ON_ROUTE) {
      throw new InvalidOrderStatusError(
        `Order cannot be marked as delivered in ${order.status} status.`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Prompt buyer to confirm receipt
    await notificationService.sendToUser(order.userId, {
      title: 'Order Delivered! ',
      message: `Your order #${orderId.substring(0, 8)} has been delivered. Please confirm receipt to release payment to the vendor.`,
      type: 'success',
    });

    return updatedOrder;
  }

  /**
   * Buyer confirms they received the order.
   * Moves order to CONFIRMED, triggers vendor payout (minus commission).
   */
  public async confirmDelivery(orderId: string, userId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) {
      throw new UnauthorizedError('You are not authorized to confirm this order.');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new InvalidOrderStatusError(
        `You can only confirm delivery when order status is DELIVERED. Current: ${order.status}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
    });

    // Notify vendor that payout is being triggered
    await notificationService.sendToUser(order.vendorId, {
      title: 'Delivery Confirmed!',
      message: `The buyer has confirmed receipt for Order #${orderId.substring(0, 8)}. Your payout is being processed.`,
      type: 'success',
    });

    // Mark the payout as READY_FOR_PROCESSING for the background job
    await prisma.payout.update({
      where: { orderId: order.id },
      data: { status: PayoutStatus.READY_FOR_PROCESSING },
    });

    return updatedOrder;
  }

  /**
   * User cancels their PAYMENT_PENDING order (before payment is made).
   */
  public async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to cancel this order.');
    }
    if (order.type === 'QUICK') {
      throw new BadRequestError('Quick orders cannot be cancelled.');
    }
    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new InvalidOrderStatusError(
        `Order can only be cancelled before payment is made. Current status: ${order.status}.`,
      );
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Get active orders for a user (excludes terminal states).
   */
  public async getActiveOrders(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        userId,
        status: {
          notIn: [
            OrderStatus.CANCELLED,
            OrderStatus.DELIVERED,
            OrderStatus.REJECTED,
            OrderStatus.CONFIRMED,
          ],
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all order history for a user.
   */
  public async getOrderHistory(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true, transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all orders for a vendor.
   */
  public async getOrdersForVendor(vendorId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { vendorId },
      include: {
        items: true,
        user: {
          select: {
            name: true,
            profile: { select: { phone: true, address: true, profilePic: true } },
          },
        },
        transactions: { select: { status: true, type: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderService = new OrderService();
