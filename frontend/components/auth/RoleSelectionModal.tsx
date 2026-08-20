"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserRound, Store } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Portal } from "@/types/portal";

type RoleOption = {
  value: Portal;
  title: string;
  description: string;
  icon: ReactNode;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "customer",
    title: "Customer",
    description: "Order gas, track delivery and manage your account",
    icon: <UserRound size={18} />,
  },
  {
    value: "vendor",
    title: "Vendor",
    description: "Receive orders, manage inventory and grow your business",
    icon: <Store size={18} />,
  },
];

export default function RoleSelectionModal({
  isOpen,
  onClose,
  onContinue,
  defaultRole = "customer",
}: {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (role: Portal) => void;
  defaultRole?: Portal;
}) {
  const [selectedRole, setSelectedRole] = useState<Portal>(defaultRole);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[425px]">
      <div className="text-center">
        <h2 className="font-heading text-xl font-bold text-ink-500">
          Choose Your Role
        </h2>
        <p className="mt-1.5 text-sm text-muted-500">
          This helps us to personalize your experience
        </p>
      </div>

      <div className="mt-6 flex w-full flex-col gap-4">
        {ROLE_OPTIONS.map((option) => {
          const isSelected = selectedRole === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedRole(option.value)}
              aria-pressed={isSelected}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-brand-500 bg-brand-50/60"
                  : "border-border bg-white hover:bg-muted-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-brand-500 text-white"
                    : "bg-muted-50 text-muted-500"
                }`}
              >
                {option.icon}
              </span>

              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink-500">
                  {option.title}
                </span>
                <span className="mt-0 block text-xs leading-relaxed text-muted-500">
                  {option.description}
                </span>
              </span>

              <span
                className={`mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-brand-500" : "border-muted-200"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onContinue(selectedRole)}
        className="mt-6 w-full cursor-pointer rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Continue
      </button>

      <p className="mt-4 text-center text-sm text-muted-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-500 hover:underline"
        >
          Log in
        </Link>
      </p>
    </Modal>
  );
}