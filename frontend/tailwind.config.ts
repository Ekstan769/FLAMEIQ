import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#1F4E79",
        "primary-hover": "#163B5C",

        background: "#F8FAFC",

        text: "#1E293B",
        secondary: "#64748B",

        border: "#E2E8F0",

        success: "#22C55E",
        error: "#EF4444",

        link: "#2563EB",
      },
    },
  },

  plugins: [],
};

export default config;