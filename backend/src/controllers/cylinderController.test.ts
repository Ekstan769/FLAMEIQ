import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { Prisma, PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import { getCylinders, registerCylinder, deleteCylinder } from './cylinderController.js';

// Mock dependencies
vi.mock('@/db/prisma.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '../db/prisma.js';

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Cylinder Controller', () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
    mockReq = {
      user: { id: 'user-123' },
      body: {},
      params: {},
    } as unknown as Request;
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;
  });

  describe('getCylinders', () => {
    it('should retrieve all cylinders for the authenticated user', async () => {
      const cylinders = [{ id: 'cyl-1', userId: 'user-123' }];
      prismaMock.cylinder.findMany.mockResolvedValue(cylinders as any);

      await getCylinders(mockReq, mockRes);

      expect(prismaMock.cylinder.findMany).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: cylinders });
    });

    it('should return a 500 error if the database query fails', async () => {
      prismaMock.cylinder.findMany.mockRejectedValue(new Error('DB Error'));

      await getCylinders(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Failed to retrieve cylinders.' });
    });
  });

  describe('registerCylinder', () => {
    it('should register a new cylinder with valid data', async () => {
      mockReq.body = { size: 'KG_12_5', nickname: 'Kitchen Cylinder' };
      const newCylinder = { id: 'cyl-2', userId: 'user-123', ...mockReq.body };
      prismaMock.cylinder.create.mockResolvedValue(newCylinder as any);

      await registerCylinder(mockReq, mockRes);

      expect(prismaMock.cylinder.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', size: 'KG_12_5', nickname: 'Kitchen Cylinder', serialNumber: undefined },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: newCylinder });
    });

    it('should return 400 if size is missing', async () => {
      mockReq.body = { nickname: 'test' };
      await registerCylinder(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Cylinder size is required.' });
    });

    it('should return 400 for an invalid cylinder size', async () => {
      mockReq.body = { size: 'KG_99' }; // Use a truly invalid size
      await registerCylinder(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid cylinder size. Valid sizes are: KG_3, KG_6, KG_12, KG_12_5, KG_25',
      });
    });

    it('should return 409 if serial number is a duplicate', async () => {
      mockReq.body = { size: 'KG_6', serialNumber: 'SN123' };
      const error = new Prisma.PrismaClientKnownRequestError('Duplicate value', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['serialNumber'] },
      });
      prismaMock.cylinder.create.mockRejectedValue(error);

      await registerCylinder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'A cylinder with this serial number already exists.' });
    });
  });

  describe('deleteCylinder', () => {
    it('should delete a cylinder belonging to the user', async () => {
      mockReq.params = { id: 'cyl-to-delete' };
      prismaMock.cylinder.delete.mockResolvedValue({} as any);

      await deleteCylinder(mockReq, mockRes);

      expect(prismaMock.cylinder.delete).toHaveBeenCalledWith({
        where: { id: 'cyl-to-delete', userId: 'user-123' },
      });
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 500 if the delete operation fails', async () => {
      mockReq.params = { id: 'cyl-to-delete' };
      // This error is thrown by Prisma if the record to delete is not found
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      prismaMock.cylinder.delete.mockRejectedValue(error);

      await deleteCylinder(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Failed to delete cylinder.' });
    });
  });
});