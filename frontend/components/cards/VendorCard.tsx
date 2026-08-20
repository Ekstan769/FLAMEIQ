import { Star } from "lucide-react";
import type { Vendor, VendorBadge } from "@/types/vendor";

const BADGE_STYLES: Record<VendorBadge, string> = {
  "Top Rated": "bg-success/10 text-success",
  Verified: "bg-success/10 text-success",
  "High risk": "bg-error/10 text-error",
};

function GasCylinderIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none">
      <rect x="4" y="2.5" width="3" height="2" rx="0.5" fill="#F4B400" />
      <rect
        x="3"
        y="4.5"
        width="18"
        height="17"
        rx="4"
        fill="#1F4E79"
      />
      <rect x="6" y="8" width="12" height="10" rx="2" fill="#ffffff" opacity="0.12" />
    </svg>
  );
}

export default function VendorCard({
  vendor,
  selected,
  onSelect,
}: {
  vendor: Vendor;
  selected: boolean;
  onSelect: () => void;
}) {
  const isLowRated = vendor.rating < 3;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!vendor.available}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-brand-500 bg-brand-50/60"
          : "border-border bg-white hover:border-brand-200"
      }`}
    >
      {/* Icon */}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted-50">
        <GasCylinderIcon />
      </span>

      {/* Name, badge, rating, distance */}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-500">
            {vendor.name}
          </span>
          {vendor.badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_STYLES[vendor.badge]}`}
            >
              {vendor.badge}
            </span>
          )}
        </span>

        <span className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
              isLowRated
                ? "bg-error/10 text-error"
                : "bg-notify-50 text-notify-700"
            }`}
          >
            <Star size={10} fill="currentColor" strokeWidth={0} />
            {vendor.rating.toFixed(1)} ({vendor.reviewCount})
          </span>
        </span>

        <span className="mt-1 block text-xs text-muted-500">
          {vendor.distanceKm}km away • {vendor.etaMinutes} mins
        </span>
      </span>

      {/* Price, weight, availability */}
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold text-ink-500">
          ₦{vendor.pricePerUnit.toLocaleString()}
        </span>
        <span className="block text-xs text-muted-500">
          {vendor.weightKg}kg
        </span>
        <span
          className={`mt-1 block text-[11px] font-medium ${
            vendor.available ? "text-success" : "text-error"
          }`}
        >
          • {vendor.available ? "Available" : "Unavailable"}
        </span>
      </span>

      {/* Radio indicator */}
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-brand-500" : "border-muted-200"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-brand-500" />}
      </span>
    </button>
  );
}
