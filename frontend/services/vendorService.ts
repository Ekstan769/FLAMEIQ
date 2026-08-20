import apiClient from "./apiClient";
import type { VendorListResponse } from "@/types/vendor";

export const getInventory = () => apiClient.get("/vendor/inventory");
export const getAnalytics = () => apiClient.get("/vendor/analytics");
export const getEarnings = () => apiClient.get("/vendor/earnings");

// Customer-facing: list vendors available for a gas order (Order Gas →
// Select Vendor). Backend route is not implemented yet as of this
// commit — following the same ahead-of-backend contract pattern already
// used by authService.ts for /auth/*.
export const getVendors = (params?: { page?: number; limit?: number }) =>
  apiClient.get<VendorListResponse>("/vendors", { params });
