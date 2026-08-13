import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/db/prisma.js";
import * as adminService from '@/services/adminService.js'
import { logger } from '@/utils/logger.js';
import { generateOtp, getOtpExpiration, hashOtp } from "@/utils/otp.js";
import { emailService } from "@/services/emailService.js";
//import { uploadToCloudinary } from "../utils/upload";



export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
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
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Administrator access required.",
    });
  }
  return next();
};


export const signUp = async(req: Request, res: Response) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
          return res.status(400).json({ success: false, message: "Invalid request body" });
        }
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const normalizedEmail = String(email).toLowerCase();

        const existingUser = await prisma.user.findFirst({
          where: { email: normalizedEmail, deletedAt: null },
        });

        if (existingUser) {
          return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
            normalizedEmail,
            "Your FLAMEIQ Verification Code",
            `Welcome to FLAMEIQ! Your verification code is: ${otp}. It will expire in 10 minutes.`,
            `<p>Welcome to FLAMEIQ! Your verification code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
          );
        } catch (otpErr) {
          logger.warn(`OTP creation or email sending failed: ${otpErr}`);
        }

        try {
          const clientIp = (req as any).clientIp || '0.0.0.0';
          const userAgent = req.headers['user-agent'] || 'unknown';
          await prisma.loginHistory.create({
            data: {
              userId: user.id,
              ipAddress: clientIp,
              userAgent: userAgent
            }
          });
          logger.info(`User ${user.email} signed up from IP ${clientIp}`);
        } catch (histErr) {
          logger.warn(`Could not save login history for ${user.email}`);
        }

        const payload = {
          id: user.id,
          email: String(user.email),
          role: String(user.role),
        };

        const token = jwt.sign(
          payload,
          process.env.JWT_SECRET || "flameiq_secret_jwt_key_2026",
          {
            expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as any
          }
        );

        return res.status(201).json({
          success: true,
          message: "User created successfully. Please check your email for the verification code.",
          token,
          user,
          userId: user.id,
        });
    } catch (error: any) {
        console.error("SignUp Error Stack:", error?.stack || error);
        logger.error({ message: error?.message, stack: error?.stack }, "Sign-up process failed unexpectedly");

        return res.status(500).json({
          success: false,
          message: "Unexpected error sign up failed."
        });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  try {
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required.",
      });
    }

    // Find the latest valid OTP for the user and purpose
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: userId,
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
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Compare the provided OTP with the stored hash
    const isOtpValid = await bcrypt.compare(otp, otpRecord.codeHash);
    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // OTP is valid, clear it and generate JWT
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Fetch the user to return with the token
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    if (!user) { // Should not happen if otpRecord was found, but for type safety
      return res.status(404).json({ success: false, message: "User not found after OTP verification." });
    }

    const payload = {
      id: user.id, email: user.email, role: user.role,
    };
    const secret = process.env.JWT_SECRET || "flameiq_secret_jwt_key_2026";
    const token = jwt.sign(payload, secret, { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as any });

    return res.status(200).json({ success: true, message: "Account verified successfully.", token, user });
  } catch (error) {
    logger.error({ err: error }, "OTP verification failed unexpectedly");
    return res.status(500).json({ success: false, message: "An unexpected error occurred during OTP verification." });
  }
};


export const signIn = async (req: Request, res: Response) =>{
  const {email, password}= req.body;
  try{
    if (!email||!password){
      return res.status(400).json({
        success: false,
        message: "email and password required"
      });
    }
    //find by email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
      include: { profile: true },
    });

    if(!user){
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const PasswordValid = await bcrypt.compare(password, user.password);
    if(!PasswordValid){
      logger.warn(`Failed login attempt for email ${email} from IP ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const clientIp = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: clientIp,
        userAgent: userAgent
      }
    });
    logger.info(`User ${user.email} signed in from IP ${clientIp}`);


    
   
const payload = {
  id: user.id,
  email: user.email,
  role: user.role,
};

// 2. Pass the clean payload and cast the options
const secret = process.env.JWT_SECRET || "flameiq_secret_jwt_key_2026";
const token = jwt.sign(
  payload, 
  secret, 
  { 
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as any
  }
);


    return res.status(200).json({
      success: true,
      message: "Sign-in completed",
      token,
      user:{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error){
    logger.error({err: error}, "#panic sign in process failed");

  
    return res.status(500).json({
      success: false,
      message: "unexpected server error"
    });

  }
};

//get all users to be used by admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();

    // Return a structured, successful JSON response
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    // The service already logged the full trace, so just sending the user response here
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

export const deleteUsers = async (req: Request, res: Response) => {
  // The service function handles the response, so no try/catch is needed here.
  return adminService.adminDeleteUser(req, res);
};

export const deleteSelf = async (req: Request, res: Response) => {
  // The service function handles the response.
  return adminService.selfDeleteUser(req, res);
};
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const userId = req.user.id;
    const { businessName, phone, address, isVendor, profilePic } = req.body;

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
        deletedAt: null,
      },
      create: {
        userId,
        profileType,
        businessName: businessName ? String(businessName) : null,
        phone: phone ? String(phone) : null,
        address: address ? String(address) : null,
        profilePic: profilePic ? String(profilePic) : null,
        email: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    logger.error({ err: error }, "Profile update failed");
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
