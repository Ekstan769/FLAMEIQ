import forge from 'node-forge';

/**
 * Encrypts a string payload using RSA with a public key.
 * This function is typically used on the CLIENT-SIDE (e.g., browser or mobile app)
 * to encrypt sensitive data before sending it to the backend.
 *
 * @param publicKeyB64 - The Base64 encoded public key from the payment provider.
 * @param payload - The string data to encrypt (e.g., credit card details as a JSON string).
 * @returns The Base64 encoded encrypted payload.
 */
const encryptWithPublicKey = (publicKeyB64: string, payload: string): string => {
  try {
    // Decode the Base64 public key to its binary representation
    const publicKeyPem = forge.util.decode64(publicKeyB64);

    // Create a public key object from the PEM-encoded key
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Encrypt the payload using RSA-OAEP. OAEP is the recommended padding scheme.
    const encryptedBytes = publicKey.encrypt(payload, 'RSA-OAEP');

    // Encode the encrypted bytes to Base64 to safely transmit them
    const encryptedB64 = forge.util.encode64(encryptedBytes);

    return encryptedB64;
  } catch (error) {
    console.error('RSA encryption failed:', error);
    throw new Error('Failed to encrypt data.');
  }
};

export const encryptionService = {
  encryptWithPublicKey,
};
