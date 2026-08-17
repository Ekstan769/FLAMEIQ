"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AuthScreenHeader() {
  const router = useRouter();

  return (
    <div className="mb-8 flex w-full items-center justify-between">
      <Image src="/images/logo.png" alt="FlameIQ logo" width={140} height={34} />
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-500 hover:text-ink-500 cursor-pointer"
      >
        <ArrowLeft size={14} /> Go Back
      </button>
    </div>
  );
}