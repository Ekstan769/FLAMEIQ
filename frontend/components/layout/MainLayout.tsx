"use client";

import { useState } from "react";
import type { Portal } from "@/types/portal";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function MainLayout({
  portal,
  children,
}: {
  portal: Portal;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        portal={portal}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1">
        <Sidebar
          portal={portal}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav portal={portal} />
    </div>
  );
}