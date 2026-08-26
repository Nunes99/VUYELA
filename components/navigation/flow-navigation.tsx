import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface FlowBreadcrumbItem {
  label: string;
  href?: string;
}

export function FlowBreadcrumbs({
  items,
  className = ""
}: {
  items: FlowBreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Localização na plataforma"
      className={`flow-breadcrumbs${className ? ` ${className}` : ""}`}
    >
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 ? <ChevronRight aria-hidden="true" size={14} /> : null}
              {item.href && !current ? (
                <Link href={item.href}>
                  {index === 0 ? <Home aria-hidden="true" size={14} /> : null}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function FlowBackLink({
  href,
  label,
  className = ""
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link className={`flow-back-link${className ? ` ${className}` : ""}`} href={href}>
      <ChevronLeft aria-hidden="true" size={18} />
      <span>{label}</span>
    </Link>
  );
}
