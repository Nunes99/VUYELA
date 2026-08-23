"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { CustomerActivityItem } from "./model";

type ActivityFilter = "all" | "earn" | "redeem";

export function CustomerActivityTable({ activity }: { activity: CustomerActivityItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const filteredActivity = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-MZ");

    return activity.filter((item) => {
      const matchesFilter = filter === "all" || item.tone === filter;
      const matchesQuery =
        !normalizedQuery ||
        item.businessName.toLocaleLowerCase("pt-MZ").includes(normalizedQuery) ||
        item.description.toLocaleLowerCase("pt-MZ").includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activity, filter, query]);

  return (
    <div className="customer-activity-panel">
      <div className="customer-activity-toolbar">
        <label className="customer-activity-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Pesquisar atividade</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar estabelecimento..."
            type="search"
            value={query}
          />
        </label>
        <div className="customer-activity-filters" aria-label="Filtrar atividade">
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")} type="button">
            Todos
          </button>
          <button aria-pressed={filter === "earn"} onClick={() => setFilter("earn")} type="button">
            Ganhos
          </button>
          <button
            aria-pressed={filter === "redeem"}
            onClick={() => setFilter("redeem")}
            type="button"
          >
            Usados
          </button>
        </div>
      </div>

      {filteredActivity.length > 0 ? (
        <div className="customer-activity-table-wrap">
          <table className="customer-activity-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Estabelecimento</th>
                <th>Movimento</th>
                <th>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivity.map((item) => (
                <tr key={item.id}>
                  <td>{formatActivityDate(item.occurredAt)}</td>
                  <td>
                    <strong>{item.businessName}</strong>
                    <small>{item.description}</small>
                  </td>
                  <td>{item.tone === "redeem" ? "Utilização de pontos" : "Compra realizada"}</td>
                  <td className={`is-${item.tone}`}>
                    {item.points > 0 ? "+" : ""}
                    {item.points.toLocaleString("pt-MZ")} Pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={[
            "customer-dashboard-section-empty",
            "customer-dashboard-section-empty--compact"
          ].join(" ")}
        >
          <h3>Nenhum movimento encontrado</h3>
          <p>Altere a pesquisa ou o filtro para ver outros resultados.</p>
        </div>
      )}
    </div>
  );
}

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
