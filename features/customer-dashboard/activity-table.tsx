import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import React from "react";

import type {
  CustomerActivityFilters,
  CustomerActivityItem,
  CustomerActivityMovement,
  CustomerPagination
} from "./model";

export function CustomerActivityTable({
  activity,
  filters,
  pagination
}: {
  activity: CustomerActivityItem[];
  filters: CustomerActivityFilters;
  pagination: CustomerPagination;
}) {
  return (
    <div className="customer-activity-panel">
      <form action="/cliente" className="customer-activity-toolbar" method="get">
        <input name="vista" type="hidden" value="atividade" />
        <label className="customer-activity-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Pesquisar atividade</span>
          <input
            defaultValue={filters.query}
            name="q"
            placeholder="Pesquisar estabelecimento..."
            type="search"
          />
        </label>
        <label className="customer-activity-period">
          <span className="sr-only">Período</span>
          <select defaultValue={filters.period} name="periodo">
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </label>
        <input name="movimento" type="hidden" value={filters.movement} />
        <button className="customer-activity-submit" type="submit">
          Aplicar filtros
        </button>
      </form>

      <div className="customer-activity-filters" aria-label="Filtrar atividade">
        <MovementLink filters={filters} label="Todos" movement="all" />
        <MovementLink filters={filters} label="Ganhos" movement="earn" />
        <MovementLink filters={filters} label="Usados" movement="redeem" />
      </div>

      {activity.length > 0 ? (
        <>
          <div className="customer-activity-result-summary" role="status">
            {formatResultRange(pagination)} movimentos encontrados
          </div>
          <div className="customer-activity-table-wrap">
            <table className="customer-activity-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Estabelecimento</th>
                  <th>Movimento</th>
                  <th>Cartão vinculado</th>
                  <th>YELAS</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => (
                  <tr key={item.id}>
                    <td>{formatActivityDate(item.occurredAt)}</td>
                    <td>
                      <strong>{item.businessName}</strong>
                      <small>{item.description}</small>
                    </td>
                    <td>{item.tone === "redeem" ? "Utilização de YELAS" : "Compra realizada"}</td>
                    <td>{item.cardName ?? "Cartão VUYELA"}</td>
                    <td className={`is-${item.tone}`}>
                      {item.points > 0 ? "+" : ""}
                      {item.points.toLocaleString("pt-MZ")} YL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ActivityPagination filters={filters} pagination={pagination} />
        </>
      ) : (
        <div
          className={[
            "customer-dashboard-section-empty",
            "customer-dashboard-section-empty--compact"
          ].join(" ")}
        >
          <h3>Nenhum movimento encontrado</h3>
          <p>Altere a pesquisa ou os filtros para consultar outros movimentos.</p>
        </div>
      )}
    </div>
  );
}

function MovementLink({
  filters,
  label,
  movement
}: {
  filters: CustomerActivityFilters;
  label: string;
  movement: CustomerActivityMovement;
}) {
  return (
    <Link
      aria-current={filters.movement === movement ? "page" : undefined}
      className={filters.movement === movement ? "is-active" : undefined}
      href={buildActivityHref(filters, movement, 1)}
    >
      {label}
    </Link>
  );
}

function ActivityPagination({
  filters,
  pagination
}: {
  filters: CustomerActivityFilters;
  pagination: CustomerPagination;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="customer-pagination" aria-label="Páginas do histórico">
      {pagination.page > 1 ? (
        <Link href={buildActivityHref(filters, filters.movement, pagination.page - 1)}>
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
        <Link href={buildActivityHref(filters, filters.movement, pagination.page + 1)}>
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

function buildActivityHref(
  filters: CustomerActivityFilters,
  movement: CustomerActivityMovement,
  page: number
): string {
  const params = new URLSearchParams({
    vista: "atividade",
    movimento: movement,
    periodo: filters.period
  });
  if (filters.query) params.set("q", filters.query);
  if (page > 1) params.set("pagina", String(page));
  return `/cliente?${params.toString()}`;
}

function formatResultRange(pagination: CustomerPagination): string {
  if (pagination.total === 0) return "0 de 0";
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(start + pagination.pageSize - 1, pagination.total);
  return `${start.toLocaleString("pt-MZ")}-${end.toLocaleString("pt-MZ")} de ${pagination.total.toLocaleString("pt-MZ")}`;
}

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
