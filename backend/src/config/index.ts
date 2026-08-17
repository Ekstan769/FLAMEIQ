import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application settings
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'flameiq_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  aiApiBaseUrl: process.env.AI_API_BASE_URL,

  // Flutterwave settings
  flutterwaveSecretKey: process.env.FLUTTER_KEY,
  flutterwaveSecretHash: process.env.FLUTTERWAVE_SECRET_HASH,
  flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  flutterwaveBaseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://developersandbox-api.flutterwave.com',

  // Commission rate
  platformCommissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.10'),

  // Job toggles
  enablePredictionJob: process.env.ENABLE_PREDICTION_JOB === 'true', // For predictionJob
  enablePayoutJob: process.env.ENABLE_PAYOUT_JOB === 'true', // For payoutJob

  // Email service
  sendlibApiKey: process.env.SENDLIB_API_KEY,
  sendlibFromEmail: process.env.SENDLIB_FROM_EMAIL,
};

// Basic validation for critical configs
if (!config.flutterwaveSecretKey) {
  console.warn('FLUTTER_KEY is not set in environment variables.');
}
if (!config.flutterwaveSecretHash) {
  console.warn('FLUTTERWAVE_SECRET_HASH is not set in environment variables.');
}
if (!config.flutterwavePublicKey) {
  console.warn('FLUTTERWAVE_PUBLIC_KEY is not set in environment variables.');
}
if (!config.sendlibApiKey || !config.sendlibFromEmail) {
  console.warn('Email service (SENDLIB) API key or from email is not set. Email sending might be disabled.');
}
