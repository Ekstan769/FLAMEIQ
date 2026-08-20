import { redirect } from "next/navigation";

// Entry point for the "Order Gas" sidebar/nav link — always starts the
// flow at cylinder selection.
export default function OrdersEntryPage() {
  redirect("/customer/orders/quantity");
}

