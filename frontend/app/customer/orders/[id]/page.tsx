"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getOrderById, confirmDelivery, cancelOrder } from "@/services/ordersService";
import { initiatePayment, verifyPayment } from "@/services/paymentService";

type OrderStatus =
  | "PAYMENT_PENDING"
  | "PENDING"
  | "ACCEPTED"
  | "ON_ROUTE"
  | "DELIVERED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED";

interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  type: string;
  createdAt: string;
  beforeFillImage?: string;
  afterFillImage?: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  vendor: {
    name: string;
    profile?: { businessName?: string; phone?: string; address?: string; profilePic?: string };
  };
  transactions: { status: string; type: string; amount: number }[];
}

const STATUS_STEPS: OrderStatus[] = [
  "PAYMENT_PENDING",
  "PENDING",
  "ACCEPTED",
  "ON_ROUTE",
  "DELIVERED",
  "CONFIRMED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Awaiting Payment",
  PENDING: "Order Placed",
  ACCEPTED: "Accepted by Vendor",
  ON_ROUTE: "On the Way",
  DELIVERED: "Delivered",
  CONFIRMED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "💳",
  PENDING: "📋",
  ACCEPTED: "✅",
  ON_ROUTE: "🚚",
  DELIVERED: "📦",
  CONFIRMED: "🎉",
  REJECTED: "❌",
  CANCELLED: "🚫",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "#f59e0b",
  PENDING: "#3b82f6",
  ACCEPTED: "#8b5cf6",
  ON_ROUTE: "#06b6d4",
  DELIVERED: "#10b981",
  CONFIRMED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#6b7280",
};

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave" | "wallet">("flutterwave");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrder = async () => {
    try {
      const res = await getOrderById(id);
      setOrder(res.data.data);
    } catch {
      showToast("Failed to load order details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Flutterwave redirect back to this page
  useEffect(() => {
    const paymentRedirect = searchParams.get("payment");
    const txRef = searchParams.get("tx_ref");
    if (paymentRedirect === "redirect" && txRef) {
      (async () => {
        try {
          const res = await verifyPayment(txRef);
          if (res.data.data.status === "SUCCESS") {
            showToast("Payment confirmed! Your order is now placed.", "success");
          } else {
            showToast("Payment not confirmed yet. Please try again.", "error");
          }
        } catch {
          showToast("Could not verify payment.", "error");
        }
        fetchOrder();
      })();
    } else {
      fetchOrder();
    }
  }, [id]);

  const handlePayNow = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const res = await initiatePayment(order.id, paymentMethod);
      if (paymentMethod === "flutterwave") {
        const link = res.data.data?.paymentLink;
        if (link) window.location.href = link;
      } else {
        showToast("Wallet payment successful! Order placed.", "success");
        fetchOrder();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Payment failed.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await confirmDelivery(order.id);
      showToast("Delivery confirmed! Vendor payout has been triggered.", "success");
      fetchOrder();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to confirm delivery.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await cancelOrder(order.id);
      showToast("Order cancelled.", "success");
      fetchOrder();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to cancel order.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isTerminal = order
    ? ["REJECTED", "CANCELLED"].includes(order.status)
    : false;

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading order details…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.loadingWrap}>
        <p style={{ color: "#ef4444", fontSize: 16 }}>Order not found.</p>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status];

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "success" ? "#22c55e" : "#ef4444",
          }}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          ← Back
        </button>
        <div>
          <h1 style={styles.title}>Order #{order.id.substring(0, 8).toUpperCase()}</h1>
          <p style={styles.subtitle}>
            {order.type} Order • {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}
          </p>
        </div>
        <span style={{ ...styles.statusBadge, background: statusColor }}>
          {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Progress Timeline */}
      {!isTerminal && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Order Progress</h2>
          <div style={styles.timeline}>
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStepIndex;
              const active = idx === currentStepIndex;
              return (
                <div key={step} style={styles.timelineItem}>
                  <div style={styles.timelineLeft}>
                    <div
                      style={{
                        ...styles.timelineDot,
                        background: done ? statusColor : "#374151",
                        boxShadow: active ? `0 0 0 4px ${statusColor}33` : "none",
                        transform: active ? "scale(1.2)" : "scale(1)",
                      }}
                    >
                      {done ? "✓" : ""}
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          ...styles.timelineLine,
                          background: idx < currentStepIndex ? statusColor : "#374151",
                        }}
                      />
                    )}
                  </div>
                  <div style={styles.timelineContent}>
                    <p style={{ ...styles.timelineLabel, color: done ? "#f9fafb" : "#6b7280" }}>
                      {STATUS_ICONS[step]} {STATUS_LABELS[step]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cylinder Fill Images */}
      {(order.beforeFillImage || order.afterFillImage) && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🖼 Cylinder Fill Proof</h2>
          <div style={styles.imagesRow}>
            {order.beforeFillImage && (
              <div style={styles.imageWrap}>
                <p style={styles.imageLabel}>Before Filling</p>
                <img src={order.beforeFillImage} alt="Before fill" style={styles.fillImage} />
              </div>
            )}
            {order.afterFillImage && (
              <div style={styles.imageWrap}>
                <p style={styles.imageLabel}>After Filling</p>
                <img src={order.afterFillImage} alt="After fill" style={styles.fillImage} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Order Items</h2>
        {order.items.map((item) => (
          <div key={item.id} style={styles.itemRow}>
            <div>
              <p style={styles.itemName}>{item.name}</p>
              <p style={styles.itemQty}>Qty: {item.quantity}</p>
            </div>
            <p style={styles.itemPrice}>₦{(Number(item.price) * item.quantity).toLocaleString()}</p>
          </div>
        ))}
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>Total</span>
          <span style={styles.totalAmount}>₦{Number(order.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      {/* Vendor Info */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Vendor</h2>
        <div style={styles.vendorRow}>
          {order.vendor.profile?.profilePic ? (
            <img src={order.vendor.profile.profilePic} alt="Vendor" style={styles.vendorAvatar} />
          ) : (
            <div style={styles.vendorAvatarPlaceholder}>
              {order.vendor.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p style={styles.vendorName}>
              {order.vendor.profile?.businessName || order.vendor.name}
            </p>
            {order.vendor.profile?.phone && (
              <p style={styles.vendorPhone}>📞 {order.vendor.profile.phone}</p>
            )}
            {order.vendor.profile?.address && (
              <p style={styles.vendorPhone}>📍 {order.vendor.profile.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Action Panel ─── */}

      {/* Pay Now */}
      {order.status === "PAYMENT_PENDING" && (
        <div style={styles.actionCard}>
          <h2 style={styles.cardTitle}>💳 Complete Your Payment</h2>
          <p style={styles.actionHint}>
            Choose a payment method to confirm your order. Your vendor will be notified once payment
            is received.
          </p>
          <div style={styles.methodRow}>
            {(["flutterwave", "wallet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  ...styles.methodBtn,
                  borderColor: paymentMethod === m ? "#f97316" : "#374151",
                  background: paymentMethod === m ? "#f9731622" : "#1f2937",
                  color: paymentMethod === m ? "#f97316" : "#9ca3af",
                }}
              >
                {m === "flutterwave" ? "💳 Flutterwave" : "👛 Wallet"}
              </button>
            ))}
          </div>
          <div style={styles.actionBtnRow}>
            <button
              onClick={handlePayNow}
              disabled={actionLoading}
              style={styles.primaryBtn}
            >
              {actionLoading ? "Processing…" : `Pay ₦${Number(order.totalAmount).toLocaleString()}`}
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={actionLoading}
              style={styles.dangerBtn}
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}

      {/* Confirm Receipt */}
      {order.status === "DELIVERED" && (
        <div style={styles.actionCard}>
          <h2 style={styles.cardTitle}>📦 Confirm Receipt</h2>
          <p style={styles.actionHint}>
            Have you received your gas cylinder? Confirming receipt will release the payment to the
            vendor.
          </p>
          <button
            onClick={handleConfirmReceipt}
            disabled={actionLoading}
            style={styles.primaryBtn}
          >
            {actionLoading ? "Confirming…" : "✅ I've Received My Order"}
          </button>
        </div>
      )}

      {/* Rejected / Cancelled */}
      {isTerminal && (
        <div style={{ ...styles.actionCard, borderColor: "#ef4444" }}>
          <h2 style={{ ...styles.cardTitle, color: "#ef4444" }}>
            {STATUS_ICONS[order.status]} Order {STATUS_LABELS[order.status]}
          </h2>
          <p style={styles.actionHint}>
            {order.status === "REJECTED"
              ? "This order was rejected by the vendor. A refund will be processed shortly."
              : "This order has been cancelled."}
          </p>
          <button onClick={() => router.push("/customer/orders")} style={styles.secondaryBtn}>
            Back to Orders
          </button>
        </div>
      )}

      {/* Completed */}
      {order.status === "CONFIRMED" && (
        <div style={{ ...styles.actionCard, borderColor: "#22c55e" }}>
          <h2 style={{ ...styles.cardTitle, color: "#22c55e" }}>🎉 Order Complete!</h2>
          <p style={styles.actionHint}>
            This order has been successfully completed. Thank you for using FlameIQ!
          </p>
          <button onClick={() => router.push("/customer/orders")} style={styles.secondaryBtn}>
            View All Orders
          </button>
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
    color: "#f9fafb",
    padding: "24px 16px 80px",
    fontFamily: "'Inter', sans-serif",
    maxWidth: 680,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  loadingWrap: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #374151",
    borderTop: "3px solid #f97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#9ca3af", fontSize: 14 },
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
    whiteSpace: "nowrap",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f9fafb",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  card: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #334155",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f9fafb",
    marginBottom: 16,
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  timelineItem: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    transition: "all 0.3s ease",
  },
  timelineLine: {
    width: 2,
    height: 24,
    transition: "background 0.3s ease",
  },
  timelineContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: 500,
    margin: 0,
    transition: "color 0.3s ease",
  },
  imagesRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  imageWrap: {
    flex: 1,
    minWidth: 140,
  },
  imageLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fillImage: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #334155",
    objectFit: "cover",
    aspectRatio: "4/3",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #334155",
  },
  itemName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#f9fafb",
    margin: 0,
  },
  itemQty: {
    fontSize: 12,
    color: "#9ca3af",
    margin: "2px 0 0",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f97316",
    margin: 0,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f9fafb",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f97316",
  },
  vendorRow: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  vendorAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
  },
  vendorAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f97316, #ef4444)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f9fafb",
    margin: 0,
  },
  vendorPhone: {
    fontSize: 13,
    color: "#9ca3af",
    margin: "4px 0 0",
  },
  actionCard: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #f97316",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  actionHint: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 1.6,
    margin: 0,
  },
  methodRow: {
    display: "flex",
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    padding: "12px 0",
    borderRadius: 10,
    border: "2px solid",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  actionBtnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    flex: 1,
    padding: "14px 24px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #f97316, #ef4444)",
    border: "none",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    minWidth: 160,
  },
  dangerBtn: {
    padding: "14px 20px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid #ef4444",
    color: "#ef4444",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "14px 24px",
    borderRadius: 12,
    background: "#334155",
    border: "none",
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
