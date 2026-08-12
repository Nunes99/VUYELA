import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down" | "neutral";
  icon?: ReactNode;
  helperText?: string;
  className?: string;
}

export function StatCard({ label, value, delta, direction = "neutral", icon, helperText, className = "" }: StatCardProps) {
  return (
    <article className={["vy-stat", className].filter(Boolean).join(" ")}>
      <div className="vy-stat__header"><span className="vy-stat__label">{label}</span>{icon ? <span className="vy-stat__icon" aria-hidden="true">{icon}</span> : null}</div>
      <strong className="vy-stat__value">{value}</strong>
      {delta ? <span className={`vy-stat__delta vy-stat__delta--${direction}`}>{direction === "up" ? "↑" : direction === "down" ? "↓" : "→"} {delta}</span> : null}
      {helperText ? <span className="vy-field__hint">{helperText}</span> : null}
    </article>
  );
}
