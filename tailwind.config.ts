import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070B14",
        panel: "#0E1626",
        panelSoft: "#121F34",
        foreground: "#E5ECFF",
        muted: "#8B97B0",
        success: "#18C787",
        warning: "#F9A826",
        danger: "#F75C5C",
        info: "#4AA6FF"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(88,140,255,.25), 0 8px 35px rgba(35,61,122,.4)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(111,129,177,0.14) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
