import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import type { SurfaceMaterial } from "./GlassSurface";

export interface ModalProps {
  material?: SurfaceMaterial;
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer, material }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
          ) ?? []
        ).filter(
          (control) =>
            control.tabIndex >= 0 &&
            !control.closest('[hidden], [inert], [aria-hidden="true"]') &&
            getComputedStyle(control).display !== "none" &&
            getComputedStyle(control).visibility !== "hidden"
        );
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === dialogRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === dialogRef.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="vy-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="vy-modal"
        data-material={material}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="vy-modal__header">
          <h2 id={titleId} className="vy-modal__title">
            {title}
          </h2>
          <button className="vy-modal__close" type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <div>{children}</div>
        {footer ? (
          <footer
            className="vy-cluster"
            style={{ justifyContent: "flex-end", marginTop: "var(--vy-space-6)" }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
