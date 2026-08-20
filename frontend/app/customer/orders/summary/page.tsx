"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Lock } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { cylinderLabel } from "@/types/order";

export default function OrderSummaryPage() {
  const router = useRouter();
  const { order } = useOrder();

  // Client-side reference shown pre-payment; the backend issues the real
  // Order.id once /api/orders is called from the Payment stage.
  const [tempReference, setTempReference] = useState("");
  useEffect(() => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    setTempReference(`${id.slice(0, 8)}…${id.slice(-8)}`);
  }, []);

  const price = order.pricePerUnit ?? 0;
  const totalAmount = useMemo(
    () => price * order.quantity + order.deliveryFee,
    [price, order.quantity, order.deliveryFee]
  );

  const isReady = Boolean(order.cylinderSize && order.vendorId);

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-500">
          <Link href="/customer/dashboard" className="hover:text-ink-500">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-ink-500">Order Gas</span>
        </nav>
        <h1 className="mt-1 text-2xl font-bold text-ink-500">Order Gas</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-500 hover:bg-brand-50"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h2 className="mt-5 text-2xl font-bold text-ink-500">
          Order Summary
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Review your order details
        </p>

        {!isReady && (
          <p className="mt-4 text-sm text-error">
            Select a cylinder size and vendor first to see your order
            summary.
          </p>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="flex items-start gap-4 p-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted-50">
              <Image
                src="/images/load-cylinder.png"
                alt="Gas cylinder"
                fill
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink-500">
                {cylinderLabel(order.cylinderSize) || "—"} Cylinder
              </p>
              <p className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-500">Quantity</span>
                <span className="text-ink-500">{order.quantity}</span>
              </p>
              <p className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-500">Price</span>
                <span className="text-ink-500">
                  ₦{price.toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border bg-muted-50/60 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-500">Vendor</span>
              <span className="text-ink-500">{order.vendorName ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-500">
                Delivery Address:
              </span>
              <span className="text-right text-ink-500">
                {order.deliveryAddress ?? "Not selected yet"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-500">Delivery Fee:</span>
              <span className="text-ink-500">
                ₦{order.deliveryFee.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-500">Order ID</span>
              <span className="text-ink-500">{tempReference}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-bold text-ink-500">Total Amount:</span>
              <span className="text-lg font-bold text-ink-500">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/customer/orders/payment-selection")}
          disabled={!isReady}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Proceed to Checkout <ArrowRight size={16} />
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-500">
          <Lock size={12} />
          All payments are secured and encrypted
        </p>
      </div>
    </div>
  );
}
