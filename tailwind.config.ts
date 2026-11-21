import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        void: "#080a10",
        mist: "#e8f2fb",
        panel: "var(--panel)",
        brand: {
          red: "var(--brand-red)",
          blue: "var(--brand-blue)",
          cyan: "var(--brand-cyan)",
          magenta: "var(--brand-magenta)",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        panel: "var(--panel-shadow)",
      },
      backgroundImage: {
        atmosphere:
          "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(0,162,231,0.26), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 10%, rgba(231,25,30,0.12), transparent 50%), linear-gradient(180deg, #d9ecf8 0%, #eef5fb 45%, #f7fafc 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
