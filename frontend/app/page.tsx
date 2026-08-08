import Link from "next/link";
import {
  Shield,
  Zap,
  CheckCircle2,
  Star,
  ArrowUpRight,
  Flame,
} from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-brand-500">
          Flame<span className="text-notify-500">IQ</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-brand-500 px-5 py-2.5 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-50"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
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
          bg-[url('/images/mb-hero-flameiq.png')]
          bg-contain
          bg-bottom
          bg-no-repeat
          md:bg-[url('/images/hero-flameiq.png')]
          md:bg-right
        "
      >
        {/* Left: Copy */}
        <div className="max-w-xl">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-notify-50 px-3 py-1 text-xs font-semibold text-notify-700">
            <Flame size={12} />
            Smart Gas Delivery
          </span>

          {/* Heading */}
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            <span className="text-ink-500">
              Smart Gas.
              <br />
              Delivered Before
              <br />
            </span>

            <span className="text-link-500">You Need It.</span>
          </h1>

          {/* Description */}
          <p className="mt-5 text-[15px] leading-relaxed text-muted-500">
            Monitor your gas level in real time, get smart refill
            predictions, order from trusted vendors and enjoy fast
            delivery right to your doorstep.
          </p>

          {/* Buttons */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Get Started
              <ArrowUpRight size={16} />
            </Link>

            <Link
              href="#features"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-brand-50"
            >
              Explore Features
            </Link>
          </div>

          {/* Trust badges */}
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

          {/* Rating */}
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

      {/* Features section anchor */}
      <section id="features" className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-heading text-3xl font-bold text-ink-500">
            Smarter Gas Management
          </h2>

          <p className="mt-3 max-w-2xl text-muted-500">
            FlameIQ helps households monitor their gas usage, predict refills,
            and connect with trusted vendors.
          </p>
        </div>
      </section>
    </main>
  );
}
