"use client";

import { useState } from "react";
import {
  Search,
  Home,
  Briefcase,
  MapPin,
  Plus,
  ArrowRight,
} from "lucide-react";

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  icon: React.ElementType;
};

const SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: "home",
    label: "Home",
    address: "45 Adeyemi way, Lekki Phase 1, Lagos, Nigeria",
    icon: Home,
  },
  {
    id: "work",
    label: "Work",
    address: "12 Adeyemi way, Lekki Phase 1, Lagos, Nigeria",
    icon: Briefcase,
  },
];

type DeliveryTime = "asap" | "later" | "choose";

const TIME_OPTIONS: { id: DeliveryTime; label: string; sub: string }[] = [
  { id: "asap", label: "ASAP", sub: "10 - 30 mins" },
  { id: "later", label: "Later Today", sub: "3 - 6 hrs" },
  { id: "choose", label: "Choose Time", sub: "Select Time" },
];

export default function DeliveryAddress({
  onContinue,
}: {
  onContinue?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("home");
  const [instructions, setInstructions] = useState("");
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTime>("asap");

  return (
    <div className="max-w-xl rounded-2xl border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-bold text-ink-500">
        Delivery Address
      </h2>
      <p className="mt-1 text-sm text-muted-500">
        Where should we deliver your gas?
      </p>

      <div className="relative mt-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Locations"
          className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-ink-500 outline-none focus:border-brand-500"
        />
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-muted-500">
          Saved Location
        </p>
        <p className="text-[11px] text-muted-400">
          Choose from your frequent locations
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {SAVED_ADDRESSES.map(({ id, label, address, icon: Icon }) => {
            const isSelected = selectedAddressId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedAddressId(id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:bg-brand-50/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} className="text-brand-500" />
                  <span>
                    <span className="block text-sm font-semibold text-ink-500">
                      {label}
                    </span>
                    <span className="block text-xs text-muted-500">
                      {address}
                    </span>
                  </span>
                </span>
                <span className="text-xs font-medium text-brand-500">
                  Edit
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-notify-600 hover:text-notify-700"
        >
          <MapPin size={14} />
          Use Current Location
        </button>
        <span className="h-4 w-px bg-border" />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-hover"
        >
          <Plus size={14} />
          Add New Address
        </button>
      </div>

      <div className="mt-5">
        <label
          htmlFor="delivery-instructions"
          className="text-xs font-semibold text-muted-500"
        >
          Add Delivery Instructions (optional)
        </label>
        <textarea
          id="delivery-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g Access code, gate colour, landmark etc."
          rows={2}
          className="mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500"
        />
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-muted-500">
          Preferred Delivery Time
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map(({ id, label, sub }) => {
            const isSelected = deliveryTime === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDeliveryTime(id)}
                className={`rounded-lg border p-2.5 text-center transition-colors ${
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:bg-brand-50/50"
                }`}
              >
                <span className="block text-sm font-semibold text-ink-500">
                  {label}
                </span>
                <span className="block text-[11px] text-muted-500">
                  {sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}