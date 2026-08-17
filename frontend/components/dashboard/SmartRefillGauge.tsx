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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles size={14} className="text-notify-400" />
            Smart Refill
          </h2>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
            Building confidence
          </span>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-2 text-xs font-medium text-white hover:bg-white/10">
          View Details <ArrowUpRight size={12} />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-8">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#F4B400"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Fuel size={16} className="mb-1 text-notify-400" />
            <span className="text-2xl font-bold">{percent}%</span>
            <span className="text-[10px] text-white/70">Estimated Gas Left</span>
          </div>
        </div>

        <div className="h-24 w-px shrink-0 bg-white/20" />

        <div className="flex-1 pl-2">
          <p className="text-xs text-white/70">You may need a refill in</p>
          <p className="mt-1 text-xl font-bold">{daysLabel}</p>

          <div className="my-3 h-px w-full bg-white/20" />

          <p className="text-xs text-white/70">Estimated refill window</p>
          <p className="mt-1 flex items-center gap-1.5 text-base font-bold">
            <Calendar size={14} />
            {dateRange}
          </p>

          <div className="my-3 h-px w-full bg-white/20" />

          <p className="text-[11px] text-white/50">
            Based on your refill history and usage patterns.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="flex-1 rounded-lg bg-notify-500 px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-notify-600">
          Order Gas Now
        </button>
        <button className="flex-1 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
          Adjust Estimate
        </button>
      </div>
    </div>
  );
}