type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className="flex h-[48px] w-full items-center justify-center rounded-lg bg-[#1687D9] text-[14px] font-medium text-white transition hover:bg-[#1178C2] active:scale-[0.99]"
    >
      {children}
      <span className="ml-2">↗</span>
    </button>
  );
}