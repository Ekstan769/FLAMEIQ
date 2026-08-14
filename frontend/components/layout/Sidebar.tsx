import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Zap,
  Wallet,
  Store,
  Settings,
  Package,
  BarChart3,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import type { Portal } from "@/types/portal";

type NavItem = {
  path: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: Record<Portal, NavItem[]> = {
  customer: [
    { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "orders", label: "Order Gas", icon: ShoppingCart },
    { path: "track-delivery", label: "Track Order", icon: Truck },
    { path: "smart-refill", label: "Smart Refill", icon: Zap },
    { path: "wallet", label: "Wallet", icon: Wallet },
    { path: "vendor-inquiry", label: "Vendor Inquiry", icon: Store },
    { path: "settings", label: "Settings", icon: Settings },
  ],
  vendor: [
    { path: "dashboard", label: "Home", icon: LayoutDashboard },
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