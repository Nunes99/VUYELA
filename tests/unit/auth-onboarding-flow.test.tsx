import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/actions", () => ({
  requestPasswordResetAction: vi.fn(),
  requestPhoneOtpAction: vi.fn(),
  signInWithEmailAction: vi.fn(),
  signUpBusinessMemberWithEmailAction: vi.fn(),
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
  fireEvent.change(screen.getByLabelText(/Número de telefone/), {
    target: { value: "+258 84 123 4567" }
  });
  fireEvent.change(screen.getByLabelText(/^Palavra-passe/), {
    target: { value: "Vuyela-2026" }
  });
  fireEvent.change(screen.getByLabelText(/Confirmar palavra-passe/), {
    target: { value: "Vuyela-2026" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

function completeBusinessStep() {
  fireEvent.change(screen.getByLabelText(/Nome do negócio/), {
    target: { value: "MangoShop" }
  });
  fireEvent.change(screen.getByLabelText(/Tipo de negócio/), {
    target: { value: "sociedade-por-quotas" }
  });
  fireEvent.change(screen.getByLabelText(/Sector de atividade/), {
    target: { value: "comercio-retalho" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

function completeBranchStep() {
  fireEvent.change(screen.getByLabelText(/Nome da filial/), {
    target: { value: "Maputo Centro" }
  });
  fireEvent.change(screen.getByLabelText(/Província/), {
    target: { value: "Maputo Cidade" }
  });
  fireEvent.change(screen.getByLabelText(/Distrito/), { target: { value: "KaMpfumo" } });
  fireEvent.change(screen.getByLabelText(/Telefone da filial/), {
    target: { value: "+258 21 300 400" }
  });
  fireEvent.change(screen.getByLabelText(/Endereço completo/), {
    target: { value: "Avenida Mao Tse Tung, 450" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("business onboarding navigation", () => {
  it("preserves entered data while moving forward and backward", () => {
    render(<BusinessSignUpForm />);

    completeAccessStep();

    const businessName = screen.getByLabelText(/Nome do negócio/);
    fireEvent.change(businessName, { target: { value: "MangoShop" } });
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByRole("heading", { name: "Acesso" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByLabelText(/Nome do negócio/)).toHaveValue("MangoShop");
  });

  it("shows a review before making the final submission available", () => {
    render(<BusinessSignUpForm />);

    completeAccessStep();

    completeBusinessStep();
    completeBranchStep();

    expect(screen.getByRole("heading", { name: "Revisão" })).toBeInTheDocument();
    expect(screen.getByText("MangoShop")).toBeInTheDocument();
    expect(screen.getByText("Maputo Centro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submeter pedido" })).toBeEnabled();
  });
});
