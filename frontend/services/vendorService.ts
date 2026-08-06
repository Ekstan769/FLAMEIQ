import apiClient from "./apiClient";

export const getInventory = () => apiClient.get("/vendor/inventory");
export const getAnalytics = () => apiClient.get("/vendor/analytics");
export const getEarnings = () => apiClient.get("/vendor/earnings");
