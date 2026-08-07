import Image from "next/image";
import Link from "next/link";
import { Shield, Zap, CheckCircle2, Star, ArrowUpRight, Flame } from "lucide-react";
import Button from "@/components/ui/Button";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        {/* Swap the Flame icon for <Image src="/images/logo.png" .../> once the logo is ready */}
        <span className="inline-flex items-center gap-1.5 text-lg font-bold text-ink-500">
          <Flame size={20} className="text-brand-500" fill="currentColor" />
          FlameIQ
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-ink-500"
          >
            Sign In
          </Link>
          <Link href="/signup">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-8 md:grid-cols-2 md:px-12 md:py-14 bg-[url('/images/mb-hero-flameiq.png')] md:bg-[url('/images/hero-flameiq.png')] bg-contain bg-right bg-no-repeat">
        {/* Left: copy */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-notify-50 px-3 py-1 text-xs font-semibold text-notify-700">
            <Flame size={12} /> Smart Gas Delivery
          </span>

          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            <span className="text-ink-500">
              Smart Gas. <br />
              Delivered Before <br />
            </span>
            <span className="text-link-500">You Need It.</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-500">
            Monitor your gas level in real time, get smart refill
            predictions, order from trusted vendors and enjoy fast
            delivery right to your doorstep.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
                Get Started <ArrowUpRight size={16} />
              </button>
            </Link>
            <Link href="#features">
              <button className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink-500 hover:bg-brand-50">
                Explore Features
              </button>
            </Link>
          </div>

          {/* Bordered trust badge pills */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-muted-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <Shield size={14} className="text-brand-500" /> Trusted Vendors
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <CheckCircle2 size={14} className="text-brand-500" /> Fast Delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <Zap size={14} className="text-brand-500" /> Fast Delivery
            </span>
          </div>

          {/* Avatar cluster + rating */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-muted-100"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-notify-500">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-xs text-muted-500">
                Trusted Vendors by 10,000+ Homes in Nigeria
              </p>
            </div>
          </div>
        </div>

        {/* Right: hero image, no card — floats directly on the page 
        <div className="w-full h-full block md:hidden">
          <Image
            src="/images/hero-flameiq.png"
            alt="FlameIQ gas cylinder and mobile app"
            width={1200}
            height={1200}
            priority
            sizes="(max-width: 768px) 100vw, 50dvw"
            className=" w-full object-cover"
          />
          
        
        </div>
        */} 
      </section>
    </main>
  );
}