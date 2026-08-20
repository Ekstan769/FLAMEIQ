"use client";

import { useState, ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Lock, ChevronDown } from "lucide-react";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CardPaymentForm({
  amount = "16,000.00",
  onBack,
  onProceed,
}: {
  amount?: string;
  onBack?: () => void;
  onProceed?: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) =>
    setCardNumber(formatCardNumber(e.target.value));

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) =>
    setExpiry(formatExpiry(e.target.value));

  const handleCvvChange = (e: ChangeEvent<HTMLInputElement>) =>
    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));

  const handleProceed = () => {
    setLoading(true);
    onProceed?.();
  };

  return (
    <div className="max-w-xl">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-500 hover:bg-brand-50"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-bold text-ink-500">
          Pay with card
        </h2>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted-50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-500">Amount Pay</p>
            <p className="text-2xl font-bold text-ink-500">N{amount}</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium text-muted-500 hover:text-ink-500">
            Details <ChevronDown size={14} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-500">Card Number</span>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="5993 1234 8297 3679"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-ink-500">Expiry Date</span>
              <input
                type="text"
                inputMode="numeric"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="mm/yy"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-ink-500">CVV</span>
              <input
                type="text"
                inputMode="numeric"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-ink-500">
              Cardholder Name
            </span>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Victor Oboyibo"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <button
          onClick={handleProceed}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Processing…" : "Proceed to Payment"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-500">
        <Lock size={12} />
        All payments are secured and encrypted
      </p>
    </div>
  );
}