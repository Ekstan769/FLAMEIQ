import { Search, Bell } from "lucide-react";
import SmartRefillGauge from "@/components/dashboard/SmartRefillGauge";
import ActiveDelivery from "@/components/dashboard/ActiveDelivery";
import QuickActions from "@/components/dashboard/QuickActions";
import NearbyVendors from "@/components/dashboard/NearbyVendors";
import MonthOverview from "@/components/dashboard/MonthOverview";
import PromoBanner from "@/components/dashboard/PromoBanner";

export default function CustomerDashboardPage() {
  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-ink-500">
            Good Morning, Victor
          </h1>
          <p className="text-sm text-muted-500">
            Here&apos;s what&apos;s new for you today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Search"
            className="rounded-full border border-border p-2 hover:bg-brand-50"
          >
            <Search size={16} className="text-muted-500" />
          </button>
          <button
            aria-label="Notifications"
            className="relative rounded-full border border-border p-2 hover:bg-brand-50"
          >
            <Bell size={16} className="text-muted-500" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-notify-500" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500">
              V
            </span>
            <span className="text-sm font-medium text-ink-500">Victor</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SmartRefillGauge />
          <ActiveDelivery />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <NearbyVendors />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthOverview />
        </div>
        <PromoBanner />
      </div>
    </main>
  );
}