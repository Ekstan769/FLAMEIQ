"use client";

type InputProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: InputProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block text-[12px] font-medium text-[#334155]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-[48px] w-full rounded-lg border border-[#D8E1EA] bg-white px-4 text-[13px] text-[#334155] outline-none transition placeholder:text-[#A7B2BE] focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10"
        />
      </div>
    </div>
  );
}