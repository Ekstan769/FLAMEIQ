import type { ChangeEvent } from "react";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon,
  required,
  className,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-semibold text-ink-500">{label}</span>}
      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500 ${
            icon ? "pl-9 pr-3" : "px-3"
          } ${
            error ? "border-error" : "border-border"
          } ${className ?? ""}`}
        />
      </div>
      {helperText && !error && (
        <span className="text-xs text-muted-400">{helperText}</span>
      )}
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}