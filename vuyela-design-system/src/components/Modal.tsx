import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; previous?.focus(); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="vy-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="vy-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header className="vy-modal__header"><h2 id={titleId} className="vy-modal__title">{title}</h2><button className="vy-modal__close" type="button" aria-label="Fechar" onClick={onClose}>×</button></header>
        <div>{children}</div>
        {footer ? <footer className="vy-cluster" style={{ justifyContent: "flex-end", marginTop: "var(--vy-space-6)" }}>{footer}</footer> : null}
      </div>
    </div>
  );
}
