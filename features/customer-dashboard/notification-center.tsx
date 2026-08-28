import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { InAppNotificationList } from "@/features/notifications/in-app-list";
import { markAllNotificationsReadAction } from "@/features/notifications/actions";

import type { CustomerNotificationCategory, CustomerPagination } from "./model";
import type { CustomerNotification } from "@/features/notifications/model";

const categories: Array<{ id: CustomerNotificationCategory; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "offers", label: "Ofertas" },
  { id: "transactions", label: "Transações" },
  { id: "system", label: "Sistema" }
];

export function CustomerNotificationCenter({
  category,
  notifications,
  pagination,
  unreadCount
}: {
  category: CustomerNotificationCategory;
  notifications: CustomerNotification[];
  pagination: CustomerPagination;
  unreadCount: number;
}) {
  return (
    <div className="customer-notifications-panel">
      <div className="customer-notifications-panel__heading">
        <div>
          <h3>Últimas notificações</h3>
          <span>{unreadCount.toLocaleString("pt-MZ")} por ler</span>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button className="customer-notifications-read-all" type="submit">
              <Check aria-hidden="true" size={16} /> Marcar todas como lidas
            </button>
          </form>
        ) : null}
      </div>
      <nav className="customer-notification-filters" aria-label="Categorias de notificações">
        {categories.map((item) => (
          <Link
            aria-current={category === item.id ? "page" : undefined}
            className={category === item.id ? "is-active" : undefined}
            href={buildNotificationHref(item.id, 1)}
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <InAppNotificationList notifications={notifications} />
      <NotificationPagination category={category} pagination={pagination} />
    </div>
  );
}

function NotificationPagination({
  category,
  pagination
}: {
  category: CustomerNotificationCategory;
  pagination: CustomerPagination;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="customer-pagination" aria-label="Páginas das notificações">
      {pagination.page > 1 ? (
        <Link href={buildNotificationHref(category, pagination.page - 1)}>
          <ChevronLeft aria-hidden="true" size={17} /> Anterior
        </Link>
      ) : (
        <span aria-disabled="true">
          <ChevronLeft aria-hidden="true" size={17} /> Anterior
        </span>
      )}
      <strong>
        Página {pagination.page.toLocaleString("pt-MZ")} de{" "}
        {pagination.totalPages.toLocaleString("pt-MZ")}
      </strong>
      {pagination.page < pagination.totalPages ? (
        <Link href={buildNotificationHref(category, pagination.page + 1)}>
          Seguinte <ChevronRight aria-hidden="true" size={17} />
        </Link>
      ) : (
        <span aria-disabled="true">
          Seguinte <ChevronRight aria-hidden="true" size={17} />
        </span>
      )}
    </nav>
  );
}

function buildNotificationHref(category: CustomerNotificationCategory, page: number): string {
  const params = new URLSearchParams({ vista: "notificacoes" });
  if (category !== "all") params.set("aviso", category);
  if (page > 1) params.set("paginaAvisos", String(page));
  return `/cliente?${params.toString()}`;
}
