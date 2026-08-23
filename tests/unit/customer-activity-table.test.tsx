import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
  it("filters activity by movement and establishment", () => {
    render(<CustomerActivityTable activity={activity} />);

    fireEvent.click(screen.getByRole("button", { name: "Usados" }));
    expect(screen.getByText("Café Maputo")).toBeVisible();
    expect(screen.queryByText("Barbershop 21")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar atividade" }), {
      target: { value: "barber" }
    });
    expect(screen.getByText("Barbershop 21")).toBeVisible();
    expect(screen.queryByText("Café Maputo")).not.toBeInTheDocument();
  });
});
