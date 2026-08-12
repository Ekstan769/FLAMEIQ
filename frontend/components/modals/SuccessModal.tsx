"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/dist/client/components/navigation";

export default function SuccessModal({
  isOpen,
  title = "Successful🎉",
  message,
  redirectTo,
  icon,
}: {
  isOpen: boolean;
  title?: string;
  message: string;
  redirectTo: string;
  icon?: ReactNode;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div onClick={() => router.push(redirectTo)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/60 p-6">
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          {icon ?? <CheckCircle2 size={26} className="text-success" />}
        </div>

        <h2 className="font-heading mt-4 text-lg font-bold text-ink-500">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-500">{message}</p>

      </div>
    </div>
  );
}