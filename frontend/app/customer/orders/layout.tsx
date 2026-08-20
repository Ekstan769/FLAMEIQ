import type { ReactNode } from "react";
import { OrderProvider } from "@/context/OrderContext";

// Scoped to the Order Gas flow only (quantity → vendor-selection →
// delivery-address → summary → payment-selection → payment), so every
// stage shares one in-progress order without touching the wider
// customer layout or any other page.
export default function OrdersLayout({ children }: { children: ReactNode }) {
  return <OrderProvider>{children}</OrderProvider>;
}
