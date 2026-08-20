import { Star } from "lucide-react";

const VENDORS = [
  { name: "GasPro Services", distance: "1.2km away", price: "N18,500", rating: 4.8 },
  { name: "BlueFlame Gas", distance: "1.8km away", price: "N8,000", rating: 4.6 },
];

export default function NearbyVendors() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-500">Nearby Vendors</h2>
        <span className="text-xs font-semibold text-brand-500">View all</span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {VENDORS.map((vendor) => (
          <div
            key={vendor.name}
            className="flex items-center justify-between rounded-xl border border-border p-3"
          >
            <div>
              <p className="text-sm font-semibold text-ink-500">
                {vendor.name}
              </p>
              <p className="text-xs text-muted-500">{vendor.distance}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-notify-500">
                <Star size={11} fill="currentColor" strokeWidth={0} />
                {vendor.rating}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink-500">
                {vendor.price}
              </p>
              <button className="mt-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover">
                Order Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}