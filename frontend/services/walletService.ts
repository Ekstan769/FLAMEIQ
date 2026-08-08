import apiClient from "./apiClient";

export const getWalletHistory = () => apiClient.get("/wallet/history");
