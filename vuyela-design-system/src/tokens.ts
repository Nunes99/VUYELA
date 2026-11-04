export const tokens = {
  glass: {
    light: {
      bg: "rgba(255, 255, 255, 0.92)",
      border: "#b9cbcf",
      highlight: "rgba(255, 255, 255, 0.55)"
    },
    dark: {
      bg: "rgba(3, 43, 56, 0.94)",
      border: "#78959d",
      highlight: "rgba(255, 255, 255, 0.08)"
    },
    blur: "12px",
    shadow: "0 12px 32px rgba(3, 43, 56, 0.10)"
  },
  motion: { fast: "150ms", normal: "220ms", slow: "400ms", enter: "220ms", emphasis: "400ms" },
  color: {
    indigo: "#073B4C",
    indigo900: "#032B38",
    indigo950: "#021F29",
    teal: "#00A6A6",
    teal600: "#078B91",
    gold: "#F2B544",
    coral: "#D95D4F",
    sand: "#F7F2E8",
    graphite: "#172126",
    success: "#2AA876",
    warning: "#E69B19",
    danger: "#CB4B4B",
    info: "#247BA0"
  },
  breakpoint: { xs: 480, sm: 760, md: 1080, lg: 1280 },
  radius: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, full: 9999 },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96
  }
} as const;

export type VuyelaTokenSet = typeof tokens;
