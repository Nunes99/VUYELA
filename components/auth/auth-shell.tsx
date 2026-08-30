import type { ReactNode } from "react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";

interface AuthShellProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  formDescription: string;
  formTitle: string;
  homeHref?: string;
  id: string;
  title: string;
  variant?: "customer" | "business" | "pos" | "admin";
  compact?: boolean;
  securityNote?: string;
}

export function AuthShell({
  children,
  description,
  eyebrow,
  formDescription,
  formTitle,
  homeHref = "/",
  id,
  title,
  variant = "customer",
  compact = false,
  securityNote
}: AuthShellProps) {
  return (
    <main className={`auth-page auth-page--${variant}`}>
      <section
        className={`auth-shell${compact ? " auth-shell--compact" : ""}`}
        aria-labelledby={id}
      >
        <div className="auth-panel auth-panel--copy">
          <VuyelaLogo className="auth-brand" href={homeHref} inverse />
          <div className="auth-copy-content">
            <span className="auth-kicker">{eyebrow}</span>
            <h1 id={id}>{title}</h1>
            <p>{description}</p>
          </div>
          {securityNote || variant === "business" ? (
            <small className="auth-security-note">
              <span aria-hidden="true" />
              {securityNote ?? "Sessão segura e encriptada de ponta a ponta."}
            </small>
          ) : null}
        </div>

        <div className="auth-panel auth-panel--forms">
          <header className="auth-form-header">
            <h2>{formTitle}</h2>
            <p>{formDescription}</p>
          </header>
          <div className="auth-form-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
