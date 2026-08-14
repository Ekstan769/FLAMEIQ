import Link from "next/link";
import { ShoppingCart, Zap, Truck, Store } from "lucide-react";

const ACTIONS = [
  { href: "/customer/orders", label: "Order Gas", icon: ShoppingCart },
  { href: "/customer/smart-refill", label: "Smart Refill", icon: Zap },
  { href: "/customer/track-delivery", label: "Track Order", icon: Truck },
  { href: "/customer/vendor-inquiry", label: "Vendor Inquiry", icon: Store },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-ink-500">Quick Actions</h2>
      <p className="mt-1 text-xs text-muted-500">
        Everything you need, in one tap.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center hover:border-brand-500 hover:bg-brand-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
              <Icon size={16} className="text-brand-500" />
            </span>
            <span className="text-[11px] font-medium text-ink-500">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}