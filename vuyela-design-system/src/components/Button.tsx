import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "reward" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "",
  reward: "vy-button--reward",
  secondary: "vy-button--secondary",
  outline: "vy-button--outline",
  ghost: "vy-button--ghost",
  danger: "vy-button--danger",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "vy-button",
    variantClass[variant],
    size === "sm" ? "vy-button--sm" : "",
    size === "lg" ? "vy-button--lg" : "",
    fullWidth ? "vy-button--block" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <span className="vy-button__spinner" aria-hidden="true" /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
}
