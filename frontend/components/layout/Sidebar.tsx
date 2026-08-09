import Link from "next/link";
import {
  Home, ClipboardList, Zap, Wallet, User,
  Package, BarChart3, DollarSign, Settings,
} from "lucide-react";
import type { Portal } from "@/types/portal";

const NAV_ITEMS: Record<
  Portal,
  { path: string; label: string; icon: React.ElementType }[]
> = {
  customer: [
    { path: "dashboard", label: "Home", icon: Home },
    { path: "orders", label: "Orders", icon: ClipboardList },
    { path: "smart-refill", label: "Smart Refill", icon: Zap },
    { path: "wallet", label: "Wallet", icon: Wallet },
    { path: "settings", label: "Profile", icon: User },
  ],
  vendor: [
    { path: "dashboard", label: "Home", icon: Home },
    { path: "inventory", label: "Inventory", icon: Package },
    { path: "analytics", label: "Analytics", icon: BarChart3 },
    { path: "earnings", label: "Earnings", icon: DollarSign },
    { path: "orders", label: "Orders", icon: ClipboardList },
    { path: "settings", label: "Settings", icon: Settings },
  ],
};

// Hidden on small screens in favor of BottomNav.
export default function Sidebar({ portal }: { portal: Portal }) {
  const items = NAV_ITEMS[portal];

  return (
    <nav className="hidden w-56 flex-col gap-1 border-r border-border p-4 md:flex">
      {items.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          href={`/${portal}/${path}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-brand-50"
        >
          <Icon size={17} className="text-muted-500" />
          {label}
        </Link>
      ))}
    </nav>
  );
}