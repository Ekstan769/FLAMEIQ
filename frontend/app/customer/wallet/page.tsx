"use client";

import { useEffect, useState } from "react";
import { getWalletBalance, fundWallet, getWalletTransactions } from "@/services/paymentService";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  description?: string;
  createdAt: string;
  gateway?: string;
}

const TX_ICONS: Record<string, string> = {
  PAYMENT: "🛒",
  WALLET_PAY: "👛",
  WALLET_FUND: "💰",
  DEPOSIT: "⬆️",
  WITHDRAWAL: "⬇️",
  REFUND: "↩️",
  PAYOUT: "📤",
};

const TX_STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#22c55e",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function CustomerWalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [fundLoading, setFundLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
      ]);
      setBalance(Number(balRes.data.data.walletBalance));
      setTransactions(txRes.data.data);
    } catch {
      showToast("Failed to load wallet data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWalletData(); }, []);

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < 100) {
      showToast("Minimum top-up amount is ₦100.", "error");
      return;
    }
    setFundLoading(true);
    try {
      const res = await fundWallet(amount);
      const link = res.data.data?.paymentLink;
      if (link) {
        showToast("Redirecting to payment…", "success");
        window.location.href = link;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to initiate top-up.";
      showToast(msg, "error");
    } finally {
      setFundLoading(false);
    }
  };

  const isCredit = (type: string) =>
    ["WALLET_FUND", "DEPOSIT", "REFUND"].includes(type);

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <h1 style={styles.pageTitle}>My Wallet</h1>

      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceGlow} />
        <p style={styles.balanceLabel}>Available Balance</p>
        {loading ? (
          <div style={styles.balanceSkeleton} />
        ) : (
          <p style={styles.balanceAmount}>
            ₦{balance !== null ? balance.toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}
          </p>
        )}
        <p style={styles.balanceSub}>FlameIQ Wallet</p>
      </div>

      {/* Top Up Section */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>💰 Top Up Wallet</h2>

        {/* Quick amounts */}
        <div style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setFundAmount(String(amt))}
              style={{
                ...styles.quickBtn,
                borderColor: fundAmount === String(amt) ? "#f97316" : "#374151",
                background: fundAmount === String(amt) ? "#f9731622" : "#0f172a",
                color: fundAmount === String(amt) ? "#f97316" : "#9ca3af",
              }}
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={styles.inputWrap}>
          <span style={styles.inputPrefix}>₦</span>
          <input
            type="number"
            placeholder="Enter custom amount"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            style={styles.input}
            min={100}
          />
        </div>

        <button
          onClick={handleFundWallet}
          disabled={fundLoading || !fundAmount}
          style={{
            ...styles.fundBtn,
            opacity: !fundAmount ? 0.5 : 1,
            cursor: !fundAmount ? "not-allowed" : "pointer",
          }}
        >
          {fundLoading ? "Redirecting…" : "💳 Top Up via Flutterwave"}
        </button>
      </div>

      {/* Transaction History */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Transaction History</h2>
        {loading ? (
          <div style={styles.centerWrap}>
            <div style={styles.spinner} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>No transactions yet.</p>
          </div>
        ) : (
          <div style={styles.txList}>
            {transactions.map((tx) => {
              const credit = isCredit(tx.type);
              return (
                <div key={tx.id} style={styles.txRow}>
                  <div style={styles.txIconWrap}>
                    <span style={styles.txIcon}>{TX_ICONS[tx.type] ?? "💳"}</span>
                  </div>
                  <div style={styles.txInfo}>
                    <p style={styles.txDesc}>{tx.description || tx.type.replace(/_/g, " ")}</p>
                    <p style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                      {" • "}
                      <span style={{ color: TX_STATUS_COLORS[tx.status] ?? "#9ca3af" }}>
                        {tx.status}
                      </span>
                    </p>
                  </div>
                  <p
                    style={{
                      ...styles.txAmount,
                      color: credit ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {credit ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    maxWidth: 480,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
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
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
  },
  balanceCard: {
    background: "linear-gradient(135deg, #1a1035 0%, #0f172a 40%, #1a0f35 100%)",
    borderRadius: 24,
    padding: "36px 28px",
    textAlign: "center",
    border: "1px solid #312e81",
    position: "relative",
    overflow: "hidden",
  },
  balanceGlow: {
    position: "absolute",
    top: "-60px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 200,
    height: 200,
    background: "radial-gradient(circle, #7c3aed33, transparent 70%)",
    pointerEvents: "none",
  },
  balanceLabel: {
    fontSize: 13,
    color: "#a78bfa",
    textTransform: "uppercase",
    letterSpacing: 1,
    margin: "0 0 12px",
    fontWeight: 600,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 800,
    color: "#f9fafb",
    margin: "0 0 8px",
    letterSpacing: -1,
  },
  balanceSkeleton: {
    width: 200,
    height: 48,
    background: "#334155",
    borderRadius: 8,
    margin: "0 auto 8px",
    animation: "pulse 1.5s infinite",
  },
  balanceSub: {
    fontSize: 12,
    color: "#7c3aed",
    margin: 0,
    fontWeight: 600,
  },
  card: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 20,
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f9fafb",
    margin: 0,
  },
  quickAmounts: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  quickBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 10,
    border: "2px solid",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    minWidth: 80,
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    background: "#0f172a",
    borderRadius: 12,
    border: "1px solid #334155",
    padding: "0 16px",
    gap: 8,
  },
  inputPrefix: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: 600,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f9fafb",
    fontSize: 16,
    padding: "14px 0",
    fontFamily: "inherit",
  },
  fundBtn: {
    padding: "14px 0",
    borderRadius: 12,
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    border: "none",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  centerWrap: { display: "flex", justifyContent: "center", padding: 30 },
  spinner: {
    width: 30,
    height: 30,
    border: "3px solid #374151",
    borderTop: "3px solid #f97316",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyWrap: { textAlign: "center", padding: "20px 0" },
  emptyIcon: { fontSize: 36, margin: "0 0 8px" },
  emptyText: { color: "#9ca3af", fontSize: 14 },
  txList: { display: "flex", flexDirection: "column", gap: 0 },
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 0",
    borderBottom: "1px solid #1e293b",
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txIcon: { fontSize: 18 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: 500, color: "#f9fafb", margin: 0 },
  txDate: { fontSize: 11, color: "#6b7280", margin: "3px 0 0" },
  txAmount: { fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0 },
};
