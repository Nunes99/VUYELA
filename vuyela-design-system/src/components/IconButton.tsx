import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
}

const variantClass: Record<IconButtonVariant, string> = {
  primary: "",
  secondary: "vy-icon-button--secondary",
  outline: "vy-icon-button--outline",
  ghost: "vy-icon-button--ghost",
  danger: "vy-icon-button--danger"
};

export function IconButton({
  label,
  icon,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  const classes = [
    "vy-icon-button",
    variantClass[variant],
    size === "sm" ? "vy-icon-button--sm" : "",
    size === "lg" ? "vy-icon-button--lg" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="vy-button__spinner" aria-hidden="true" /> : icon}
    </button>
  );
}
