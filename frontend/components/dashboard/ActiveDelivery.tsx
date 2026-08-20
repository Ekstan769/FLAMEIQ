import { MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ActiveDelivery() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-500">
          Active Delivery
        </h2>
        <span className="rounded-full bg-notify-50 px-2.5 py-1 text-xs font-medium text-notify-700">
          On the way
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-500">
        12.5kg Cylinder — GasPro Services
      </p>

      <div className="relative mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-muted-50">
        <div className="flex flex-col items-center gap-1 text-muted-400">
          <MapPin size={22} />
          <span className="text-xs">Map preview coming soon</span>
        </div>
      </div>

      <Link
        href="/customer/track-delivery"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-hover"
      >
        Track Order <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}