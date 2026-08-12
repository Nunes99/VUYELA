import { useEffect, useId, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export interface PopoverProps {
  trigger: ReactNode;
  title?: string | undefined;
  children: ReactNode;
}

export function Popover({ trigger, title, children }: PopoverProps) {
  return (
    <details className="vy-popover">
      <summary>{trigger}</summary>
      <div className="vy-popover__panel">
        {title ? <strong>{title}</strong> : null}
        {children}
      </div>
    </details>
  );
}

export interface DropdownMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  tone?: "default" | "danger";
}

export interface DropdownMenuProps {
  label: string;
  items: DropdownMenuItem[];
}

export function DropdownMenu({ label, items }: DropdownMenuProps) {
  return (
    <details className="vy-dropdown">
      <summary>{label}</summary>
      <div className="vy-dropdown__menu" role="menu">
        {items.map((item) =>
          item.href ? (
            <a key={item.label} href={item.href} role="menuitem" data-tone={item.tone}>
              {item.label}
            </a>
          ) : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              data-tone={item.tone}
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </details>
  );
}

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ open, title, onClose, children, footer, side = "right" }: DrawerProps) {
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => drawerRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="vy-drawer-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={drawerRef}
        className={["vy-drawer", `vy-drawer--${side}`].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="vy-drawer__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            x
          </button>
        </header>
        <div className="vy-drawer__body">{children}</div>
        {footer ? <footer className="vy-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  defaultValue?: string | undefined;
}

export function Tabs({ tabs, defaultValue, className = "", ...props }: TabsProps) {
  const generatedId = useId();
  const firstValue = tabs[0]?.value;
  const [activeValue, setActiveValue] = useState(defaultValue ?? firstValue);
  const activeTab = tabs.find((tab) => tab.value === activeValue) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <div className={["vy-tabs", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-tabs__list" role="tablist">
        {tabs.map((tab) => {
          const selected = tab.value === activeTab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${generatedId}-${tab.value}-tab`}
              aria-selected={selected}
              aria-controls={`${generatedId}-${tab.value}-panel`}
              onClick={() => setActiveValue(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="vy-tabs__panel"
        role="tabpanel"
        id={`${generatedId}-${activeTab.value}-panel`}
        aria-labelledby={`${generatedId}-${activeTab.value}-tab`}
      >
        {activeTab.content}
      </div>
    </div>
  );
}

export interface AccordionItem {
  title: string;
  content: ReactNode;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
}

export function Accordion({ items, className = "", ...props }: AccordionProps) {
  return (
    <div className={["vy-accordion", className].filter(Boolean).join(" ")} {...props}>
      {items.map((item) => (
        <details key={item.title}>
          <summary>{item.title}</summary>
          <div>{item.content}</div>
        </details>
      ))}
    </div>
  );
}
