"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DELIVERY_FEE,
  initialOrderDraft,
  type CylinderSize,
  type OrderDraft,
} from "@/types/order";

interface OrderContextValue {
  order: OrderDraft;
  setCylinder: (size: CylinderSize, quantity?: number) => void;
  setVendor: (vendorId: string, vendorName: string, pricePerUnit: number) => void;
  setDeliveryAddress: (address: string, fee?: number) => void;
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<OrderDraft>(initialOrderDraft);

  const setCylinder = useCallback((size: CylinderSize, quantity = 1) => {
    setOrder((prev) => ({ ...prev, cylinderSize: size, quantity }));
  }, []);

  const setVendor = useCallback(
    (vendorId: string, vendorName: string, pricePerUnit: number) => {
      setOrder((prev) => ({ ...prev, vendorId, vendorName, pricePerUnit }));
    },
    []
  );

  // Exposed for the Delivery Address stage to call once it's built.
  const setDeliveryAddress = useCallback(
    (address: string, fee: number = DEFAULT_DELIVERY_FEE) => {
      setOrder((prev) => ({ ...prev, deliveryAddress: address, deliveryFee: fee }));
    },
    []
  );

  const resetOrder = useCallback(() => setOrder(initialOrderDraft), []);

  const value = useMemo(
    () => ({ order, setCylinder, setVendor, setDeliveryAddress, resetOrder }),
    [order, setCylinder, setVendor, setDeliveryAddress, resetOrder]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
