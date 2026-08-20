import { z } from 'zod';

// Ciphertext is Base64-encoded before it is sent to Flutterwave. Requiring a
// realistic ciphertext length prevents this endpoint from accidentally
// accepting a PAN, CVV, or expiry value in a field merely named "encrypted".
const encryptedCardValue = z
  .string()
  .min(128, { message: 'Card values must be encrypted before submission.' })
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, { message: 'Card values must be Base64 ciphertext.' });

export const payWithCardSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
  encryptedCardDetails: z.object(
    {
      encrypted_card_number: encryptedCardValue,
      encrypted_expiry_month: encryptedCardValue,
      encrypted_expiry_year: encryptedCardValue,
      encrypted_cvv: encryptedCardValue,
      // Flutterwave AES-GCM encryption requires a 12-character nonce/IV.
      nonce: z.string().length(12, { message: 'The encryption nonce must be 12 characters.' }),
    },
  ).strict(),
  redirectUrl: z.string().url({ message: 'A valid redirect URL is required.' }),
}).strict();

export const payWithCardTokenSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
  // A Flutterwave payment-method ID is a gateway token, not a PAN or CVV.
  paymentMethodId: z.string().regex(/^pmd_[A-Za-z0-9]+$/, {
    message: 'A valid Flutterwave payment-method ID is required.',
  }),
  redirectUrl: z.string().url({ message: 'A valid redirect URL is required.' }),
}).strict();

export const payWithBankTransferSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
});
