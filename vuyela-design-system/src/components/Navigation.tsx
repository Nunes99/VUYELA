import type { HTMLAttributes, ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: ReactNode;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items, className = "", ...props }: BreadcrumbProps) {
  return (
    <nav
      className={["vy-breadcrumb", className].filter(Boolean).join(" ")}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  links: NavItem[];
  actions?: ReactNode;
}

export function Navbar({ brand, links, actions, className = "", ...props }: NavbarProps) {
  return (
    <header className={["vy-navbar", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-navbar__brand">{brand}</div>
      <nav className="vy-navbar__links" aria-label="Navegacao principal">
        {links.map((link) => (
          <a key={link.href} href={link.href} aria-current={link.active ? "page" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
      {actions ? <div className="vy-navbar__actions">{actions}</div> : null}
    </header>
  );
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  title: string;
  items: NavItem[];
  footer?: ReactNode;
}

export function Sidebar({ title, items, footer, className = "", ...props }: SidebarProps) {
  return (
    <aside className={["vy-sidebar", className].filter(Boolean).join(" ")} {...props}>
      <strong>{title}</strong>
      <nav aria-label={title}>
        {items.map((item) => (
          <a key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
      {footer ? <div className="vy-sidebar__footer">{footer}</div> : null}
    </aside>
  );
}

export interface BottomNavigationProps extends HTMLAttributes<HTMLElement> {
  items: NavItem[];
}

export function BottomNavigation({ items, className = "", ...props }: BottomNavigationProps) {
  return (
    <nav
      className={["vy-bottom-nav", className].filter(Boolean).join(" ")}
      aria-label="Navegacao inferior"
      {...props}
    >
      {items.map((item) => (
        <a key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
          {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
