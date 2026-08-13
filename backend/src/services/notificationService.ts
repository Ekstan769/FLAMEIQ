import { Response } from 'express';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
}

class NotificationService {
  // Store connected clients
  private clients: Response[] = [];

  /**
   * Adds a new client connection to the stream.
   */
  public addClient(res: Response) {
    this.clients.push(res);

    // Remove client when they close the connection
    res.on('close', () => {
      this.clients = this.clients.filter((client) => client !== res);
    });
  }

  /**
   * Broadcasts a notification to all connected clients.
   * This allows the frontend to show pop-up notifications.
   */
  public broadcast(payload: NotificationPayload) {
    const data = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    // SSE format requires data to be prefixed with 'data: ' and end with '\n\n'
    const eventString = `data: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      client.write(eventString);
    });

    // eslint-disable-next-line no-console
    console.log(`[Notification Service] Broadcasted to ${this.clients.length} clients: ${payload.title}`);
  }
}

export const notificationService = new NotificationService();
