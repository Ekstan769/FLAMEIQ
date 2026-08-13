import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <a href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="FlameIQ logo" width={160} height={38} />
        </a>

        {/* Login */}
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-[#64748B] sm:inline">
            Already have an account?
          </span>

          <a
            href="/login"
            className="rounded-lg border border-[#B8C9D9] px-6 py-2 font-medium text-[#1F4E79] transition hover:bg-[#F4F8FB]"
          >
            Login
          </a>
        </div>
      </header>

      {children}
    </div>
  );
}