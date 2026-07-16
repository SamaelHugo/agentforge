import type { Config } from "tailwindcss";

/**
 * Design language: Raycast.
 * Dark-only. Depth comes from a surface ladder + 1px hairlines — never from
 * shadows, blur or glass. Brand red is a *signal*, not a call-to-action:
 * the primary CTA is plain white, exactly as Raycast does it.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // canvas → panel → raised → popover (the whole depth system)
        bg: "#07080A",
        surface: {
          DEFAULT: "#0D0D0F",
          raised: "#121214",
          pop: "#17171A",
        },
        line: {
          DEFAULT: "#242728", // hairline border
          soft: "#1A1C1D", // divider nested inside a bordered panel
        },
        ink: {
          DEFAULT: "#F2F2F3",
          muted: "#8B8D90",
          faint: "#5F6266",
        },
        // Raycast brand red — status/logo signal only, never a CTA
        brand: "#FF6363",
        // Raycast's semantic set — the trace panel's whole vocabulary
        accent: {
          cyan: "#57C1FF", // info / tool call
          violet: "#B084F5",
          green: "#59D499", // success / result
          amber: "#FFC531", // warning
          red: "#FF6161", // error
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "10px",
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
