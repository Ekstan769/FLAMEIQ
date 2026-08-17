import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

import { uploadProfilePicture } from './uploadController.js';
import { uploadToCloudinary } from '../utils/upload.js';
import { prisma } from '@/db/prisma.js';

// Mock dependencies
vi.mock('@/db/prisma.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));
vi.mock('../utils/upload.js', () => ({
  uploadToCloudinary: vi.fn(),
}));
vi.mock('@/utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Upload Controller', () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
    mockReq = {
      user: { id: 'user-123' },
      file: {
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File,
    } as unknown as Request;
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
  });

  it('should upload a file, update the profile, and return the URL', async () => {
    const imageUrl = 'https://cloudinary.com/image.jpg';
    (uploadToCloudinary as vi.Mock).mockResolvedValue(imageUrl);
    prismaMock.profile.upsert.mockResolvedValue({} as any);

    await uploadProfilePicture(mockReq, mockRes);

    expect(uploadToCloudinary).toHaveBeenCalledWith(mockReq.file!.buffer, 'profile_pictures');
    expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      update: { profilePic: imageUrl },
      create: { userId: 'user-123', profilePic: imageUrl },
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Profile picture updated successfully.', url: imageUrl });
  });

  it('should return 400 if no file is uploaded', async () => {
    mockReq.file = undefined;
    await uploadProfilePicture(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'No file uploaded.' });
  });

  it('should return 500 if Cloudinary upload fails', async () => {
    (uploadToCloudinary as vi.Mock).mockRejectedValue(new Error('Upload failed'));

    await uploadProfilePicture(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'An error occurred during file upload.' });
  });
});
