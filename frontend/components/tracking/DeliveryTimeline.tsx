import { CheckCircle2, Circle } from "lucide-react";

const TIMELINE = [
  {
    label: "Order Placed",
    time: "Today, 10:15 AM",
    description: "You've been successfully placed your order.",
    done: true,
  },
  {
    label: "Order Confirmed",
    time: "Today, 10:20 AM",
    description: "Your order has been confirmed by the vendor.",
    done: true,
  },
  {
    label: "On the way",
    time: "Today, 10:45 AM",
    description: "Your delivery person is on the way to you.",
    done: true,
  },
  {
    label: "Arriving soon",
    time: "Est. 11:25 AM",
    description: "Your order will arrive within a few minutes.",
    done: false,
  },
  {
    label: "Delivered",
    time: "Pending",
    description: "Your order will be marked delivered here.",
    done: false,
  },
];

export default function DeliveryTimeline() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-ink-500">Delivery Timeline</h2>

      <div className="mt-4 flex flex-col">
        {TIMELINE.map((item, i) => (
          <div key={item.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {item.done ? (
                <CheckCircle2 size={18} className="text-brand-500" />
              ) : (
                <Circle size={18} className="text-muted-200" />
              )}
              {i < TIMELINE.length - 1 && (
                <div
                  className={`w-px flex-1 ${
                    item.done ? "bg-brand-500" : "bg-border"
                  }`}
                  style={{ minHeight: "28px" }}
                />
              )}
            </div>
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-500">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted-500">
                  {item.time}
                </span>
              </div>
              <p className="text-xs text-muted-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}