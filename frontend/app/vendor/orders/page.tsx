"use client";

import { useEffect, useRef, useState } from "react";
import { getOrders, acceptOrder, rejectOrder, setOrderOnRoute, setOrderDelivered } from "@/services/ordersService";

type OrderStatus = "PAYMENT_PENDING" | "PENDING" | "ACCEPTED" | "ON_ROUTE" | "DELIVERED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  type: string;
  createdAt: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  user: { name: string; profile?: { phone?: string; address?: string } };
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "#6b7280",
  PENDING: "#f59e0b",
  ACCEPTED: "#8b5cf6",
  ON_ROUTE: "#06b6d4",
  DELIVERED: "#10b981",
  CONFIRMED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#6b7280",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Awaiting Payment",
  PENDING: "Needs Action",
  ACCEPTED: "Accepted",
  ON_ROUTE: "On Route",
  DELIVERED: "Delivered",
  CONFIRMED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const ACTIVE_FILTERS: OrderStatus[] = ["PENDING", "ACCEPTED", "ON_ROUTE", "DELIVERED"];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data.data);
    } catch {
      showToast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleFileSelect = (type: "before" | "after", file: File) => {
    const url = URL.createObjectURL(file);
    if (type === "before") { setBeforeFile(file); setBeforePreview(url); }
    else { setAfterFile(file); setAfterPreview(url); }
  };

  const handleAccept = async () => {
    if (!selectedOrder || !beforeFile || !afterFile) {
      showToast("Please upload both before and after fill images.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("beforeFillImage", beforeFile);
      formData.append("afterFillImage", afterFile);
      await acceptOrder(selectedOrder.id, formData);
      showToast("Order accepted successfully!", "success");
      setShowAcceptModal(false);
      setBeforeFile(null); setAfterFile(null);
      setBeforePreview(null); setAfterPreview(null);
      fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to accept order.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionLoading(true);
    try {
      await rejectOrder(orderId);
      showToast("Order rejected. Buyer will be notified.", "success");
      fetchOrders();
    } catch {
      showToast("Failed to reject order.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnRoute = async (orderId: string) => {
    setActionLoading(true);
    try {
      await setOrderOnRoute(orderId);
      showToast("Order marked as On Route!", "success");
      fetchOrders();
    } catch {
      showToast("Failed to update order.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelivered = async (orderId: string) => {
    setActionLoading(true);
    try {
      await setOrderDelivered(orderId);
      showToast("Order marked as Delivered! Waiting for buyer confirmation.", "success");
      fetchOrders();
    } catch {
      showToast("Failed to update order.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const displayedOrders = filter === "active"
    ? orders.filter((o) => ACTIVE_FILTERS.includes(o.status))
    : orders;

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          {pendingCount > 0 && (
            <p style={styles.subtitle}>{pendingCount} order{pendingCount !== 1 ? "s" : ""} need your action</p>
          )}
        </div>
        <div style={styles.filterRow}>
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? "#f97316" : "#1e293b",
                color: filter === f ? "#fff" : "#9ca3af",
              }}
            >
              {f === "active" ? "Active" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={styles.centerWrap}>
          <div style={styles.spinner} />
        </div>
      ) : displayedOrders.length === 0 ? (
        <div style={styles.emptyWrap}>
          <p style={styles.emptyIcon}>📋</p>
          <p style={styles.emptyText}>No {filter === "active" ? "active " : ""}orders found.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {displayedOrders.map((order) => (
            <div key={order.id} style={styles.orderCard}>
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.orderId}>#{order.id.substring(0, 8).toUpperCase()}</p>
                  <p style={styles.orderMeta}>
                    {order.type} • {new Date(order.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <span style={{ ...styles.statusPill, background: STATUS_COLORS[order.status] + "22", color: STATUS_COLORS[order.status], border: `1px solid ${STATUS_COLORS[order.status]}` }}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              {/* Buyer Info */}
              <div style={styles.buyerRow}>
                <div style={styles.buyerAvatar}>{order.user.name[0].toUpperCase()}</div>
                <div>
                  <p style={styles.buyerName}>{order.user.name}</p>
                  {order.user.profile?.address && (
                    <p style={styles.buyerAddr}>📍 {order.user.profile.address}</p>
                  )}
                </div>
              </div>

              {/* Items Summary */}
              <div style={styles.itemsSummary}>
                {order.items.slice(0, 2).map((item) => (
                  <p key={item.id} style={styles.itemLine}>
                    {item.quantity}× {item.name}
                  </p>
                ))}
                {order.items.length > 2 && (
                  <p style={styles.itemLine}>+{order.items.length - 2} more</p>
                )}
              </div>

              {/* Total */}
              <div style={styles.cardFooter}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalAmount}>₦{Number(order.totalAmount).toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionRow}>
                {order.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => { setSelectedOrder(order); setShowAcceptModal(true); }}
                      disabled={actionLoading}
                      style={styles.acceptBtn}
                    >
                      ✅ Accept
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      disabled={actionLoading}
                      style={styles.rejectBtn}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {order.status === "ACCEPTED" && (
                  <button onClick={() => handleOnRoute(order.id)} disabled={actionLoading} style={styles.primaryBtn}>
                    🚚 Mark On Route
                  </button>
                )}
                {order.status === "ON_ROUTE" && (
                  <button onClick={() => handleDelivered(order.id)} disabled={actionLoading} style={styles.primaryBtn}>
                    📦 Mark Delivered
                  </button>
                )}
                {order.status === "DELIVERED" && (
                  <p style={styles.waitingText}>⏳ Waiting for buyer to confirm receipt…</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accept Modal with Image Upload */}
      {showAcceptModal && selectedOrder && (
        <div style={styles.modalOverlay} onClick={() => setShowAcceptModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Accept Order #{selectedOrder.id.substring(0, 8).toUpperCase()}</h2>
            <p style={styles.modalHint}>
              Upload proof images of the cylinder before and after filling to confirm your acceptance.
            </p>

            {/* Before Fill Image */}
            <div style={styles.uploadSection}>
              <p style={styles.uploadLabel}>📷 Before Filling</p>
              <div
                style={styles.uploadBox}
                onClick={() => beforeRef.current?.click()}
              >
                {beforePreview ? (
                  <img src={beforePreview} alt="Before" style={styles.previewImg} />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={styles.uploadIcon}>📁</span>
                    <span style={styles.uploadHint}>Tap to upload</span>
                  </div>
                )}
              </div>
              <input
                ref={beforeRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect("before", e.target.files[0])}
              />
            </div>

            {/* After Fill Image */}
            <div style={styles.uploadSection}>
              <p style={styles.uploadLabel}>📷 After Filling</p>
              <div
                style={styles.uploadBox}
                onClick={() => afterRef.current?.click()}
              >
                {afterPreview ? (
                  <img src={afterPreview} alt="After" style={styles.previewImg} />
                ) : (
                  <div style={styles.uploadPlaceholder}>
                    <span style={styles.uploadIcon}>📁</span>
                    <span style={styles.uploadHint}>Tap to upload</span>
                  </div>
                )}
              </div>
              <input
                ref={afterRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect("after", e.target.files[0])}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={handleAccept}
                disabled={actionLoading || !beforeFile || !afterFile}
                style={{
                  ...styles.primaryBtn,
                  opacity: !beforeFile || !afterFile ? 0.5 : 1,
                  cursor: !beforeFile || !afterFile ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Accepting…" : "✅ Confirm Accept"}
              </button>
              <button
                onClick={() => setShowAcceptModal(false)}
                style={styles.cancelModalBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "24px 16px 80px",
    fontFamily: "'Inter', sans-serif",
    color: "#f9fafb",
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    zIndex: 1000,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 13, color: "#f59e0b", margin: "4px 0 0" },
  filterRow: { display: "flex", gap: 8 },
  filterBtn: {
    padding: "8px 18px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  centerWrap: { display: "flex", justifyContent: "center", padding: 60 },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #374151",
    borderTop: "3px solid #f97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyWrap: { textAlign: "center", padding: "60px 0" },
  emptyIcon: { fontSize: 48, margin: "0 0 12px" },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  orderCard: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 18,
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 16, fontWeight: 700, color: "#f9fafb", margin: 0 },
  orderMeta: { fontSize: 12, color: "#6b7280", margin: "3px 0 0" },
  statusPill: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  buyerRow: { display: "flex", alignItems: "center", gap: 10 },
  buyerAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    flexShrink: 0,
  },
  buyerName: { fontSize: 14, fontWeight: 600, color: "#f9fafb", margin: 0 },
  buyerAddr: { fontSize: 12, color: "#9ca3af", margin: "2px 0 0" },
  itemsSummary: {
    background: "#0f172a",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemLine: { fontSize: 13, color: "#9ca3af", margin: 0 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, color: "#6b7280" },
  totalAmount: { fontSize: 18, fontWeight: 700, color: "#f97316" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  acceptBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    minWidth: 100,
  },
  rejectBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    minWidth: 100,
  },
  primaryBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    background: "linear-gradient(135deg, #f97316, #ef4444)",
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  waitingText: { fontSize: 13, color: "#9ca3af", margin: 0, fontStyle: "italic" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    background: "#1e293b",
    borderRadius: "24px 24px 0 0",
    padding: 24,
    width: "100%",
    maxWidth: 500,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#f9fafb", margin: 0 },
  modalHint: { fontSize: 13, color: "#9ca3af", lineHeight: 1.6, margin: 0 },
  uploadSection: { display: "flex", flexDirection: "column", gap: 8 },
  uploadLabel: { fontSize: 14, fontWeight: 600, color: "#f9fafb", margin: 0 },
  uploadBox: {
    border: "2px dashed #334155",
    borderRadius: 12,
    height: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  uploadIcon: { fontSize: 32 },
  uploadHint: { fontSize: 13, color: "#6b7280" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  modalActions: { display: "flex", flexDirection: "column", gap: 10 },
  cancelModalBtn: {
    padding: "12px 0",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #334155",
    color: "#9ca3af",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
};
