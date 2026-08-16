import apiClient from "./apiClient";

// ─── Payment Initiation ───────────────────────────────────────────────────────

/**
 * Initiate payment for an order.
 * method: 'flutterwave' | 'wallet'
 */
export const initiatePayment = (orderId: string, method: "flutterwave" | "wallet") =>
  apiClient.post("/payments/initiate", { orderId, method });

/**
 * Verify payment status by transaction reference.
 * Called after Flutterwave redirects the user back.
 */
export const verifyPayment = (reference: string) =>
  apiClient.get(`/payments/verify/${reference}`);

// ─── Wallet ──────────────────────────────────────────────────────────────────

export const getWalletBalance = () => apiClient.get("/payments/wallet/balance");

export const getWalletTransactions = () =>
  apiClient.get("/payments/wallet/transactions");

/**
 * Initiate a wallet top-up via Flutterwave.
 * Returns a Flutterwave payment link.
 */
export const fundWallet = (amount: number) =>
  apiClient.post("/payments/wallet/fund", { amount });

// ─── Notifications ───────────────────────────────────────────────────────────

export const getNotifications = () => apiClient.get("/notifications");

export const markNotificationRead = (id: string) =>
  apiClient.patch(`/notifications/${id}/read`);
