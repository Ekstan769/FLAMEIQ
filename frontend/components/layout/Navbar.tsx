"use client";

import Image from "next/image";
import { Bell, MapPin } from "lucide-react";
import type { Portal } from "@/types/portal";

export default function Navbar({ portal }: { portal: Portal }) {
  if (portal === "customer") {
    return (
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <MapPin size={16} className="text-brand-500" />
          <span className="truncate">23 Freedom Way, Lekki Phase 1, Lagos</span>
        </div>
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 hover:bg-brand-50"
        >
          <Bell size={18} className="text-ink-500" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-notify-500" />
        </button>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <Image src="/images/logo.png" alt="FlameIQ logo" width={140} height={34} />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-500">
        {portal}
      </span>
    </header>
  );
}