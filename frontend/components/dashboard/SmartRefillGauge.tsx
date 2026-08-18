import { Sparkles, Fuel, Calendar, ArrowUpRight } from "lucide-react";

export default function SmartRefillGauge({
  percent = 35,
  daysLabel = "6 - 8 days",
  dateRange = "12 - 14 August 2026",
}: {
  percent?: number;
  daysLabel?: string;
  dateRange?: string;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles size={14} className="text-notify-400" />
            Smart Refill
          </h2>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
            Building confidence
          </span>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-white/10">
          View Details <ArrowUpRight size={12} />
        </button>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex flex-1 justify-center">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="9"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#F4B400"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Fuel size={14} className="mb-0.5 text-notify-400" />
              <span className="text-xl font-bold">{percent}%</span>
              <span className="text-[10px] text-white/70">
                Estimated Gas Left
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 border-l border-white/20 pl-4">
          <p className="text-xs text-white/70">You may need a refill in</p>
          <p className="mt-0.5 text-lg font-bold">{daysLabel}</p>

          <div className="my-2 h-px w-full bg-white/20" />

          <p className="text-xs text-white/70">Estimated refill window</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
            <Calendar size={13} />
            {dateRange}
          </p>

          <div className="my-2 h-px w-full bg-white/20" />

          <p className="text-[11px] text-white/50">
            Based on your refill history and usage patterns.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button className="flex-1 rounded-lg bg-notify-500 px-4 py-2 text-sm font-semibold text-ink-500 hover:bg-notify-600">
          Order Gas Now
        </button>
        <button className="flex-1 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
          Adjust Estimate
        </button>
      </div>
    </div>
  );
}