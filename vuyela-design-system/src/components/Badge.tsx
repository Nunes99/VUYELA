import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "neutral" | "brand" | "reward" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className = "", children, ...props }: BadgeProps) {
  const toneClass = tone === "neutral" ? "" : `vy-badge--${tone}`;
  return <span className={["vy-badge", toneClass, className].filter(Boolean).join(" ")} {...props}>{icon}{children}</span>;
}
