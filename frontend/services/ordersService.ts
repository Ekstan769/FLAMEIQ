import apiClient from "./apiClient";

export const getOrders = () => apiClient.get("/orders");
export const getOrderById = (id: string) => apiClient.get(`/orders/${id}`);
export const createOrder = (payload: Record<string, unknown>) =>
  apiClient.post("/orders", payload);
