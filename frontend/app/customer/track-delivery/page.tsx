import { MapPin, Clock } from "lucide-react";
import OrderStatusStepper from "@/components/tracking/OrderStatusStepper";
import DeliveryTimeline from "@/components/tracking/DeliveryTimeline";
import OrderDetailsCard from "@/components/tracking/OrderDetailsCard";
import DeliveryPersonnelCard from "@/components/tracking/DeliveryPersonnelCard";

export default function TrackDeliveryPage() {
  return (
    <main>
      <div>
        <h1 className="font-heading text-xl font-bold text-ink-500">
          Track Your Order
        </h1>
        <p className="text-sm text-muted-500">
          Real-time updates on your gas delivery.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <OrderStatusStepper />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <Clock size={16} className="shrink-0 text-brand-500" />
            <span>
              <span className="font-semibold">
                Estimated delivery time: 11:30 AM - 12:00 PM
              </span>
              <span className="block text-xs text-muted-500">
                Your delivery partner is verified and handles your order
                carefully.
              </span>
            </span>
          </div>

          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted-50">
            <div className="flex flex-col items-center gap-1 text-muted-400">
              <MapPin size={24} />
              <span className="text-xs">Map preview coming soon</span>
            </div>
          </div>

          <DeliveryTimeline />
        </div>

        <div className="flex flex-col gap-5">
          <OrderDetailsCard />
          <DeliveryPersonnelCard />
        </div>
      </div>
    </main>
  );
}