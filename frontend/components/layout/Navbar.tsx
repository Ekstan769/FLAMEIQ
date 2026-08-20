"use client";

import Image from "next/image";
import { Bell, MapPin, Menu } from "lucide-react";
import type { Portal } from "@/types/portal";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function Navbar({
  portal,
  onToggleSidebar,
}: {
  portal: Portal;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
      <button
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-ink-500 hover:bg-brand-50"
      >
        <Menu size={20} />
      </button>

      {portal === "customer" ? (
        <div className="flex flex-1 items-center gap-2 text-sm text-ink-500">
          <MapPin size={16} className="text-brand-500 shrink-0" />
          <span className="truncate">23 Freedom Way, Lekki Phase 1, Lagos</span>
        </div>
      ) : (
        <Image src="/images/logo.png" alt="FlameIQ logo" width={110} height={26} className="flex-1" />
      )}

      <button
        aria-label="Notifications"
        className="relative rounded-full p-2 hover:bg-brand-50"
      >
        <Bell size={18} className="text-ink-500" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-notify-500" />
      </button>

      <ThemeToggle />
    </header>
  );
}