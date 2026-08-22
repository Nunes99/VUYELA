import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, PointsBalance, QRDisplay, Switch } from "@lemote/vuyela-design-system";

describe("VUYELA design system components", () => {
  it("keeps a loading button disabled", () => {
    render(<Button loading>Guardar</Button>);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("shows points with the issuing business and MZN equivalent", () => {
    render(<PointsBalance businessName="Restaurante Mares" points={250} />);

    expect(screen.getByText("250 pontos")).toBeVisible();
    expect(
      screen.getByText("Equivalente a 250 MZN neste estabelecimento: Restaurante Mares")
    ).toBeVisible();
  });

  it("renders a scannable QR code and its accessible fallback text", () => {
    render(<QRDisplay code="VY-8F2K-91M" />);

    expect(screen.getByRole("img", { name: "Código QR: VY-8F2K-91M" })).toBeVisible();
    expect(screen.getByText("VY-8F2K-91M")).toBeVisible();
  });

  it("uses an accessible switch control", () => {
    render(<Switch label="Campanha ativa" defaultChecked />);

    expect(screen.getByRole("switch", { name: "Campanha ativa" })).toBeChecked();
  });
});
