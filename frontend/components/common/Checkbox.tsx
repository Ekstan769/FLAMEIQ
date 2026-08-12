interface CheckboxProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Checkbox({
  label,
  checked,
  onChange,
}: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[11px] leading-5 text-[#64748B]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] h-[15px] w-[15px] shrink-0 cursor-pointer rounded border-[#CBD5E1] accent-[#1F78B4]"
      />

      <span>{label}</span>
    </label>
  );
}