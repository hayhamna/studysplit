/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EDEEE9",
        ink: "#1B1F2A",
        teal: {
          DEFAULT: "#2F6F5E",
          light: "#4C8B79",
          dark: "#1F4E42",
        },
        coral: {
          DEFAULT: "#E4572E",
          light: "#F0805C",
        },
        card: "#DCDFD9",
        cardline: "#C7CBC2",
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
          "0%": { transform: "translateX(-40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        growBar: {
          "0%": { width: "0%" },
        },
      },
      animation: {
        slideOut: "slideOut 0.4s ease forwards",
        slideIn: "slideIn 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};
