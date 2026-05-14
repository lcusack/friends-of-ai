import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: "#FFD7C2",
        peachDeep: "#FFB89A",
        mint: "#C6F1D6",
        mintDeep: "#9FE3B8",
        sky: "#C8E5FF",
        skyDeep: "#A6D2FF",
        cream: "#FFF8EC",
        ink: "#2A2233",
        sakura: "#FFD1E0",
        sun: "#FFE5A6",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        cute: "0 8px 0 0 rgba(42,34,51,0.08), 0 2px 6px rgba(42,34,51,0.06)",
        cutePressed: "0 2px 0 0 rgba(42,34,51,0.08), 0 1px 2px rgba(42,34,51,0.06)",
        stamp: "0 1px 0 rgba(0,0,0,0.04)",
      },
      borderRadius: {
        blob: "42% 58% 63% 37% / 47% 39% 61% 53%",
      },
      keyframes: {
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px) rotate(-3deg)" },
          "50%": { transform: "translateY(-10px) rotate(3deg)" },
        },
      },
      animation: {
        bounceSoft: "bounceSoft 2.4s ease-in-out infinite",
        wiggle: "wiggle 1.6s ease-in-out infinite",
        pop: "pop 0.5s cubic-bezier(0.22, 1.5, 0.36, 1) both",
        floaty: "floaty 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
