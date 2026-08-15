import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@/db/prisma.js';
import { logger } from '@/utils/logger.js';
import { OrderStatus, TxStatus } from '@prisma/client';

/**
 * Handles incoming webhooks from Flutterwave.
 */
export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  // Verify the webhook signature for security
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'] as string;

  if (!secretHash) {
    logger.error('FLUTTERWAVE_SECRET_HASH is not set. Cannot verify webhook.');
    return res.status(500).send('Webhook secret not configured.');
  }

  let isSignatureValid = false;
  if (signature) {
    try {
      const expectedSignatureBuffer = Buffer.from(secretHash);
      const receivedSignatureBuffer = Buffer.from(signature);

      // Use timingSafeEqual to prevent timing attacks. Both buffers must be of the same length.
      if (expectedSignatureBuffer.length === receivedSignatureBuffer.length) {
        isSignatureValid = crypto.timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error during webhook signature validation.');
      isSignatureValid = false;
    }
  }

  if (!isSignatureValid) {
    logger.warn('Invalid webhook signature received.');
    return res.status(401).send('Invalid signature.');
  }

  // Process the event payload
  const payload = req.body;

  // Check if it's a successful charge event
  if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
    const { tx_ref: transactionReference, id: gatewayReference } = payload.data;

    try {
      // Use a transaction to update the order and transaction status atomically
      await prisma.$transaction(async (tx) => {
        // Find the transaction in our database using the reference from Flutterwave
        const transaction = await tx.transaction.findUnique({
          where: { reference: transactionReference },
        });

        if (!transaction || !transaction.orderId) {
          logger.warn(`Webhook received for unknown transaction reference: ${transactionReference}`);
          return; // Acknowledge the webhook but take no action
        }

        // Update our transaction to 'SUCCESS'
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TxStatus.SUCCESS, gatewayReference: String(gatewayReference) },
        });

        // Update the order status to 'ACCEPTED' so the vendor can process it
        await tx.order.update({
          where: { id: transaction.orderId },
          data: { status: OrderStatus.ACCEPTED },
        });
      });

      logger.info(`Successfully processed webhook for transaction: ${transactionReference}`);
    } catch (error) {
      logger.error({ err: error }, `Error processing webhook for transaction: ${transactionReference}`);
      return res.status(500).send('Error processing webhook.');
    }
  }

  // Acknowledge receipt of the webhook
  res.status(200).send('Webhook received.');
};