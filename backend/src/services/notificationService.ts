import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
}

class NotificationService {
  // Map of userId -> list of SSE Response objects (user can have multiple tabs open)
  private clients: Map<string, Response[]> = new Map();

  /**
   * Registers an SSE client for a specific user.
   */
  public addClient(res: Response, userId: string) {
    const existing = this.clients.get(userId) ?? [];
    existing.push(res);
    this.clients.set(userId, existing);

    logger.info(`[SSE] Client connected for user ${userId}. Total connections: ${existing.length}`);

    // Clean up when connection closes
    res.on('close', () => {
      const current = this.clients.get(userId) ?? [];
      const updated = current.filter((client) => client !== res);
      if (updated.length === 0) {
        this.clients.delete(userId);
      } else {
        this.clients.set(userId, updated);
      }
      logger.info(`[SSE] Client disconnected for user ${userId}.`);
    });
  }

  /**
   * Sends a real-time notification to a specific user via SSE
   * and persists it in the database.
   */
  public async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const data = {
      ...payload,
      type: payload.type ?? 'info',
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    // Persist notification to DB so user can see it later even if offline
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: data.title,
          message: data.message,
          type: data.type,
        },
      });
    } catch (err) {
      logger.error({ err }, `[Notification] Failed to persist notification for user ${userId}`);
    }

    // Push real-time SSE event if user is online
    const userClients = this.clients.get(userId);
    if (userClients && userClients.length > 0) {
      const eventString = `data: ${JSON.stringify(data)}\n\n`;
      userClients.forEach((client) => {
        try {
          client.write(eventString);
        } catch (err) {
          logger.warn({ err }, `[SSE] Failed to write to client for user ${userId}`);
        }
      });
      logger.info(`[Notification] Sent to ${userClients.length} connection(s) for user ${userId}: ${payload.title}`);
    } else {
      logger.info(`[Notification] User ${userId} is offline. Notification persisted to DB only.`);
    }
  }

  /**
   * Broadcasts a notification to ALL connected SSE clients (admin-level only).
   */
  public broadcast(payload: NotificationPayload) {
    const data = {
      ...payload,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
    const eventString = `data: ${JSON.stringify(data)}\n\n`;

    let totalClients = 0;
    this.clients.forEach((clients) => {
      clients.forEach((client) => {
        try {
          client.write(eventString);
          totalClients++;
        } catch (_) {
          // ignore
        }
      });
    });

    logger.info(`[Notification] Broadcast to ${totalClients} client(s): ${payload.title}`);
  }
}

export const notificationService = new NotificationService();
