/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2EEE1",
        ink: "#1B2B3A",
        teal: {
          DEFAULT: "#2F6F5E",
          light: "#4C8B79",
          dark: "#1F4E42",
          50: "#E8F2EE",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#DBBB5E",
          dark: "#A8841C",
          50: "#F8F0DA",
        },
        coral: {
          DEFAULT: "#A63D2F",
          light: "#C15A47",
          50: "#F5E6E1",
        },
        card: "#EFEBE1",
        cardline: "#DCD7C9",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        slideOut: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(40px)", opacity: "0" },
        },
        slideIn: {
          "0%": { transform: "translateX(-40px) scale(0.97)", opacity: "0" },
          "100%": { transform: "translateX(0) scale(1)", opacity: "1" },
        },
        fadeUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        slideOut: "slideOut 0.4s cubic-bezier(0.4,0,0.2,1) forwards",
        slideIn: "slideIn 0.45s cubic-bezier(0.4,0,0.2,1) forwards",
        fadeUp: "fadeUp 0.35s ease-out forwards",
        shimmer: "shimmer 1.6s linear infinite",
        pulseSoft: "pulseSoft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
