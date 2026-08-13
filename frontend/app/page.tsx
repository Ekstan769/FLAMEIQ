"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Zap,
  CheckCircle2,
  Star,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import RoleSelectionModal from "@/components/auth/RoleSelectionModal";
import type { Portal } from "@/types/portal";

export default function WelcomePage() {
  const router = useRouter();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const handleContinue = (role: Portal) => {
    setIsRoleModalOpen(false);
    router.push(`/signup?role=${role}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="text-2xl font-bold text-brand-500">
          <Image src="/images/logo.png" alt="FlameIQ logo" width={160} height={36} />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-brand-500 px-5 py-2.5 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-50"
          >
            Sign In
          </Link>

          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Get Started
          </button>
        </div>
      </header>

      <section
        className="
          mx-auto
          grid
          min-h-[calc(100vh-80px)]
          max-w-7xl
          grid-cols-1
          items-center
          gap-10
          px-6
          py-8
          md:grid-cols-2
          md:px-12
          md:py-14
          bg-[url('/images/Heroflamee.png')]
          bg-contain
          bg-bottom
          bg-no-repeat
          md:bg-[url('/images/Heroflamee.png')]
          md:bg-right
        "
      >
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f4e79] px-3 py-1 text-xs font-semibold text-white">
            <Flame size={12} className="text-white" />
            Smart Gas Delivery
          </span>
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            <span className="text-ink-500">
              Smart Gas.
              <br />
              Delivered Before
              <br />
            </span>
            <span className="text-[#1f4e79]">You Need It.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-500">
            Monitor your gas level in real time, get smart refill
            predictions, order from trusted vendors and enjoy fast
            delivery right to your doorstep.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Get Started
              <ArrowUpRight size={16} />
            </button>

            <Link
              href="#features"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-brand-50"
            >
              Explore Features
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-muted-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <Shield size={14} className="text-brand-500" />
              Trusted Vendors
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <CheckCircle2 size={14} className="text-brand-500" />
              Quality Check
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <Zap size={14} className="text-brand-500" />
              Fast Delivery
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-muted-100 ring-1 ring-border/20"
                />
              ))}
            </div>

            <div>
              <div className="flex items-center gap-0.5 text-notify-500">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={13}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-500">
                Trusted Vendors by 10,000+ Homes in Nigeria
              </p>
            </div>
          </div>
        </div>
      </section>

      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onContinue={handleContinue}
      />
    </main>
  );
}
