import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl rounded-[36px] border border-border bg-card px-8 py-10 shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-20 w-44">
              <Image
                src="/images/logo.svg"
                alt="FlameIQ logo"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-brand-700)" }}>
                Smart Gas Delivery,
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-notify-500)" }}>
                Right on Time.
              </p>
            </div>
          </div>

          <div className="relative h-[320px] w-full max-w-sm mx-auto">
            <Image
              src="/images/loading-cylinder.png"
              alt="FlameIQ gas cylinder"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="w-full max-w-lg">
            <div className="mb-3 text-center text-sm font-medium text-muted-700">
              Loading...
            </div>
            <div className="mx-auto h-2 w-full overflow-hidden rounded-full bg-brand-50">
              <div className="h-full w-2/3 rounded-full bg-brand-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}