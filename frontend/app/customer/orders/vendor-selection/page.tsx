"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import VendorCard from "@/components/cards/VendorCard";
import { getVendors } from "@/services/vendorService";
import { useOrder } from "@/context/OrderContext";
import type { Vendor } from "@/types/vendor";

type SortOption = "nearest" | "top-rated" | "price-low" | "price-high";

const SORT_LABELS: Record<SortOption, string> = {
  nearest: "Nearest",
  "top-rated": "Top Rated",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
};

const PAGE_SIZE = 6;

export default function OrdersPage() {
  const router = useRouter();
  const { setVendor } = useOrder();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("nearest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(
    null
  );

  const fetchVendors = async (pageToLoad: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");
    try {
      const response = await getVendors({ page: pageToLoad, limit: PAGE_SIZE });
      const { vendors: fetched, hasMore: more } = response.data;
      setVendors((prev) => (append ? [...prev, ...fetched] : fetched));
      setHasMore(more);
      setPage(pageToLoad);
    } catch {
      setError("Unable to load vendors. Please try again.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleVendors = useMemo(() => {
    const filtered = vendors.filter((vendor) =>
      vendor.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const sorted = [...filtered];
    switch (sortBy) {
      case "top-rated":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case "price-high":
        sorted.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      case "nearest":
      default:
        sorted.sort((a, b) => a.distanceKm - b.distanceKm);
        break;
    }
    return sorted;
  }, [vendors, search, sortBy]);

  const handleContinue = () => {
    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
    if (!selectedVendor) return;

    setVendor(selectedVendor.id, selectedVendor.name, selectedVendor.pricePerUnit);

    // Delivery Address is a teammate's stage, not yet built — this is the
    // agreed route name (matches the vendor-selection / payment-selection
    // naming convention already used in this folder).
    router.push("/customer/orders/delivery-address");
  };

  return (
    <div>
      {/* Page-scoped breadcrumb + title (kept separate from the shared Navbar) */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-500">
          <Link href="/customer/dashboard" className="hover:text-ink-500">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-ink-500">Order Gas</span>
        </nav>
        <h1 className="mt-1 text-2xl font-bold text-ink-500">Order Gas</h1>
      </div>

      {/* Select Vendor card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-ink-500">Select Vendor</h2>
        <p className="mt-1 text-sm text-muted-500">
          Select a trusted vendor near you.
        </p>

        {/* Search + Sort */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vendors"
              className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-3 text-sm text-ink-500 outline-none focus:border-brand-500"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink-500 sm:w-40"
            >
              Sort by
              <ChevronDown size={14} className="text-muted-500" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-white p-1 shadow-lg">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSortBy(option);
                      setIsSortOpen(false);
                    }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                      sortBy === option
                        ? "font-semibold text-brand-500"
                        : "text-ink-500"
                    }`}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vendor list */}
        <h3 className="mt-6 text-base font-bold text-ink-500">
          Available Vendors
        </h3>

        <div className="mt-3 flex flex-col gap-3">
          {loading && (
            <p className="py-6 text-center text-sm text-muted-500">
              Loading vendors…
            </p>
          )}

          {!loading && error && (
            <div className="py-6 text-center">
              <p className="text-sm text-error">{error}</p>
              <button
                type="button"
                onClick={() => fetchVendors(1, false)}
                className="mt-2 text-sm font-medium text-brand-500 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && visibleVendors.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-500">
              No vendors match your search.
            </p>
          )}

          {!loading &&
            !error &&
            visibleVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                selected={selectedVendorId === vendor.id}
                onSelect={() => setSelectedVendorId(vendor.id)}
              />
            ))}
        </div>

        {!loading && !error && hasMore && !search && (
          <button
            type="button"
            onClick={() => fetchVendors(page + 1, true)}
            disabled={loadingMore}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-3 text-sm font-medium text-brand-500 hover:bg-brand-50 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "View more vendors →"}
          </button>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedVendorId}
          className="mt-4 w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
