import type { ReactNode } from "react";
import AuthScreenHeader from "@/components/layout/AuthScreenHeader";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Full-width header, shared by every page under (auth) */}
      <div className="w-full px-4 py-5 sm:px-6 lg:px-[58px]">
        <AuthScreenHeader />
      </div>

      {/* Content sits below the header, top-aligned (not vertically centered) */}
      <main className="flex flex-1 justify-center px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
