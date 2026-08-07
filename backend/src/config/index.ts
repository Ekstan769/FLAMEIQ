import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  
  // Cron Job switch: useful for debugging so we don't fire events constantly
  enableCronJob: process.env.ENABLE_CRON_JOB ? process.env.ENABLE_CRON_JOB === 'true' : true,
  
  // Email configuration (placeholder for now)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  }
};
