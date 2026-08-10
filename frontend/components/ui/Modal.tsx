"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full rounded-2xl bg-white p-8 shadow-2xl ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-500 shadow-md ring-1 ring-border transition hover:bg-muted-50 sm:-left-4 sm:-top-4"
        >
          <X size={16} />
        </button>

        {children}
      </div>
    </div>
  );
}
