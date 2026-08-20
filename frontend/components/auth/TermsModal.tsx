"use client";

import { useState, useRef, UIEvent } from "react";
import { X, CheckCircle2 } from "lucide-react";

export default function TermsModal({
  isOpen,
  onClose,
  onContinue,
}: {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const reachedEnd =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (reachedEnd) setHasScrolledToEnd(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/60 p-6">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-ink-500">
            Terms &amp; Conditions
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-400 hover:text-ink-500"
          >
            <X size={18} />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-muted-500"
        >
          <h3 className="font-semibold text-ink-500">1. Introduction</h3>
          <p className="mt-1">
            Welcome to FlameIntel. By creating an account, you agree to
            these Terms &amp; Conditions. Please read them carefully
            before continuing.
          </p>

          <h3 className="mt-4 font-semibold text-ink-500">
            2. Use of Service
          </h3>
          <p className="mt-1">
            FlameIntel connects customers with gas vendors for ordering,
            delivery tracking, and refill predictions. You agree to use
            the service only for lawful purposes.
          </p>

          <h3 className="mt-4 font-semibold text-ink-500">3. Payments</h3>
          <p className="mt-1">
            Payments are processed through our third-party payment
            partner. FlameIntel does not store your card details on its
            own servers.
          </p>

          <h3 className="mt-4 font-semibold text-ink-500">
            4. Privacy
          </h3>
          <p className="mt-1">
            We collect only the information needed to provide the
            service, such as your delivery address and order history.
            See our Privacy Policy for full details.
          </p>

          <h3 className="mt-4 font-semibold text-ink-500">
            5. Account Termination
          </h3>
          <p className="mt-1">
            FlameIntel reserves the right to suspend or terminate
            accounts that violate these terms.
          </p>

          <h3 className="mt-4 font-semibold text-ink-500">
            6. Contact
          </h3>
          <p className="mt-1">
            Questions about these terms can be directed to our support
            team.
          </p>

          <p className="mt-6 text-xs text-muted-400">
            You&apos;ve reached the end of this document.
          </p>
        </div>

        <div className="border-t border-border px-6 py-4">
          {!hasScrolledToEnd && (
            <p className="mb-2 text-xs text-muted-500">
              Please scroll to the bottom to continue.
            </p>
          )}
          <button
            onClick={onContinue}
            disabled={!hasScrolledToEnd}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-muted-100 disabled:text-muted-400"
          >
            {hasScrolledToEnd && <CheckCircle2 size={16} />}
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}