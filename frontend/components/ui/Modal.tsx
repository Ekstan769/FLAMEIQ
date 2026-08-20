"use client";

export default function Modal({
  isOpen,
  onClose,
  className = "",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/60 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-2xl bg-white p-6 shadow-lg ${className}`}
      >
        {children}
      </div>
    </div>
  );
}