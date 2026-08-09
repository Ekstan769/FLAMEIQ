import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between px-6 sm:px-10 lg:px-16">
        {/* FlameIQ Logo */}
        <a href="/" className="flex items-center">
          <span className="text-[22px] font-bold tracking-tight text-[#1F4E79]">
            Flame
          </span>

          <span className="text-[22px] font-bold tracking-tight text-[#F5B700]">
            IQ
          </span>
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