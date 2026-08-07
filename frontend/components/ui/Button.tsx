const VARIANT_CLASSES = {
  primary: "bg-brand-500 text-white hover:bg-brand-hover",
  secondary: "border border-brand-500 bg-white text-brand-500 hover:bg-brand-50",
  danger: "bg-error text-white hover:opacity-90",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </button>
  );
}