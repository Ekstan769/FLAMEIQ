import { notificationService } from './notificationService.js';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'on_route' | 'cancelled' | 'delivered';
export type OrderType = 'standard' | 'quick';

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  createdAt: string;
  totalAmount: number;
  delayTimerId?: NodeJS.Timeout;
}

class OrderService {
  private orders: Map<string, Order> = new Map();
  // 10 minutes delay in milliseconds
  private readonly DELAY_MS = 10 * 60 * 1000;

  /**
   * Creates a new order.
   * Standard orders wait 10 mins before notifying the vendor.
   * Quick orders notify immediately.
   */
  public createOrder(userId: string, vendorId: string, items: OrderItem[], type: OrderType): Order {
    const orderId = `ord_${Date.now()}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order: Order = {
      id: orderId,
      userId,
      vendorId,
      items,
      status: 'pending',
      type,
      createdAt: new Date().toISOString(),
      totalAmount,
    };

    if (type === 'standard') {
      // Set 10 min delay before notifying vendor
      const timerId = setTimeout(() => {
        this.notifyVendor(order);
        // Clean up timer ID after it runs
        const updatedOrder = this.orders.get(orderId);
        if (updatedOrder) {
          updatedOrder.delayTimerId = undefined;
          this.orders.set(orderId, updatedOrder);
        }
      }, this.DELAY_MS);
      
      order.delayTimerId = timerId;
    }

    this.orders.set(orderId, order);

    if (type === 'quick') {
      // Notify immediately
      this.notifyVendor(order);
    }

    return { ...order, delayTimerId: undefined }; // Return without internal timer id
  }

  private notifyVendor(order: Order) {
    notificationService.broadcast({
      title: 'New Order Received',
      message: `You have a new ${order.type} order! Total: $${order.totalAmount}`,
      type: 'info'
    });
  }

  /**
   * User cancels their order.
   */
  public cancelOrder(orderId: string, userId: string): Order {
    const order = this.orders.get(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (order.type === 'quick') {
      throw new Error('Quick orders cannot be cancelled');
    }

    if (order.status !== 'pending') {
      throw new Error('Order can no longer be cancelled');
    }

    // It is a standard order and still pending. 
    // Clear the timer so vendor never gets notified.
    if (order.delayTimerId) {
      clearTimeout(order.delayTimerId);
      order.delayTimerId = undefined;
    }

    order.status = 'cancelled';
    this.orders.set(orderId, order);

    return { ...order, delayTimerId: undefined };
  }

  /**
   * Vendor accepts the order.
   */
  public acceptOrder(orderId: string, vendorId: string): Order {
    const order = this.orders.get(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new Error('Unauthorized');
    }

    if (order.status !== 'pending') {
      throw new Error(`Cannot accept order with status: ${order.status}`);
    }

    // Update status to on_route
    order.status = 'on_route';
    
    // Clear timer just in case
    if (order.delayTimerId) {
      clearTimeout(order.delayTimerId);
      order.delayTimerId = undefined;
    }

    this.orders.set(orderId, order);

    // Notify user that it's on route
    notificationService.broadcast({
      title: 'Order Accepted',
      message: 'Your order is on route!',
      type: 'success'
    });

    return { ...order, delayTimerId: undefined };
  }

  /**
   * Get active orders for a user
   */
  public getActiveOrders(userId: string): Order[] {
    const allOrders = Array.from(this.orders.values());
    return allOrders
      .filter(o => o.userId === userId && o.status !== 'cancelled' && o.status !== 'delivered')
      .map(o => ({ ...o, delayTimerId: undefined }));
  }

  /**
   * Get all order history for a user
   */
  public getOrderHistory(userId: string): Order[] {
    const allOrders = Array.from(this.orders.values());
    return allOrders
      .filter(o => o.userId === userId)
      .map(o => ({ ...o, delayTimerId: undefined }));
  }
}

export const orderService = new OrderService();
