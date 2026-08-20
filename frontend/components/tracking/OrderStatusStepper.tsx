import { Check, Package, Truck, MapPinned, Home } from "lucide-react";

const STEPS = [
  { label: "Order Placed", time: "Today, 10:15 AM", icon: Check, done: true },
  { label: "Confirmed", time: "Today, 10:20 AM", icon: Package, done: true },
  { label: "On the way", time: "Today, 10:45 AM", icon: Truck, done: true, active: true },
  { label: "Arriving soon", time: "Est. 11:25 AM", icon: MapPinned, done: false },
  { label: "Delivered", time: "Pending", icon: Home, done: false },
];

export default function OrderStatusStepper() {
  return (
    <div className="flex items-start justify-between">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            {i > 0 && (
              <div
                className={`h-0.5 flex-1 ${
                  step.done ? "bg-brand-500" : "bg-border"
                }`}
              />
            )}
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                step.done
                  ? "bg-brand-500 text-white"
                  : "bg-muted-50 text-muted-400"
              } ${step.active ? "ring-4 ring-brand-100" : ""}`}
            >
              <step.icon size={15} />
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  STEPS[i + 1].done ? "bg-brand-500" : "bg-border"
                }`}
              />
            )}
          </div>
          <span className="mt-2 text-center text-xs font-medium text-ink-500">
            {step.label}
          </span>
          <span className="text-center text-[10px] text-muted-500">
            {step.time}
          </span>
        </div>
      ))}
    </div>
  );
}