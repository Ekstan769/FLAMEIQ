import forge from 'node-forge';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

/**
 * Encrypts a string payload using the configured Flutterwave RSA public key.
 * This function is designed for server-side use, leveraging the public key
 * from the application's configuration.
 *
 * @param payload - The string data to encrypt (e.g., credit card details as a JSON string).
 * @returns The Base64 encoded encrypted payload.
 * @throws {AppError} If the public key is not configured or if encryption fails.
 */
const encryptForGateway = (payload: string): string => {
  const publicKeyPem = config.flutterwavePublicKey;
  if (!publicKeyPem) {
    // Fail-fast if the key is missing in the environment configuration.
    throw new AppError('Payment gateway public key is not configured.', 503, );
  }

  try {
    // Create a public key object directly from the PEM-formatted string.
    // The `forge.util.decode64` step was incorrect as PEM is already a Base64 format.
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Encrypt the payload using RSA-OAEP. OAEP is the recommended padding scheme.
    const encryptedBytes = publicKey.encrypt(payload, 'RSA-OAEP');

    // Encode the encrypted bytes to Base64 for safe transmission.
    return forge.util.encode64(encryptedBytes);
  } catch (error) {
    console.error('RSA encryption failed:', error);
    // Use the application's custom error for consistent error handling.
    throw new AppError('Failed to encrypt data due to a cryptographic error.', 500);
  }
};

export const encryptionService = {
  encryptForGateway,
};
