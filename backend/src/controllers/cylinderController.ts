import { Request, Response } from 'express';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';
import { CylinderSize } from '../generated/prisma/client.js'
import { registerCylinderSchema } from '@/validators/cylinderValidators.js';

/**
 * Get all cylinders for the authenticated user.
 */
export const getCylinders = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const cylinders = await prisma.cylinder.findMany({
      where: { userId },
    });
    res.status(200).json({ success: true, data: cylinders });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get cylinders');
    res.status(500).json({ success: false, message: 'Failed to retrieve cylinders.' });
  }
};

/**
 * Register a new cylinder for the authenticated user.
 */
export const registerCylinder = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = registerCylinderSchema.safeParse(req.body);
  if (!reult.success) {
    return res.status(400).json({ success: false, error: result .error.flatten().fieldErrors });
  }
  const { size, serialNumber, nickname } = req.body;

  if (!size) {
    return res.status(400).json({ success: false, message: 'Cylinder size is required.' });
  }

  // Basic validation for enum
  const validSizes = Object.values(CylinderSize);
  if (!validSizes.includes(size as CylinderSize)) {
    return res.status(400).json({ success: false, message: `Invalid cylinder size. Valid sizes are: ${validSizes.join(', ')}` });
  }

  try {
    const newCylinder = await prisma.cylinder.create({
      data: {
        userId,
        size,
        serialNumber,
        nickname,
      },
    });
    res.status(201).json({ success: true, data: newCylinder });
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to register cylinder');
    if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return res.status(409).json({ success: false, message: 'A cylinder with this serial number already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to register cylinder.' });
  }
};

/**
 * Delete a cylinder.
 */
export const deleteCylinder = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    try {
        await prisma.cylinder.delete({
            where: { id, userId }, // Ensures user can only delete their own cylinder
        });
        res.status(204).send();
    } catch (error: any) {
        logger.error({ err: error, cylinderId: id }, 'Failed to delete cylinder');
        res.status(500).json({ success: false, message: 'Failed to delete cylinder.' });
    }
};