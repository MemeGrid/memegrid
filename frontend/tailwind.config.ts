import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B4A5C",
        "ink-deep": "#082F3B",
        paper: "#F5F8F0",
        "paper-dim": "#E9EEE2",
        signal: "#E8632C",
        "signal-dim": "#F2A98A",
        sage: "#7C9186",
        deep: "#0A1F1E",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
