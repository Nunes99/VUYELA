import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomerActivityTable } from "@/features/customer-dashboard/activity-table";

const activity = [
  {
    id: "earn-1",
    businessName: "Barbershop 21",
    description: "Corte de cabelo",
    points: 300,
    occurredAt: "2026-08-23T10:15:00.000Z",
    tone: "earn" as const
  },
  {
    id: "redeem-1",
    businessName: "Café Maputo",
    description: "Utilização de pontos",
    points: -80,
    occurredAt: "2026-08-22T08:15:00.000Z",
    tone: "redeem" as const
  }
];

describe("customer activity table", () => {
  it("keeps server-side filters and pagination in shareable links", () => {
    render(
      <CustomerActivityTable
        activity={activity}
        filters={{ movement: "all", period: "90", query: "barber" }}
        pagination={{ page: 2, pageSize: 25, total: 52, totalPages: 3 }}
      />
    );

    expect(screen.getByText("Barbershop 21")).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Pesquisar atividade" })).toHaveValue("barber");
    expect(screen.getByRole("link", { name: "Usados" })).toHaveAttribute(
      "href",
      "/cliente?vista=atividade&movimento=redeem&periodo=90&q=barber"
    );
    expect(screen.getByRole("link", { name: /Seguinte/ })).toHaveAttribute(
      "href",
      "/cliente?vista=atividade&movimento=all&periodo=90&q=barber&pagina=3"
    );
    expect(screen.getByText("26-50 de 52 movimentos encontrados")).toBeVisible();
  });
});
