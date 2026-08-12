import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./vuyela-design-system/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        indigo: "var(--vy-color-indigo)",
        teal: "var(--vy-color-teal)",
        gold: "var(--vy-color-gold)",
        coral: "var(--vy-color-coral)",
        sand: "var(--vy-color-sand)",
        graphite: "var(--vy-color-graphite)"
      },
      fontFamily: {
        display: "var(--vy-font-display)",
        body: "var(--vy-font-body)"
      }
    }
  },
  plugins: []
};

export default config;
