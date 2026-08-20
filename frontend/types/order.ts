// Mirrors the backend CylinderSize enum (backend/prisma/schema.prisma).
// KG_3 exists on the backend but isn't offered in this flow's UI.
export type CylinderSize = "KG_6" | "KG_12" | "KG_12_5" | "KG_25";

export interface CylinderOption {
  size: CylinderSize;
  label: string;
  imageSrc: string;
}

export const CYLINDER_OPTIONS: CylinderOption[] = [
  { size: "KG_6", label: "6Kg", imageSrc: "/images/load-cylinder.png" },
  { size: "KG_12", label: "12Kg", imageSrc: "/images/load-cylinder.png" },
  { size: "KG_12_5", label: "12.5Kg", imageSrc: "/images/load-cylinder.png" },
  { size: "KG_25", label: "25Kg", imageSrc: "/images/load-cylinder.png" },
];

export function cylinderLabel(size: CylinderSize | null): string {
  return CYLINDER_OPTIONS.find((option) => option.size === size)?.label ?? "";
}

// Flat, shared draft of the in-progress Order Gas flow. Each stage reads
// what it needs and writes what it owns; nothing is persisted to the
// backend until the final Payment stage.
export interface OrderDraft {
  cylinderSize: CylinderSize | null;
  quantity: number;

  vendorId: string | null;
  vendorName: string | null;
  pricePerUnit: number | null;

  // Written by the Delivery Address stage (owned by a teammate).
  deliveryAddress: string | null;
  deliveryFee: number;
}

export const DEFAULT_DELIVERY_FEE = 1000;

export const initialOrderDraft: OrderDraft = {
  cylinderSize: null,
  quantity: 1,
  vendorId: null,
  vendorName: null,
  pricePerUnit: null,
  deliveryAddress: null,
  deliveryFee: DEFAULT_DELIVERY_FEE,
};
