"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-lg p-2 hover:bg-brand-50 dark:hover:bg-ink-900 transition-colors"
    >
      {theme === "light" ? (
        <Moon size={20} className="text-ink-500" />
      ) : (
        <Sun size={20} className="text-yellow-400" />
      )}
    </button>
  );
}
