export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}: {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-semibold text-ink-500">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-500 outline-none focus:border-brand-500 ${
          error ? "border-error" : "border-border"
        }`}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}