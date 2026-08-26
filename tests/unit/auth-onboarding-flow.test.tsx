import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/actions", () => ({
  requestPasswordResetAction: vi.fn(),
  requestPhoneOtpAction: vi.fn(),
  signInWithEmailAction: vi.fn(),
  signUpBusinessWithEmailAction: vi.fn(),
  signUpWithEmailAction: vi.fn(),
  submitBusinessOnboardingAction: vi.fn(),
  updateCustomerProfileAction: vi.fn(),
  updatePasswordAction: vi.fn(),
  verifyPhoneOtpAction: vi.fn()
}));

import { BusinessSignUpForm } from "@/features/auth/forms";

function completeAccessStep() {
  fireEvent.change(screen.getByLabelText(/Nome do responsável/), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText(/E-mail de acesso/), {
    target: { value: "ana@mangoshop.co.mz" }
  });
  fireEvent.change(screen.getByLabelText(/^Palavra-passe/), {
    target: { value: "Vuyela-2026" }
  });
  fireEvent.change(screen.getByLabelText(/Confirmar palavra-passe/), {
    target: { value: "Vuyela-2026" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("business onboarding navigation", () => {
  it("preserves entered data while moving forward and backward", () => {
    render(<BusinessSignUpForm />);

    completeAccessStep();

    const businessName = screen.getByLabelText(/Nome do negócio/);
    fireEvent.change(businessName, { target: { value: "MangoShop" } });
    fireEvent.change(screen.getByLabelText(/Cidade/), { target: { value: "Maputo" } });
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByRole("heading", { name: "Acesso" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByLabelText(/Nome do negócio/)).toHaveValue("MangoShop");
  });

  it("shows a review before making the final submission available", () => {
    render(<BusinessSignUpForm />);

    completeAccessStep();

    fireEvent.change(screen.getByLabelText(/Nome do negócio/), {
      target: { value: "MangoShop" }
    });
    fireEvent.change(screen.getByLabelText(/Cidade/), { target: { value: "Maputo" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Revisão" })).toBeInTheDocument();
    expect(screen.getByText("MangoShop")).toBeInTheDocument();
    expect(screen.getByText("Maputo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar conta de negócio" })).toBeEnabled();
  });
});
