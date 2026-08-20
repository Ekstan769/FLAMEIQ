"use client";

import React, { useState } from "react";
import {
  Flame,
  MapPin,
  Bot,
  Settings,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

// Types
interface Order {
  id: string;
  date: string;
  item: string;
  quantity: string;
  amount: string;
  paymentStatus: string;
  status: "On the way" | "Pending" | "Delivered" | "Cancelled";
  fee: string;
}

interface TimelineStep {
  title: string;
  time: string;
  status: "completed" | "current" | "upcoming";
  icon: React.ElementType;
}

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

// Sample Data
const mockOrders: Order[] = [
  {
    id: "#FLQ-78391",
    date: "May 18, 2026 . 10:15 AM",
    item: "12.5 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦12,500.00",
    paymentStatus: "Paid",
    status: "On the way",
    fee: "₦500",
  },
  {
    id: "#FLQ-78392",
    date: "Apr. 18, 2026 . 10:15 AM",
    item: "3 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦6,500.00",
    paymentStatus: "Processing",
    status: "Pending",
    fee: "₦500",
  },
  {
    id: "#FLQ-78393",
    date: "Mar. 18, 2026 . 10:15 AM",
    item: "12.5 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦8,500.00",
    paymentStatus: "Paid",
    status: "Delivered",
    fee: "₦500",
  },
  {
    id: "#FLQ-78394",
    date: "Feb. 18, 2026 . 10:15 AM",
    item: "6 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦10,500.00",
    paymentStatus: "Cancelled",
    status: "Cancelled",
    fee: "₦0",
  },
  {
    id: "#FLQ-78395",
    date: "Jan. 18, 2026 . 10:15 AM",
    item: "12.5 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦12,500.00",
    paymentStatus: "Paid",
    status: "Delivered",
    fee: "₦500",
  },
  {
    id: "#FLQ-78396",
    date: "Dec. 11, 2025 . 10:15 AM",
    item: "12 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦12,000.00",
    paymentStatus: "Paid",
    status: "Delivered",
    fee: "₦500",
  },
  {
    id: "#FLQ-78397",
    date: "Jan. 18, 2026 . 10:15 AM",
    item: "12.5 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦12,500.00",
    paymentStatus: "Paid",
    status: "Delivered",
    fee: "₦500",
  },
  {
    id: "#FLQ-78398",
    date: "Feb. 18, 2026 . 10:15 AM",
    item: "6 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦10,500.00",
    paymentStatus: "Cancelled",
    status: "Cancelled",
    fee: "₦0",
  },
  {
    id: "#FLQ-78399",
    date: "Jan. 18, 2026 . 10:15 AM",
    item: "12.5 KG Gas Cylinder",
    quantity: "1 Cylinder",
    amount: "₦12,500.00",
    paymentStatus: "Paid",
    status: "Delivered",
    fee: "₦500",
  },
];

const timelineSteps: TimelineStep[] = [
  { title: "Order Placed", time: "Today, 10:15 AM", status: "completed", icon: CheckCircle2 },
  { title: "Order Confirmed", time: "Today, 10:18 AM", status: "completed", icon: CheckCircle2 },
  { title: "On the way", time: "Today, 10:45 AM", status: "current", icon: Truck },
  { title: "Arriving soon", time: "Est. 11:35 AM", status: "upcoming", icon: MapPin },
  { title: "Delivered", time: "", status: "upcoming", icon: CheckCircle2 },
];

export default function OrderRefill() {
  const [activeTab, setActiveTab] = useState<string>("All Orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(mockOrders[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Helper function to extract numerical amount
  const parseAmount = (amountStr: string) => {
    return parseFloat(amountStr.replace(/[^0-9.]/g, "")) || 0;
  };

  // Helper function to extract timestamp for date sorting
  const parseDate = (dateStr: string) => {
    const cleanedDate = dateStr.replace(" . ", " ");
    return new Date(cleanedDate).getTime() || 0;
  };

  // Filter & Search Logic
  const filteredOrders = mockOrders.filter((order) => {
    const matchesTab =
      activeTab === "All Orders" ||
      (activeTab === "Completed" && order.status === "Delivered") ||
      (activeTab === "In Progress" && (order.status === "On the way" || order.status === "Pending")) ||
      (activeTab === "Cancelled" && order.status === "Cancelled");

    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.item.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Sorting Logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date-desc") {
      return parseDate(b.date) - parseDate(a.date);
    }
    if (sortBy === "date-asc") {
      return parseDate(a.date) - parseDate(b.date);
    }
    if (sortBy === "amount-desc") {
      return parseAmount(b.amount) - parseAmount(a.amount);
    }
    if (sortBy === "amount-asc") {
      return parseAmount(a.amount) - parseAmount(b.amount);
    }
    return 0;
  });

  const getBadgeStyle = (status: Order["status"]) => {
    switch (status) {
      case "On the way":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "Cancelled":
        return "bg-rose-50 text-rose-600 border-rose-200";
    }
  };

  const renderStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "On the way":
        return <Truck className="w-3.5 h-3.5 mr-1" />;
      case "Pending":
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case "Delivered":
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case "Cancelled":
        return <XCircle className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-semibold text-slate-700">Order History</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Bot className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          {/* Orders Main View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:border-r border-slate-200">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Refill Orders</h2>
              <p className="text-xs text-slate-500 mt-1">
                View and manage all your past gas orders
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200 overflow-x-auto">
                {["All Orders", "Completed", "In Progress", "Cancelled"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search & Sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Orders"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* Styled Sort Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Amount: High to Low</option>
                    <option value="amount-asc">Amount: Low to High</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-40vw">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sortedOrders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isSelected ? "bg-slate-50" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                            {order.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-blue-900 flex items-center justify-center text-white shrink-0">
                                <Flame className="w-4 h-4 fill-current text-amber-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">{order.item}</div>
                                <div className="text-[11px] text-slate-400 truncate">{order.date}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{order.amount}</div>
                            <div className="text-[11px] text-slate-400">{order.paymentStatus}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${getBadgeStyle(
                                order.status
                              )}`}
                            >
                              {renderStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-all shadow-sm">
                              {order.status === "On the way" ? "Track Order" : "View Details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>Showing {sortedOrders.length} of {mockOrders.length} orders</span>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-6 h-6 rounded bg-blue-400 text-white font-medium flex items-center justify-center text-xs">
                    1
                  </button>
                  <button className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-xs">
                    2
                  </button>
                  <button className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-xs">
                    3
                  </button>
                  <button className="p-1 rounded border border-slate-200 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar / Bottom Panel: Selected Order Details */}
          {selectedOrder && (
            <aside className="w-full xl:w-80 bg-white p-6 overflow-y-auto shrink-0 border-t xl:border-t-0 border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Delivery Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="xl:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Pill Header */}
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(
                    selectedOrder.status
                  )}`}
                >
                  {renderStatusIcon(selectedOrder.status)}
                  {selectedOrder.status}
                </span>
              </div>

              {/* Cylinder Card */}
              <div className="bg-slate-100/70 p-4 rounded-xl flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center relative shrink-0">
                  <Flame className="w-8 h-8 text-blue-900 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedOrder.item}</h4>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedOrder.amount}
                  </div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded mt-1">
                    {selectedOrder.quantity}
                  </span>
                </div>
              </div>

              {/* Order Payment Summary Breakdown */}
              <div className="space-y-2 text-xs border-b border-slate-100 pb-4">
                <div className="flex justify-between text-slate-500">
                  <span>Order ID</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Order Date</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.date}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-800">Transfer</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.amount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.fee}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span>₦16,500.00</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-slate-900">Delivery Address</h4>
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p>12, Adekunle street, Ikeja GRA, Lagos State.</p>
                </div>
              </div>

              {/* Delivery Personnel */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-slate-900">Delivery Personnel</h4>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                        alt="Personnel"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">Emeka Johnson</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>4.8 (230 deliveries)</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-white">
                    View Profile
                  </button>
                </div>
              </div>

              {/* Delivery Timeline Track */}
              <div className="space-y-4 relative pl-3 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = step.status === "completed";
                  const isCurrent = step.status === "current";

                  return (
                    <div key={idx} className="flex items-start gap-3 relative z-10">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 ${
                          isCompleted
                            ? "bg-blue-900"
                            : isCurrent
                            ? "bg-blue-500 ring-4 ring-blue-100"
                            : "bg-slate-300"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-slate-800">{step.title}</div>
                        {step.time && (
                          <div className="text-[11px] text-slate-400">{step.time}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verification Note */}
              <div className="bg-slate-100/70 p-3 rounded-xl flex items-center gap-2.5 text-xs text-slate-600 border border-slate-200/60">
                <ShieldCheck className="w-5 h-5 text-blue-800 flex-shrink-0" />
                <p className="text-[11px] leading-snug">
                  Your delivery personnel is verified and trained to ensure safe delivery
                </p>
              </div>

              {/* Action Button */}
              <button className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Truck className="w-4 h-4" />
                Track Order
              </button>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}