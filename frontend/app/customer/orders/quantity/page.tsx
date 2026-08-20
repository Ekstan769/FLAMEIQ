"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { CYLINDER_OPTIONS, type CylinderSize } from "@/types/order";

export default function OrderQuantityPage() {
  const router = useRouter();
  const { order, setCylinder } = useOrder();
  const [selected, setSelected] = useState<CylinderSize | null>(
    order.cylinderSize
  );

  const handleContinue = () => {
    if (!selected) return;
    setCylinder(selected);
    router.push("/customer/orders/vendor-selection");
  };

  return (
    <div>
      {/* Page-scoped breadcrumb + title (kept separate from the shared Navbar) */}
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
        <div className="text-center">
          <h2 className="text-lg font-bold text-ink-500">
            Select Cylinder Size
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            Choose your preferred Cylinder Size
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CYLINDER_OPTIONS.map((option) => {
              const isSelected = selected === option.size;
              return (
                <button
                  key={option.size}
                  type="button"
                  onClick={() => setSelected(option.size)}
                  className={`flex flex-col items-center rounded-xl border p-4 transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/60"
                      : "border-border bg-white hover:bg-muted-50"
                  }`}
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={option.imageSrc}
                      alt={`${option.label} gas cylinder`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="mt-3 flex items-center gap-1.5 text-base font-semibold text-ink-500">
                    {option.label}
                    <ArrowRight size={16} className="text-brand-500" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected}
          className="mt-6 w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
