import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class EmailService {
  /**
   * Send an email to the specified recipient.
   * Uses the sendlib API.
   */
  public async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      const apiKey = process.env.SENDLIB_API_KEY;
      const fromEmail = process.env.SENDLIB_FROM_EMAIL;

      if (!apiKey || !fromEmail) {
        logger.warn('Email service config missing! Using mock sender. Add SENDLIB_API_KEY and SENDLIB_FROM_EMAIL to .env');
        return true;
      }

      const response = await fetch('https://sendlib.samueltuoyo.com/api/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html: html || text, // Prefer HTML if available
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to send email. Status: ${response.status}, Body: ${errorBody}`);
      }

      logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Error sending email');
      return false;
    }
  }
}

export const emailService = new EmailService();
