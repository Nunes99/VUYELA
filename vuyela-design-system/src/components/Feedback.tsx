import type { HTMLAttributes, ReactNode } from "react";

export type FeedbackTone = "info" | "success" | "warning" | "danger";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  title: string;
  icon?: ReactNode;
}

export function Alert({
  tone = "info",
  title,
  icon,
  className = "",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={["vy-alert", `vy-alert--${tone}`, className].filter(Boolean).join(" ")}
      role="status"
      {...props}
    >
      {icon ? <span className="vy-alert__icon">{icon}</span> : null}
      <div>
        <strong>{title}</strong>
        {children ? <div className="vy-alert__body">{children}</div> : null}
      </div>
    </div>
  );
}

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: FeedbackTone;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
}

export function Toast({
  tone = "info",
  title,
  description,
  action,
  className = "",
  ...props
}: ToastProps) {
  return (
    <div
      className={["vy-toast", `vy-toast--${tone}`, className].filter(Boolean).join(" ")}
      role="status"
      {...props}
    >
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="vy-toast__action">{action}</div> : null}
    </div>
  );
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div className={["vy-empty-state", className].filter(Boolean).join(" ")} {...props}>
      {icon ? <span className="vy-empty-state__icon">{icon}</span> : null}
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  label?: string;
}

export function Skeleton({
  width,
  height,
  label = "A carregar",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={["vy-skeleton", className].filter(Boolean).join(" ")}
      aria-label={label}
      role="status"
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
