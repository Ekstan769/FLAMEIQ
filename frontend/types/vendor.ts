export type VendorBadge = "Top Rated" | "Verified" | "High risk";

export interface Vendor {
  id: string;
  name: string;
  badge?: VendorBadge;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  etaMinutes: number;
  pricePerUnit: number;
  weightKg: number;
  available: boolean;
}

export interface VendorListResponse {
  vendors: Vendor[];
  hasMore: boolean;
}
