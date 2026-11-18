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
        ink: "#0f2744",
        mist: "#e8f2fb",
        panel: "rgba(255,255,255,0.72)",
        brand: {
          red: "#e11d2e",
          blue: "#1a7adf",
          cyan: "#2ec5f0",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Segoe UI", "sans-serif"],
        display: ["var(--font-onest)", "var(--font-manrope)", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 50px rgba(20, 55, 100, 0.12)",
      },
      backgroundImage: {
        atmosphere:
          "radial-gradient(ellipse 80% 60% at 15% 20%, rgba(46,197,240,0.28), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 10%, rgba(225,29,46,0.12), transparent 50%), linear-gradient(180deg, #d9ecf8 0%, #eef5fb 45%, #f7fafc 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
