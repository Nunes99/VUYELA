import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  dark?: boolean;
}

export function Card({
  padded = true,
  interactive = false,
  dark = false,
  className = "",
  ...props
}: CardProps) {
  const classes = [
    "vy-card",
    padded ? "vy-card--padded" : "",
    interactive ? "vy-card--interactive" : "",
    dark ? "vy-card--dark" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}
