"use client";

import { useState } from "react";
import { CreditCard, Landmark, Lock, ArrowRight } from "lucide-react";

type Method = "card" | "bank";

const OPTIONS: { id: Method; label: string; icon: React.ElementType }[] = [
  { id: "card", label: "Pay with Visa or Mastercard", icon: CreditCard },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
];

export default function PaymentMethod() {
  const [selected, setSelected] = useState<Method>("card");
  const [loading, setLoading] = useState(false);

  const handleProceed = () => {
    // TODO: wire to a real payment/checkout service once the backend
    // endpoint exists. Kept as a UI-only stub for now.
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="max-w-xl mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-bold text-ink-500">
          Payment Method
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Choose a secure payment method
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {OPTIONS.map(({ id, label, icon: Icon }) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:bg-brand-50/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} className="text-ink-500" />
                  <span className="text-sm font-medium text-ink-500">
                    {label}
                  </span>
                </span>

                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-brand-500" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleProceed}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Processing…" : "Proceed to Payment"}
        {!loading && <ArrowRight size={16} />}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-500">
        <Lock size={12} />
        All payments are secured and encrypted
      </p>
    </div>
  );
}