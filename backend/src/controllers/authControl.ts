import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/db/prisma.js";
import * as adminService from '@/services/adminService.js'
import { logger } from '@/utils/logger.js'; //import { UnauthorizedError, AppError } from '@/utils/errors.js';
//import { UnauthorizedError, AppError } from '@/utils/errors.js';
import { generateOtp, getOtpExpiration, hashOtp } from "@/utils/otp.js";
import { emailService } from "../services/emailService.js";
//import { uploadToCloudinary } from "../utils/upload";
import { config } from '../config/index.js';
import { signupSchema, loginSchema, verifyOtpSchema } from "../validators/authValidators.js";

import { AppError, UnauthorizedError } from "@/utils/errors.js";


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication required. No token provided."));
  }

  const token = header.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };

    req.user = {
      id: decoded.id,
      role: decoded.role as any,
    } as any;

    return next();
  } catch (error) {
    logger.error({ err: error }, "Invalid or expired auth token");
    return next(new UnauthorizedError("Invalid or expired token."));
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError("Forbidden: Administrator access required.", 403);
  }
  return next();
};

export const authorizeVendor = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedError("Authentication required.");
  }

  // Admins can also perform vendor actions
  if (req.user!.role === 'ADMIN') {
    return next();
  }
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile?.profileType === 'VENDOR') {
    return next();
  }
  throw new AppError("Forbidden: Vendor access required.", 403);
};


export const signUp = async(req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }
    const { name, email, password } = result.data;
    // Checks if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Normalizing email to lowercase is best
    });

    if (existingUser) {
      throw new AppError("User with this email already exists.", 409);
    }

    // Hash your password here before inserting (e.g., using bcrypt)

        const hashedPassword = await bcrypt.hash(password, 10); //call bcrypt to hash password and save hashed password

        const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      // Safely return only the fields the frontend needs
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

        try {
          const otp = generateOtp();
          const otpExpiresAt = getOtpExpiration();
          const codeHash = await hashOtp(otp);

          await prisma.otpVerification.create({
            data: {
              userId: user.id,
              codeHash,
              expiresAt: otpExpiresAt,
              purpose: "REGISTRATION",
            },
          });

          await emailService.sendEmail(
            email,
            "Your FLAMEIQ Verification Code",
            `Welcome to FLAMEIQ! Your verification code is: ${otp}. It will expire in 10 minutes.`,
            `<p>Welcome to FLAMEIQ! Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
          );
        } catch (otpErr) {
          logger.warn(`OTP creation or email sending failed: ${otpErr}`);
        }

        return res.status(201).json({
          success: true,
          message: "User created successfully. Please check your email for the verification code.",
          userId: user.id,
        });
}
export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

    const normalizedEmail = String(email).toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }
    const otp = generateOtp();
    const otpExpiresAt = getOtpExpiration();
    const codeHash = await hashOtp(otp);

    await prisma.otpVerification.updateMany({
      where: { userId: user.id, purpose: "REGISTRATION", usedAt: null },
      data: {
        codeHash,
        expiresAt: otpExpiresAt,
        purpose: "REGISTRATION",
      },
    });
    await emailService.sendEmail(
      normalizedEmail,
      "Your FLAMEIQ Verification Code",
      `Welcome to FLAMEIQ! Your verification code is: ${otp}. It will expire in 10 minutes.`,
      `<p>Welcome to FLAMEIQ! Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
      );

    return res.status(200).json({
      success: true,
      message: "Verification code resent successfully.",
    });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const result = verifyOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }
  const { email, otp } = result.data;
    // Find the user by email first
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    // Find the latest valid OTP for the user and purpose
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        purpose: "REGISTRATION",
        usedAt: null, // Not yet used
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the latest OTP
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedError("Invalid or expired OTP.");
    }

    // Compare the provided OTP with the stored hash
    const isOtpValid = await bcrypt.compare(otp, otpRecord.codeHash);
    if (!isOtpValid) {
      throw new UnauthorizedError("Invalid OTP.");
    }

    // OTP is valid, clear it and generate JWT
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Fetch the user to return with the token
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    if (!fullUser) { // Should not happen if user was found initially
      throw new AppError("User not found after OTP verification.", 404);
    }

    const payload = {
      id: fullUser.id, email: fullUser.email, role: fullUser.role,
    };
    const secret = config.jwtSecret;
    const token = jwt.sign(payload, secret, { expiresIn: config.jwtExpiresIn as any });

    return res.status(200).json({ success: true, message: "Account verified successfully.", token, user: fullUser });
};


export const signIn = async (req: Request, res: Response) =>{
  const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }
    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
      include: { profile: true },
    });

    if(!user){
      throw new UnauthorizedError("Invalid email or password");
    }
    const PasswordValid = await bcrypt.compare(password, user.password);
    if(!PasswordValid){
      logger.warn(`Failed login attempt for email ${email} from IP ${req.ip}`);
      logger.warn(`Failed login attempt for email ${normalizedEmail} from IP ${(req as any).clientIp || req.ip}`);
      
      throw new UnauthorizedError("Invalid email or password");
    }

    const clientIp = (req as any).clientIp || req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: clientIp,
        userAgent: userAgent,
      },
    });
    
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const secret = config.jwtSecret;
    const token = jwt.sign(payload, secret, { expiresIn: config.jwtExpiresIn as any });

    return res.status(200).json({
      success: true,
      message: "Sign-in completed",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

    const normalizedEmail = String(email).toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    // To prevent email enumeration, always return a success-like message.
    // Only proceed if the user actually exists.
    if (user) {
      const otp = generateOtp();
      const otpExpiresAt = getOtpExpiration();
      const codeHash = await hashOtp(otp);

      await prisma.otpVerification.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt: otpExpiresAt,
          purpose: "PASSWORD_RESET",
        },
      });

      await emailService.sendEmail(
        normalizedEmail,
        "Your FLAMEIQ Password Reset Code",
        `Your password reset code is: ${otp}. It will expire in 10 minutes.`,
        `<p>Your password reset code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
      );
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset code has been sent.",
    });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
  }

    const normalizedEmail = String(email).toLowerCase();
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        user: { email: normalizedEmail },
        purpose: "PASSWORD_RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || !(await bcrypt.compare(otp, otpRecord.codeHash))) {
      throw new UnauthorizedError("Invalid or expired OTP.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: otpRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.otpVerification.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } });

    return res.status(200).json({ success: true, message: "Password has been reset successfully." });
};

//get all users to be used by admin
export const getUsers = async (req: Request, res: Response) => {
    const users = await adminService.getAllUsers();

    // Return a structured, successful JSON response
    return res.status(200).json({
      success: true,
      data: users
    });
};

export const deleteUsers = (req: Request, res: Response) => {
  return adminService.adminDeleteUser(req, res);
};

export const deleteSelf = (req: Request, res: Response) => {
  return adminService.selfDeleteUser(req, res);
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    // This should be caught by the `authenticate` middleware, but it's a good safeguard.
    throw new UnauthorizedError("Unauthorized access. No user authenticated.");
  }

  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null, // Ensure the user has not been soft-deleted
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: true, // Include the user's profile information
    },
  });

  if (!user) {
    throw new AppError("Authenticated user not found.", 404);
  }

  return res.status(200).json({ success: true, data: user });
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new UnauthorizedError("Unauthorized access.");
  }

  try {
    const userId = req.user.id;
    const { businessName, phone, address, isVendor, profilePic, bankCode, bankAccountNumber } = req.body;

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { profileType: true },
    });

    const profileType = isVendor === true ? "VENDOR" : (existingProfile?.profileType ?? "USER");

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        profileType,
        ...(businessName !== undefined ? { businessName: businessName ? String(businessName) : null } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
        ...(address !== undefined ? { address: address ? String(address) : null } : {}),
        ...(profilePic !== undefined ? { profilePic: profilePic ? String(profilePic) : null } : {}),
        ...(bankCode !== undefined ? { bankCode: bankCode ? String(bankCode) : null } : {}),
        ...(bankAccountNumber !== undefined ? { bankAccountNumber: bankAccountNumber ? String(bankAccountNumber) : null } : {}),
        deletedAt: null,
      },
      create: {
        userId,
        profileType,
        businessName: businessName ? String(businessName) : null,
        phone: phone ? String(phone) : null,
        address: address ? String(address) : null,
        profilePic: profilePic ? String(profilePic) : null,
        bankCode: bankCode ? String(bankCode) : null,
        bankAccountNumber: bankAccountNumber ? String(bankAccountNumber) : null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update profile');
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};