import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vuyela: {
          indigo: "#073B4C",
          900: "#032B38",
          950: "#021F29",
          teal: "#00A6A6",
          "teal-600": "#078B91",
          gold: "#F2B544",
          coral: "#D95D4F",
          sand: "#F7F2E8",
          graphite: "#172126"
        },
        surface: "var(--vy-surface)",
        background: "var(--vy-bg)",
        foreground: "var(--vy-text)",
        muted: "var(--vy-text-muted)",
        border: "var(--vy-border)",
        success: "var(--vy-success)",
        warning: "var(--vy-warning)",
        danger: "var(--vy-danger)"
      },
      fontFamily: {
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui"],
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      borderRadius: {
        vy: "var(--vy-radius-md)",
        "vy-lg": "var(--vy-radius-lg)",
        "vy-xl": "var(--vy-radius-xl)"
      },
      boxShadow: {
        vy: "var(--vy-shadow-sm)",
        "vy-lg": "var(--vy-shadow-md)",
        focus: "var(--vy-shadow-focus)"
      },
      maxWidth: { vuyela: "var(--vy-container)" },
      screens: { xs: "480px", sm: "760px", md: "1080px", lg: "1280px" }
    }
  },
  plugins: []
};

export default config;
