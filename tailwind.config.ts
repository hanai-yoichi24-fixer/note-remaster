import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#d9e6ff", 200: "#bcd3ff", 300: "#8eb4ff",
          400: "#598bff", 500: "#3563ff", 600: "#1f43f5", 700: "#1832e1",
          800: "#1a2bb6", 900: "#1b2b8f", 950: "#151a54",
        },
        ink: { DEFAULT: "#0f172a", soft: "#334155", faint: "#64748b" },
      },
      fontFamily: {
        sans: ["ui-sans-serif","system-ui","-apple-system","Hiragino Kaku Gothic ProN","Meiryo","sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
