import { Response } from 'express';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
}

class NotificationService {
  // Store connected clients by their unique ID
  private clients: Map<string, Response> = new Map();

  /**
   * Adds a new client connection to the stream.
   */
  public addClient(clientId: string, res: Response) {
    this.clients.set(clientId, res);

    // Remove client when they close the connection
    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  /**
   * Sends a notification to specific clients.
   * This allows the frontend to show pop-up notifications to targeted users.
   */
  public sendToClients(clientIds: string[], payload: NotificationPayload) {
    const data = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    // SSE format requires data to be prefixed with 'data: ' and end with '\n\n'
    const eventString = `data: ${JSON.stringify(data)}\n\n`;

    let sentCount = 0;
    clientIds.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client) {
        client.write(eventString);
        sentCount++;
      }
    });

    // eslint-disable-next-line no-console
    console.log(`[Notification Service] Sent notification to ${sentCount} specific clients: ${payload.title}`);
  }
}

export const notificationService = new NotificationService();
