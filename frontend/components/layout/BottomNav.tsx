import Link from "next/link";
import {
  Home, ClipboardList, Zap, Wallet, User,
  Package, BarChart3, DollarSign, Settings,
} from "lucide-react";
import type { Portal } from "@/types/portal";

const NAV_ITEMS: Record
  Portal,
  { path: string; label: string; icon: React.ElementType }[]
> = {
  customer: [
    { path: "dashboard", label: "Home", icon: Home },
    { path: "orders", label: "Orders", icon: ClipboardList },
    { path: "smart-refill", label: "Refill", icon: Zap },
    { path: "wallet", label: "Wallet", icon: Wallet },
    { path: "settings", label: "Profile", icon: User },
  ],
  vendor: [
    { path: "dashboard", label: "Home", icon: Home },
    { path: "inventory", label: "Stock", icon: Package },
    { path: "orders", label: "Orders", icon: ClipboardList },
    { path: "settings", label: "Settings", icon: Settings },
  ],
};

// Shown only on small screens — the primary nav once this runs inside Capacitor.
export default function BottomNav({ portal }: { portal: Portal }) {
  const items = NAV_ITEMS[portal];

  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-border bg-card py-2 md:hidden">
      {items.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          href={`/${portal}/${path}`}
          className="flex flex-col items-center gap-0.5 px-2 text-[11px] text-ink-500"
        >
          <Icon size={19} className="text-muted-500" />
          {label}
        </Link>
      ))}
    </nav>
  );
}