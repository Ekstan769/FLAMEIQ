import Image from "next/image";
import { Flame } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card px-10 py-12 text-center shadow-sm">
        {/* Section 1: image */}
        <div className="relative mx-auto h-40 w-32">
          <Image
            src="/images/loading-cylinder.png"
            alt="FlameIQ gas cylinder"
            fill
            priority
            sizes="128px"
            className="object-contain"
          />
        </div>

        {/* Section 2: text */}
        <div className="mt-6">
          {/* Swap the Flame icon for <Image src="/images/logo.png" .../> once the logo is ready */}
          <div className="flex items-center justify-center gap-1.5">
            <Flame size={22} className="text-notify-500" fill="currentColor" />
            <span className="font-heading text-xl font-bold text-ink-500">
              FlameIQ
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-500">
            Smart Gas Delivery,
            <br />
            <span className="text-link-500">Right on Time.</span>
          </p>

          <div className="mt-8">
            <p className="mb-2 text-left text-xs text-muted-400">Loading...</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-50">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}