import Image from "next/image";
import Link from "next/link";

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-500 p-6 text-white">
      <div className="max-w-[70%]">
        <h2 className="font-heading text-lg font-bold leading-snug">
          Never run out of cooking gas again
        </h2>
        <p className="mt-2 text-xs text-white/80">
          Let FlameIQ predict, remind and refill on your behalf, on time,
          every time.
        </p>
        <Link
          href="/customer/smart-refill"
          className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-xs font-semibold text-brand-500 hover:bg-brand-50"
        >
          Explore Smart Refill
        </Link>
      </div>

      <div className="absolute -right-4 bottom-0 h-32 w-32 opacity-90">
        <Image
          src="/images/loading-cylinder.png"
          alt="FlameIQ gas cylinder"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}