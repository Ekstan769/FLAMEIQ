import { z } from 'zod';

export const payWithCardSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
  encryptedCardDetails: z.object(
    {
      encrypted_card_number: z.string(),
      encrypted_expiry_month: z.string(),
      encrypted_expiry_year: z.string(),
      encrypted_cvv: z.string(),
      nonce: z.string(),
    },
  ),
  redirectUrl: z.string().url({ message: 'A valid redirect URL is required.' }),
});

export const payWithBankTransferSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
});
