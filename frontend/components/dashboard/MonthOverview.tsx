import { PiggyBank, Flame, ClipboardList } from "lucide-react";

const STATS = [
  { label: "Total Savings", value: "N2,050", icon: PiggyBank },
  { label: "Gas Consumed", value: "10kg", icon: Flame },
  { label: "Orders", value: "4", icon: ClipboardList },
];

export default function MonthOverview() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-500">
          This Month Overview
        </h2>
        <span className="text-xs font-medium text-muted-500">Aug 2026</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-center"
          >
            <Icon size={16} className="text-brand-500" />
            <span className="text-sm font-bold text-ink-500">{value}</span>
            <span className="text-[11px] text-muted-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}