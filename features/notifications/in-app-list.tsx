import { Bell, Check } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { markNotificationReadAction } from "./actions";
import type { CustomerNotification } from "./model";

export function InAppNotificationList({
  notifications
}: {
  notifications: CustomerNotification[];
}) {
  if (notifications.length === 0) {
    return (
      <div className="customer-dashboard-section-empty" role="status">
        <Bell size={22} aria-hidden="true" />
        <h3>Sem notificacoes</h3>
        <p>Novidades dos seus estabelecimentos aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="customer-notification-list">
      {notifications.map((notification) => (
        <article
          className={`customer-notification${notification.readAt ? "" : " is-unread"}`}
          key={notification.id}
        >
          <div className="customer-notification__icon" aria-hidden="true">
            <Bell size={18} />
          </div>
          <div>
            <span className="customer-dashboard-eyebrow">{notification.businessName}</span>
            <h3>{notification.subject}</h3>
            <p>{notification.body}</p>
            <time dateTime={notification.createdAt}>
              {formatNotificationDate(notification.createdAt)}
            </time>
          </div>
          {!notification.readAt ? (
            <form action={markNotificationReadAction}>
              <input name="notificationId" type="hidden" value={notification.id} />
              <Button
                aria-label={`Marcar ${notification.subject} como lida`}
                title="Marcar como lida"
                type="submit"
                variant="ghost"
                size="sm"
                leadingIcon={<Check size={17} />}
              >
                Lida
              </Button>
            </form>
          ) : (
            <span className="customer-notification__read">Lida</span>
          )}
        </article>
      ))}
    </div>
  );
}

function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
