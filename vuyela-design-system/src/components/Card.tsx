import type { HTMLAttributes } from "react";
import type { SurfaceMaterial } from "./GlassSurface";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
  dark?: boolean;
  material?: SurfaceMaterial;
}

export function Card({
  padded = true,
  interactive = false,
  dark = false,
  material,
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
  return (
    <div
      className={classes}
      data-material={material}
      data-theme={dark && material ? "dark" : undefined}
      {...props}
    />
  );
}
