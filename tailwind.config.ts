import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--bg-app)",
          surface: "var(--bg-surface)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
          sidebar: "var(--bg-sidebar)",
          overlay: "#222222",
          hover: "var(--bg-elevated)",
        },
        cream: {
          DEFAULT: "var(--text-primary)",
          dim: "var(--text-secondary)",
        },
        dim: "var(--text-muted)",
        accent: {
          DEFAULT: "#C4A882",
          dim: "#8B7355",
          hover: "#D4BC9A",
        },
        sage: {
          DEFAULT: "#7C9E8F",
          dim: "#5A7A6B",
          hover: "#8CB09F",
        },
        atom: "#8B9CC4",
        molecule: "#C48BB4",
        organism: "#C4A882",
        success: "#4b9560",
        warning: "#f6a609",
        danger: "#fe4338",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "Monaco", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "var(--card-shadow)",
        elevated: "0 8px 24px rgba(0, 0, 0, 0.15)",
        hero: "0 16px 48px rgba(0, 0, 0, 0.2)",
      },
      animation: {
        "fade-in-up": "fade-in-up 600ms ease-out",
        "fade-in": "fade-in 400ms ease-out",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
