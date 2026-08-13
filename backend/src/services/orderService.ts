import { Order, OrderItem, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

// Use a type for creation that doesn't require all Order fields
type OrderItemCreateInput = Omit<OrderItem, 'id' | 'orderId'>;

class OrderService {
  /**
   * Creates a new order.
   * Notifies the vendor immediately.
   * NOTE: In a full production system, delayed notifications for 'STANDARD' orders
   * should be handled by a separate, persistent job queue (e.g., BullMQ with Redis)
   * instead of `setTimeout` to guarantee execution.
   */
  public async createOrder(userId: string, vendorId: string, items: OrderItemCreateInput[], type: OrderType): Promise<Order> {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    try {
      const order = await prisma.order.create({
        data: {
          userId,
          vendorId,
          type,
          totalAmount,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });

      // For both QUICK and STANDARD, we notify immediately.
      // A job queue would be needed for delayed 'STANDARD' notifications.
      this.notifyVendor(order);

      return order;
    } catch (error) {
      logger.error({ err: error }, 'Failed to create order in database');
      throw new Error('Database operation failed during order creation.');
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
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (order.type === 'QUICK') {
      throw new Error('Quick orders cannot be cancelled');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Order can no longer be cancelled');
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
      throw new Error('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new Error('Unauthorized');
    }

    if (order.status !== 'PENDING') {
      throw new Error(`Cannot accept order with status: ${order.status}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ON_ROUTE' },
    });

    // Notify user that it's on route
    notificationService.broadcast({
      title: 'Order Accepted',
      message: 'Your order is on route!',
      type: 'success'
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
          notIn: ['CANCELLED', 'DELIVERED'],
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
