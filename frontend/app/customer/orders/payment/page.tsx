"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import SuccessModal from "@/components/modals/SuccessModal";

export default function PaymentPage() {
  const router = useRouter();
  const { order } = useOrder();

  const [showDetails, setShowDetails] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const price = order.pricePerUnit ?? 0;
  const totalAmount = useMemo(
    () => price * order.quantity + order.deliveryFee,
    [price, order.quantity, order.deliveryFee]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: wire to a real payment/checkout service once the backend
    // endpoint (POST /api/orders) is confirmed ready. UI-only for now,
    // matching the same ahead-of-backend pattern used elsewhere.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 800);
  };

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
          Pay with card
        </h2>

        <div className="mt-5 max-w-md">
          <div className="rounded-xl bg-muted-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-500">Amount Pay</p>
                <p className="mt-1 text-2xl font-bold text-ink-500">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails((open) => !open)}
                className="flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink-500"
              >
                Details
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-500">Cylinder Price</span>
                  <span className="text-ink-500">
                    ₦{price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-500">Delivery Fee</span>
                  <span className="text-ink-500">
                    ₦{order.deliveryFee.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div>
              <label
                htmlFor="cardNumber"
                className="block text-sm font-medium text-ink-500"
              >
                Card Number
              </label>
              <input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="5993 1234 8297 3679"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none placeholder:text-muted-400 focus:border-brand-500"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="expiry"
                  className="block text-sm font-medium text-ink-500"
                >
                  Expiry Date
                </label>
                <input
                  id="expiry"
                  type="text"
                  placeholder="mm/yy"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none placeholder:text-muted-400 focus:border-brand-500"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="cvv"
                  className="block text-sm font-medium text-ink-500"
                >
                  CVV
                </label>
                <input
                  id="cvv"
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none placeholder:text-muted-400 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cardholderName"
                className="block text-sm font-medium text-ink-500"
              >
                Cardholder Name
              </label>
              <input
                id="cardholderName"
                type="text"
                placeholder="Victor Oboyibo"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink-500 outline-none placeholder:text-muted-400 focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Processing…" : "Proceed to Payment"}
              {!submitting && <ArrowRight size={16} />}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-500">
              <Lock size={12} />
              All payments are secured and encrypted
            </p>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={success}
        title="Order Placed Successful 🎉"
        message="Your gas cylinder is on its way. You can track your delivery in real time."
        redirectTo="/customer/track-delivery"
      />
    </div>
  );
}
