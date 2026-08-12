import type { HTMLAttributes, ReactNode } from "react";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  icon?: ReactNode;
}

export function Chip({ selected = false, icon, className = "", children, ...props }: ChipProps) {
  return (
    <span
      className={["vy-chip", selected ? "vy-chip--selected" : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={selected || undefined}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string | undefined;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, src, size = "md", className = "", style, ...props }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={["vy-avatar", `vy-avatar--${size}`, className].filter(Boolean).join(" ")}
      aria-label={name}
      style={{ ...style, ...(src ? { backgroundImage: `url(${src})` } : {}) }}
      {...props}
    >
      {src ? null : initials}
    </span>
  );
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="vy-tooltip">
      {children}
      <span className="vy-tooltip__content" role="tooltip">
        {content}
      </span>
    </span>
  );
}
