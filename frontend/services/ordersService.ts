import apiClient from "./apiClient";

// ─── Orders ─────────────────────────────────────────────────────────────────

export const getOrders = () => apiClient.get("/orders");

export const getOrderById = (id: string) => apiClient.get(`/orders/${id}`);

export const createOrder = (payload: Record<string, unknown>) =>
  apiClient.post("/orders", payload);

export const cancelOrder = (id: string) =>
  apiClient.patch(`/orders/${id}/cancel`);

export const confirmDelivery = (id: string) =>
  apiClient.patch(`/orders/${id}/confirm`);

// ─── Vendor Order Actions ────────────────────────────────────────────────────

export const acceptOrder = (id: string, formData: FormData) =>
  apiClient.patch(`/orders/${id}/accept`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const rejectOrder = (id: string) =>
  apiClient.patch(`/orders/${id}/reject`);

export const setOrderOnRoute = (id: string) =>
  apiClient.patch(`/orders/${id}/on-route`);

export const setOrderDelivered = (id: string) =>
  apiClient.patch(`/orders/${id}/delivered`);
