import { Request, Response } from 'express';
import { z } from 'zod';
import { encryptionService } from '../services/encryptionService.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const encryptionSchema = z.object({
  payload: z.string().min(1, 'Payload cannot be empty.'),
});

export const encryptionController = {
  /**
   * Encrypts a given payload using the gateway's public key.
   * WARNING: This endpoint receives data in plaintext. It is not recommended
   * to send sensitive information like full card numbers here from a client.
   * The intended use for PCI compliance is client-side encryption.
   */
  async encryptPayload(req: Request, res: Response) {
    const result = encryptionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.error.flatten().fieldErrors });
    }

    try {
      const encryptedPayload = encryptionService.encryptForGateway(result.data.payload);
      return res.status(200).json({ success: true, data: { encryptedData: encryptedPayload } });
    } catch (error) {
      logger.error({ err: error }, 'Payload encryption failed.');
      const status = error instanceof AppError ? error.statusCode : 500;
      const message = error instanceof AppError ? error.message : 'Could not encrypt payload.';
      return res.status(status).json({ success: false, message });
    }
  },
};
