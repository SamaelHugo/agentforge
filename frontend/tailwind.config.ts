import type { Config } from "tailwindcss";

/** Swiss editorial SaaS: warm paper, ink, hairlines, and one red accent. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F2F1EC",
        surface: {
          DEFAULT: "#FAFAF7",
          raised: "#ECEBE5",
          pop: "#FFFFFF",
        },
        line: {
          DEFAULT: "#CBCAC3",
          soft: "#E1E0DA",
        },
        ink: {
          DEFAULT: "#151515",
          muted: "#66665F",
          faint: "#999891",
        },
        brand: "#E5482D",
        accent: {
          cyan: "#2251D1",
          violet: "#7247A7",
          green: "#167A55",
          amber: "#A66500",
          red: "#C7342D",
        },
      },
      fontFamily: {
        display: ["var(--font-helvetica)", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["var(--font-helvetica)", "Helvetica Neue", "Arial", "sans-serif"],
        editorial: ["var(--font-garamond)", "Garamond", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "2px",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
