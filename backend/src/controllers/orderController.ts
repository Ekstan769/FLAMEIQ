import { Request, Response } from 'express';
import { orderService } from '../services/orderService.js';
import { logger } from '../utils/logger.js';
import { AppError, BadRequestError } from '../utils/errors.js';
import { ProfileType } from '../generated/prisma/client.js';
import { prisma } from '@/db/prisma.js';
import { createOrderSchema } from '../validators/orderValidators.js';
import { uploadToCloudinary } from '../utils/upload.js';
/**
 * Handles the creation of a new order.
 * Order starts at PAYMENT_PENDING until payment is confirmed.
 */
export const createOrder = async (req: Request, res: Response): Promise<Response> => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.flatten().fieldErrors });
  }
  const { vendorId, items, type, cylinderId } = result.data;
  const userId = req.user!.id;
  const order = await orderService.createOrder(userId, vendorId, items, type, cylinderId);
  return res.status(201).json({ success: true, data: order });
};

/**
 * Retrieves orders for the authenticated user.
 * - VENDOR: fetches all orders assigned to them (includes buyer info).
 * - USER: fetches their own order history.
 */
export const getOrders = async (req: Request, res: Response): Promise<Response> => {
  const userId = req.user!.id;
  // The authenticate middleware only sets id + role, not profile.
  // Look up the profile type to decide which order query to run.
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { profileType: true },
  });
  const profileType = profile?.profileType;

  let orders;
  if (profileType === ProfileType.VENDOR) {
    orders = await orderService.getOrdersForVendor(userId);
  } else {
    orders = await orderService.getOrderHistory(userId);
  }

  return res.status(200).json({ success: true, data: orders });
};

/**
 * Retrieves a single order by ID.
 */
export const getOrderById = async (req: Request, res: Response): Promise<Response> => {
    const { id: orderId } = req.params;
    const userId = req.user!.id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { profileType: true },
    });
    const profileType = profile?.profileType;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        transactions: true,
        vendor: { select: { name: true, profile: { select: { businessName: true, phone: true, profilePic: true, address: true } } } },
        user: { select: { name: true, profile: { select: { phone: true, address: true } } } },
        payout: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    // Only the buyer or the assigned vendor can view the order
    if (order.userId !== userId && order.vendorId !== userId && profileType !== ProfileType.ADMIN) {
      throw new AppError('Access denied.', 403);
    }

    return res.status(200).json({ success: true, data: order });
};

/**
 * Handles a user cancelling their own order (only while PAYMENT_PENDING).
 */
export const cancelOrder = async (req: Request, res: Response): Promise<Response> => {
  const { id: orderId } = req.params;
  const userId = req.user!.id;

  const updatedOrder = await orderService.cancelOrder(orderId, userId);
  return res.status(200).json({ success: true, data: updatedOrder });
};

/**
 * Handles a vendor accepting an order.
 * Requires multipart form data with beforeFillImage and afterFillImage file uploads.
 */
export const acceptOrder = async (req: Request, res: Response): Promise<Response> => {
    const { id: orderId } = req.params;
    const vendorId = req.user!.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const beforeFile = files?.['beforeFillImage']?.[0];
    const afterFile = files?.['afterFillImage']?.[0];

    if (!beforeFile || !afterFile) {
      throw new BadRequestError('Both beforeFillImage and afterFillImage are required to accept an order.');
    }

    // Upload both images to Cloudinary
    const [beforeFillImage, afterFillImage] = await Promise.all([
      uploadToCloudinary(beforeFile.buffer, 'flameiq/cylinder-fills'),
      uploadToCloudinary(afterFile.buffer, 'flameiq/cylinder-fills'),
    ]);

    const updatedOrder = await orderService.acceptOrder(orderId, vendorId, beforeFillImage, afterFillImage);
    return res.status(200).json({ success: true, data: updatedOrder });
};

/**
 * Handles a vendor marking an order as "On Route".
 */
export const setOrderOnRoute = async (req: Request, res: Response): Promise<Response> => {
  const { id: orderId } = req.params;
  const vendorId = req.user!.id;

  const updatedOrder = await orderService.markOrderAsOnRoute(orderId, vendorId);
  return res.status(200).json({ success: true, data: updatedOrder });
};

/**
 * Handles a vendor marking an order as "Delivered".
 * After this, the buyer must confirm receipt to trigger the payout.
 */
export const setOrderDelivered = async (req: Request, res: Response): Promise<Response> => {
  const { id: orderId } = req.params;
  const vendorId = req.user!.id;

  const updatedOrder = await orderService.markOrderAsDelivered(orderId, vendorId);
  return res.status(200).json({ success: true, data: updatedOrder });
};

/**
 * Handles the buyer confirming they received their order.
 * This CONFIRMS the order and triggers the vendor payout (minus commission).
 */
export const confirmDelivery = async (req: Request, res: Response): Promise<Response> => {
  const { id: orderId } = req.params;
  const userId = req.user!.id;

    const updatedOrder = await orderService.confirmDelivery(orderId, userId);
    return res.status(200).json({
      success: true,
      message: 'Delivery confirmed. The vendor payout has been initiated.',
      data: updatedOrder,
    });
};

/**
 * Handles a vendor rejecting an order. A refund is initiated automatically.
 */
export const rejectOrder = async (req: Request, res: Response): Promise<Response> => {
  const { id: orderId } = req.params;
  const vendorId = req.user!.id;

  const updatedOrder = await orderService.rejectOrder(orderId, vendorId);
  return res.status(200).json({ success: true, data: updatedOrder });
};
