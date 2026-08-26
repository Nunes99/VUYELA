import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/actions", () => ({
  requestPasswordResetAction: vi.fn(),
  requestPhoneOtpAction: vi.fn(),
  signInWithEmailAction: vi.fn(),
  signUpWithEmailAction: vi.fn(),
  submitBusinessOnboardingAction: vi.fn(),
  updateCustomerProfileAction: vi.fn(),
  updatePasswordAction: vi.fn(),
  verifyPhoneOtpAction: vi.fn()
}));

import { BusinessOnboardingForm } from "@/features/auth/forms";

describe("business onboarding navigation", () => {
  it("preserves entered data while moving forward and backward", () => {
    render(<BusinessOnboardingForm />);

    const businessName = screen.getByLabelText(/Nome do negócio/);
    fireEvent.change(businessName, { target: { value: "MangoShop" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Local e contactos" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Cidade/), { target: { value: "Maputo" } });
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByRole("heading", { name: "Identificação" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do negócio/)).toHaveValue("MangoShop");
  });

  it("shows a review before making the final submission available", () => {
    render(<BusinessOnboardingForm />);

    fireEvent.change(screen.getByLabelText(/Nome do negócio/), {
      target: { value: "MangoShop" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByLabelText(/Cidade/), { target: { value: "Maputo" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Revisão" })).toBeInTheDocument();
    expect(screen.getByText("MangoShop")).toBeInTheDocument();
    expect(screen.getByText("Maputo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar para validação" })).toBeEnabled();
  });
});
