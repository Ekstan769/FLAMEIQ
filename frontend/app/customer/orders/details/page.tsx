"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Star,
  Image as ImageIcon,
  Upload,
  ChevronLeft,
} from "lucide-react";

interface TimelineStep {
  title: string;
  time: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ElementType;
}

const timelineSteps: TimelineStep[] = [
  {
    title: "Order Placed",
    time: "May 18, 2026, 10:15 AM",
    status: "completed",
    icon: CheckCircle2,
  },
  {
    title: "Confirmed",
    time: "May 18, 2026, 10:20 AM",
    status: "completed",
    icon: CheckCircle2,
  },
  {
    title: "On the way",
    time: "May 18, 2026, 10:45 AM",
    status: "current",
    icon: Truck,
  },
  {
    title: "Arriving Soon",
    time: "Est. 11:30 AM",
    status: "upcoming",
    icon: MapPin,
  },
  {
    title: "Delivered",
    time: "",
    status: "upcoming",
    icon: CheckCircle2,
  },
];

export default function OrderDetailsView() {
  const [orderStatus, setOrderStatus] = useState<"Pending" | "On the way">(
    "On the way"
  );
  const [userProof, setUserProof] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserProof(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Layout Wrapper */}
        <div className="flex flex-col lg:flex-row">
          
          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-slate-500 mb-2 cursor-pointer hover:text-slate-800 text-xs font-medium">
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Orders</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Order Details
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                View and manage all your past gas orders
              </p>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <button
                onClick={() => setOrderStatus("Pending")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orderStatus === "Pending"
                    ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                    : "bg-amber-50/60 text-amber-600 hover:bg-amber-100/80"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending
              </button>

              <button
                onClick={() => setOrderStatus("On the way")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orderStatus === "On the way"
                    ? "bg-blue-100 text-blue-900 ring-2 ring-blue-300"
                    : "bg-blue-50/60 text-blue-600 hover:bg-blue-100/80"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                On the way
              </button>
            </div>

            {/* Product Card & Actions */}
            <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 bg-white shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-xl p-2 flex items-center justify-center shrink-0 border border-slate-100">
                    <img
                      src=""
                      alt="Gas Cylinder"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      12.5Kg Gas Cylinder
                    </h2>
                    <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                      ₦16,000.00
                    </p>
                    <span className="inline-block bg-blue-50 text-blue-900 text-xs font-semibold px-3 py-1 rounded-md mt-2 border border-blue-100">
                      1 Cylinder
                    </span>
                  </div>
                </div>

                {/* Cancel Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-600 font-semibold text-xs rounded-lg transition-colors">
                    Cancel Order
                  </button>
                  <button className="px-4 py-2 bg-slate-200 text-slate-400 font-semibold text-xs rounded-lg cursor-not-allowed">
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>

            {/* Vendor's Proof of Refill */}
            <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                Vendor’s Proof of Refill
              </h3>
              <p className="text-xs text-slate-500 mb-4 mt-0.5">
                Your gas weight before & after refill will be uploaded here by your vendor.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-32 sm:h-36 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                  <span className="text-[11px] font-medium">JPEG (10 mb)</span>
                </div>
                <div className="h-32 sm:h-36 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                  <span className="text-[11px] font-medium">JPEG (10 mb)</span>
                </div>
              </div>
            </div>

            {/* Customer's Proof of Refill */}
            <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                Proof of Refill
              </h3>
              <p className="text-xs text-slate-500 mb-4 mt-0.5">
                Upload 1 photo to confirm your order was received
              </p>

              <div className="max-w-xs">
                <label className="h-32 sm:h-36 bg-white border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors rounded-xl flex flex-col items-center justify-center p-4 text-slate-400 cursor-pointer overflow-hidden relative">
                  {userProof ? (
                    <img
                      src={userProof}
                      alt="Proof"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-1 text-slate-300" />
                      <span className="text-[11px] font-medium">JPEG (10 mb)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Action Confirmation */}
            <div className="flex justify-center pt-2">
              <button className="w-full sm:w-72 py-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm">
                Confirm
              </button>
            </div>
          </main>

          {/* Delivery Details Sidebar */}
          <aside className="w-full lg:w-80 p-4 sm:p-6 lg:p-8 bg-white space-y-6 shrink-0">
            <h3 className="font-bold text-base text-slate-900">
              Delivery Details
            </h3>

            {/* Delivery Driver Info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Emeka Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Emeka Johnson
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>4.8 (230 deliveries)</span>
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                View Profile
              </button>
            </div>

            {/* Delivery Timeline Track */}
            <div className="space-y-5 relative pl-3 before:absolute before:left-4.75 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "current";

                return (
                  <div key={idx} className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 ${
                        isCompleted
                          ? "bg-blue-950"
                          : isCurrent
                          ? "bg-blue-600 ring-4 ring-blue-100"
                          : "bg-slate-300"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-slate-800">
                        {step.title}
                      </div>
                      {step.time && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {step.time}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verification Banner */}
            <div className="bg-slate-100/80 p-3.5 rounded-xl flex items-center gap-3 text-xs text-slate-600 border border-slate-200/60">
              <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                Your delivery personnel is verified and trained to ensure safe delivery
              </p>
            </div>

            {/* Delivery Address Card */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-slate-900">
                Delivery Address
              </h4>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  12, Adekunle street, Ikeja GRA, Lagos State.
                </p>
              </div>
            </div>

            {/* Track Button */}
            <button className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
              <Truck className="w-4 h-4" />
              Track Order
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}