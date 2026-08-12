/**
 * @file OTP utility functions for generation, hashing, and expiration.
 *
 * Generates a random 6-digit numeric OTP (One-Time Password).
 * @returns A string representing the 6-digit OTP.
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

import bcrypt from 'bcrypt';

/**
 * Hashes an OTP using bcrypt.
 * @param otp The plain OTP string.
 * @returns A promise that resolves to the hashed OTP string.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10); // Using a salt round of 10
}

const OTP_EXPIRATION_MINUTES = 10;

export const getOtpExpiration = (): Date => new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);