import { Order, OrderItem, OrderStatus, OrderType, Prisma, TxStatus, TxType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';
import { OrderNotFoundError, UnauthorizedError, InvalidOrderStatusError, BadRequestError, AppError } from '@/utils/errors.js';

// Use a type for creation that doesn't require all Order fields
type OrderItemCreateInput = Omit<OrderItem, 'id' | 'orderId' | 'price'> & { price: number | Prisma.Decimal };

const PLATFORM_COMMISSION_RATE = process.env.PLATFORM_COMMISSION_RATE || 0.1; // 10% commission

class OrderService {
  /**
   * Creates a new order.
   * Notifies the vendor immediately.
   * NOTE: In a full production system, delayed notifications for 'STANDARD' orders
   * should be handled by a separate, persistent job queue (e.g., BullMQ with Redis)
   * instead of `setTimeout` to guarantee execution.
   */
  public async createOrder(userId: string, vendorId: string, items: OrderItemCreateInput[], type: OrderType, cylinderId?: string): Promise<Order> {
    if (!userId || !vendorId || !items || items.length === 0) {
      throw new BadRequestError('User ID, Vendor ID, and items are required to create an order.');
    }

    // 1. Calculate total amount, commission, and payout amount
    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const commission = totalAmount * PLATFORM_COMMISSION_RATE;
    const payoutAmount = totalAmount - commission;

    if (totalAmount <= 0) {
      throw new BadRequestError('Order total must be positive.');
    }

    try {
      // 2. Use a transaction to ensure all records are created or none are.
      const newOrder = await prisma.$transaction(async (tx) => {
        // Create the Order and its associated OrderItems
        const order = await tx.order.create({
          data: {
            userId,
            vendorId,
            type,
            totalAmount,
            cylinderId,
            items: {
              create: items.map((item) => ({
                ...item,
                price: new Prisma.Decimal(item.price),
              })),
            },
          },
          include: { items: true },
        });

        // Create the customer-facing PAYMENT transaction record
        await tx.transaction.create({
          data: {
            orderId: order.id,
            sourceUserId: userId, // The customer is the source of the payment
            amount: new Prisma.Decimal(totalAmount),
            commission: new Prisma.Decimal(commission),
            type: TxType.PAYMENT,
            status: TxStatus.PENDING, // Status is pending until payment is confirmed by gateway
            reference: `FLM-ORD-${order.id.substring(0, 8)}`, // A unique reference for this transaction
            description: `Payment for Order #${order.id.substring(0, 8)}`,
          },
        });

        // Create the Payout record for the vendor
        await tx.payout.create({
          data: {
            orderId: order.id,
            vendorId: vendorId,
            amount: new Prisma.Decimal(payoutAmount),
            status: 'PENDING', // Payout is pending until payment is confirmed and processed
          },
        });

        return order;
      });

      // 3. Send notification to the vendor after the transaction is successful
      this.notifyVendor(newOrder);
      return newOrder;
    } catch (error) {
      logger.error({ err: error }, 'Failed to create order in database');
      throw new AppError('Database operation failed during order creation.', 500);
    }
  }

  private notifyVendor(order: Order) {
    notificationService.broadcast({
      title: 'New Order Received',
      message: `You have a new ${order.type.toLowerCase()} order! Total: $${Number(order.totalAmount).toFixed(2)}`,
      type: 'info'
    });
  }

  /**
   * User cancels their pending order.
   */
  public async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.userId !== userId) {
      throw new UnauthorizedError('You do not have permission to cancel this order.');
    }

    if (order.type === 'QUICK') {
      throw new BadRequestError('Quick orders cannot be cancelled.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusError(`Order cannot be cancelled in ${order.status} status.`);
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Vendor accepts the order.
   */
  public async acceptOrder(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to accept this order.');
    }

    // A vendor can only accept an order that has been paid for (status updated by webhook)
    // or is a PENDING quick order (if you implement cash on delivery for quick orders).
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACCEPTED) {
      throw new InvalidOrderStatusError(`Order cannot be managed in its current status: ${order.status}.`);
    }

    const updatedOrder = await prisma.order.updateMany({
      where: { id: orderId },
      data: { status: OrderStatus.ACCEPTED },
    });

    // Notify user that it's on route
    notificationService.broadcast({
      title: 'Order Accepted',
      message: 'Your order has been accepted by the vendor and is being prepared.',
      type: 'success'
    });

    return { ...order, status: OrderStatus.ACCEPTED };
  }

  /**
   * Vendor marks an accepted order as on route for delivery.
   */
  public async markOrderAsOnRoute(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to update this order.');
    }

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new InvalidOrderStatusError(`Order must be in ACCEPTED status to be marked as on route. Current status: ${order.status}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ON_ROUTE },
    });

    notificationService.broadcast({
      title: 'Order On Route',
      message: 'Your order is now on its way to you!',
      type: 'info'
    });

    return updatedOrder;
  }
  /**
   * Vendor marks an order as delivered.
   */
  public async markOrderAsDelivered(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to mark this order as delivered.');
    }

    if (order.status !== OrderStatus.ON_ROUTE) {
      throw new InvalidOrderStatusError(`Order cannot be marked as delivered in ${order.status} status.`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Notify user that it's delivered
    notificationService.broadcast({
      title: 'Order Delivered',
      message: 'Your order has been delivered!',
      type: 'success'
    });

    return updatedOrder;
  }

  /**
   * Vendor rejects a pending order.
   */
  public async rejectOrder(orderId: string, vendorId: string): Promise<Order> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.vendorId !== vendorId) {
      throw new UnauthorizedError('You are not authorized to reject this order.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusError(`Order cannot be rejected in ${order.status} status.`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REJECTED },
    });

    // Notify user that the order was rejected
    notificationService.broadcast({
      title: 'Order Rejected',
      message: 'Your order has been rejected by the vendor.',
      type: 'error'
    });

    return updatedOrder;
  }

  /**
   * Get active orders for a user
   */
  public async getActiveOrders(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        userId,
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.REJECTED],
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all order history for a user
   */
  public async getOrderHistory(userId:string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderService = new OrderService();
