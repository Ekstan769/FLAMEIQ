"use client";

import { useRef } from "react";

export default function OtpInput({
  length = 4,
  value,
  onChange,
}: {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = clean;
    onChange(next);

    if (clean && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${length}`}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-12 rounded-lg border border-border text-center text-lg font-semibold text-ink-500 outline-none focus:border-brand-500"
        />
      ))}
    </div>
  );
}