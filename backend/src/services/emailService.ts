import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      // secure: true for 465, false for other ports
      secure: config.email.port === 465, 
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  /**
   * Send an email to the specified recipient.
   * If there's an issue with the setup, this will throw early as requested.
   */
  public async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      if (!config.email.user || !config.email.pass) {
        // eslint-disable-next-line no-console
        console.warn('Email config missing! Using mock sender... (Add SMTP credentials to .env)');
        return true;
      }

      const info = await this.transporter.sendMail({
        from: `"FLAMEIQ Backend" <${config.email.user}>`,
        to,
        subject,
        text,
        html,
      });

      // eslint-disable-next-line no-console
      console.log('Message sent: %s', info.messageId);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending email:', error);
      // We log but don't strictly crash the app because non-blocking design is requested
      return false; 
    }
  }
}

export const emailService = new EmailService();
