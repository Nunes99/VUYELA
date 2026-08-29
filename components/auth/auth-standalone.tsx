import type { ReactNode } from "react";

import { VuyelaLogo } from "@/components/brand/vuyela-logo";

interface AuthStandaloneProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  footer?: ReactNode;
  homeHref?: string;
  id: string;
  title: string;
  variant?: "customer" | "business" | "pos" | "admin";
}

export function AuthStandalone({
  children,
  description,
  eyebrow,
  footer,
  homeHref = "/",
  id,
  title,
  variant = "customer"
}: AuthStandaloneProps) {
  return (
    <main className={`auth-page auth-page--${variant}`}>
      <section className="auth-shell auth-shell--single auth-standalone" aria-labelledby={id}>
        <div className="auth-panel auth-panel--forms">
          <VuyelaLogo className="auth-brand auth-brand--dark" href={homeHref} />
          <header className="auth-standalone__header">
            <span className="auth-kicker">{eyebrow}</span>
            <h1 id={id}>{title}</h1>
            <p className="auth-intro">{description}</p>
          </header>
          <div className="auth-standalone__content">{children}</div>
          {footer ? <footer className="auth-standalone__footer">{footer}</footer> : null}
        </div>
      </section>
    </main>
  );
}
