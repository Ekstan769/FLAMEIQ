import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

import { signUp, signIn, verifyOtp } from './authControl.js';
import { emailService } from '@/services/emailService.js';

// Mock external dependencies
vi.mock('@/db/prisma.js', () => ({
  prisma: mockDeep<PrismaClient>(),
}));
vi.mock('bcrypt');
vi.mock('jsonwebtoken');
vi.mock('@/utils/otp.js', () => ({
  hashOtp: vi.fn(() => 'hashedOtp123'), // Mock the new hashOtp function
  generateOtp: vi.fn(() => '123456'),
  getOtpExpiration: vi.fn(() => new Date(Date.now() + 10 * 60 * 1000)), // 10 minutes from now
}));
vi.mock('@/services/emailService.js', () => ({
  emailService: {
    sendEmail: vi.fn(),
  },
}));
vi.mock('@/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/db/prisma.js';

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Auth Controller', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    const mockReq = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
      headers: { 'user-agent': 'test-agent' },
      clientIp: '127.0.0.1',
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    it('should create a new user, send OTP, and return success', async () => {
      const createdUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER', // User model no longer directly holds OTP fields
      };

      // Mock Prisma calls
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);
      (bcrypt.hash as vi.Mock).mockResolvedValue('hashedPassword');
      (emailService.sendEmail as vi.Mock).mockResolvedValue(true);
      prismaMock.otpVerification.create.mockResolvedValue({
        id: 1,
        userId: createdUser.id,
        codeHash: 'hashedOtp123',
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        usedAt: null,
      } as any);

      await signUp(mockReq, mockRes);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10); // For user password
      expect(prismaMock.user.create).toHaveBeenCalled(); // User created
      expect(prismaMock.otpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: createdUser.id,
            codeHash: 'hashedOtp123', // From mocked hashOtp
            purpose: 'REGISTRATION',
          }),
        })
      );
      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User created successfully. Please check your email for the verification code.',
          userId: createdUser.id,
        })
      );
    });

    it('should return 409 if user already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-123' } as any);

      await signUp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should return 400 if required fields are missing', async () => {
      const reqWithMissingFields = { body: { email: 'test@example.com' } } as Request;
      await signUp(reqWithMissingFields, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields required' });
    });

    it('should handle database errors during user creation', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as vi.Mock).mockResolvedValue('hashedPassword');
      prismaMock.user.create.mockRejectedValue(new Error('DB Error'));

      await signUp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected error sign up failed.',
      });
    });
  });

  describe('verifyOtp', () => {
    const mockReq = {
      body: {
        userId: 'user-123',
        otp: '123456',
      },
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER', // User model no longer directly holds OTP fields
      profile: null, // User model no longer directly holds OTP fields
      // No otp or otpExpiresAt on mockUser directly
      // These will be on the OtpVerification record
    };

    // Set up environment variables for JWT signing
    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '1d';
    });

    afterEach(() => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
    });

    it('should successfully verify OTP and return a token', async () => {
      // Mock finding the OTP record
      const mockOtpRecord = {
        id: 1,
        userId: mockUser.id,
        codeHash: 'hashedOtp123', // This should match the hash of '123456'
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        usedAt: null,
      };
      prismaMock.otpVerification.findFirst.mockResolvedValue(mockOtpRecord as any);
      (bcrypt.compare as vi.Mock).mockResolvedValue(true); // OTP comparison success

      // Mock updating the OTP record to mark as used
      prismaMock.otpVerification.update.mockResolvedValue({ ...mockOtpRecord, usedAt: new Date() } as any);

      // Mock finding the user after verification
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      (jwt.sign as vi.Mock).mockReturnValue('mock-jwt-token');

      await verifyOtp(mockReq, mockRes);
      expect(prismaMock.otpVerification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
            purpose: 'REGISTRATION',
            usedAt: null,
            expiresAt: { gt: expect.any(Date) },
          },
        })
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashedOtp123'); // Compare plain OTP with stored hash
      expect(prismaMock.otpVerification.update).toHaveBeenCalledWith({
        where: { id: mockOtpRecord.id },
        data: { usedAt: expect.any(Date) },
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123', deletedAt: null },
        })
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        'test-secret',
        expect.any(Object)
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account verified successfully.',
        token: 'mock-jwt-token',
        user: mockUser, // User object should be returned without OTP fields
      });
    });

    it('should return 400 if userId or otp is missing', async () => {
      const reqMissingUserId = { body: { otp: '123456' } } as Request;
      await verifyOtp(reqMissingUserId, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'User ID and OTP are required.' });

      const reqMissingOtp = { body: { userId: 'user-123' } } as Request;
      await verifyOtp(reqMissingOtp, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'User ID and OTP are required.' });
    });

    it('should return 404 if user is not found', async () => {
      // Mock no OTP record found for the user
      prismaMock.otpVerification.findFirst.mockResolvedValue(null);

      await verifyOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401); // Changed from 404, as no OTP record implies invalid OTP
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP.' });
    });

    it('should return 401 for invalid OTP', async () => {
      const mockOtpRecord = {
        id: 1,
        userId: mockUser.id,
        codeHash: 'hashedOtp123',
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        usedAt: null,
      };
      prismaMock.otpVerification.findFirst.mockResolvedValue(mockOtpRecord as any);
      (bcrypt.compare as vi.Mock).mockResolvedValue(false); // OTP comparison fails

      await verifyOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP.' });
    });

    it('should return 401 for expired OTP', async () => {
      const mockExpiredOtpRecord = {
        id: 1,
        userId: mockUser.id,
        codeHash: 'hashedOtp123',
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(),
        usedAt: null,
      };
      prismaMock.otpVerification.findFirst.mockResolvedValue(mockExpiredOtpRecord as any);
      (bcrypt.compare as vi.Mock).mockResolvedValue(true); // OTP comparison succeeds, but it's expired

      // This part of the mock is no longer relevant as OTP fields are not on User
      /* prismaMock.user.findUnique.mockResolvedValue({
        otpExpiresAt: new Date(Date.now() - 1000), // 1 second ago
      } as any);*/
      await verifyOtp(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'OTP has expired. Please request a new one.' });
    });

    it('should return 401 if OTP is already used', async () => {
      const mockUsedOtpRecord = {
        id: 1,
        userId: mockUser.id,
        codeHash: 'hashedOtp123',
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
        usedAt: new Date(), // Already used
      };
      // If the only OTP is already used, the findFirst query with `usedAt: null` will return null.
      prismaMock.otpVerification.findFirst.mockResolvedValue(null);

      await verifyOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Invalid OTP.' }); // Because usedAt: null is part of the query
    });

    it('should handle database errors during verification', async () => {
      // Mock an error during the initial OTP record lookup
      prismaMock.otpVerification.findFirst.mockRejectedValue(new Error('DB Error'));

      // No need to mock user.findUnique here as the error happens earlier
      await verifyOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'An unexpected error occurred during OTP verification.',
      });
    });
  });

  describe('signIn', () => {
    const mockReq = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
      clientIp: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'USER',
      profile: null,
    };

    it('should sign in a valid user and return a token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      (bcrypt.compare as vi.Mock).mockResolvedValue(true);
      (jwt.sign as vi.Mock).mockReturnValue('mock-jwt-token');

      await signIn(mockReq, mockRes);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
        include: { profile: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalled();
      expect(prismaMock.loginHistory.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Sign-in completed',
        token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          profile: mockUser.profile,
        },
      });
    });

    it('should return 401 for a non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await signIn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for an incorrect password', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any);
      (bcrypt.compare as vi.Mock).mockResolvedValue(false);

      await signIn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
      expect(prismaMock.loginHistory.create).not.toHaveBeenCalled();
    });

    it('should return 400 if email or password is not provided', async () => {
      const reqWithMissingFields = { body: { email: 'test@example.com' } } as Request;
      await signIn(reqWithMissingFields, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'email and password required',
      });
    });

    it('should handle unexpected errors during sign-in', async () => {
      prismaMock.user.findFirst.mockRejectedValue(new Error('DB Error'));

      await signIn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'unexpected server error',
      });
    });
  });
});