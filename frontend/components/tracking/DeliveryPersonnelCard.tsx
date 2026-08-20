import Image from "next/image";
import { Fuel } from "lucide-react";

export default function OrderDetailsCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-ink-500">Order Details</h2>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-border p-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
          <Image
            src="/images/loading-cylinder.png"
            alt="12.5Kg Gas Cylinder"
            fill
            className="object-contain p-1"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-500">
            12.5Kg Gas Cylinder
          </p>
          <p className="text-xs text-muted-500">1 Cylinder</p>
        </div>
      </div>

      <dl className="mt-4 flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-1.5 text-muted-500">
            <Fuel size={13} /> Vendor
          </dt>
          <dd className="font-medium text-ink-500">BlueFlame Gas</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-500">Delivery Address</dt>
          <dd className="text-right font-medium text-ink-500">
            Lekki 1, Lagos, Nigeria
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-500">Delivery Fee</dt>
          <dd className="font-medium text-ink-500">N800</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-500">Order Date</dt>
          <dd className="font-medium text-ink-500">Aug 18, 2026, 10:15 AM</dd>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
          <dt className="font-semibold text-ink-500">Total Amount</dt>
          <dd className="text-base font-bold text-brand-500">N16,000</dd>
        </div>
      </dl>
    </div>
  );
}