/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "navy-bg": "#071426",
        "card-navy": "#0D1F36",
        "border-navy": "#1E3A5F",
        "border-navy-subtle": "#1A2E4C",
        "hover-navy": "#122846",
        "electric-blue": "#1677FF",
        "accent-cyan": "#38BDF8",
        "soft-white": "#E6EDF7",
        "muted-slate": "#94A3B8",
        // Telkom Merah Putih Light Mode Theme
        "telkom-red": "#EE2E24",
        "telkom-red-hover": "#D31F17",
        "telkom-red-soft": "#FEF2F2",
        "telkom-red-border": "#FECACA",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "Consolas", "'Liberation Mono'", "Menlo", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}
