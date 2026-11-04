import React, { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  Card,
  GlassSurface,
  Modal,
  MotionPreferences,
  tokens
} from "@lemote/vuyela-design-system";
import jsonTokens from "../../vuyela-design-system/tokens/design-tokens.json";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.vyMotion;
  delete document.documentElement.dataset.vyTransparency;
});

describe("Fluid foundations", () => {
  it("preserves reward and destructive action colours over material effects", () => {
    render(
      <>
        <Button variant="reward" material="liquid">
          Usar YELAS
        </Button>
        <Button variant="danger" material="frosted">
          Remover
        </Button>
      </>
    );
    expect(screen.getByRole("button", { name: "Usar YELAS" })).not.toHaveAttribute("data-material");
    expect(screen.getByRole("button", { name: "Remover" })).not.toHaveAttribute("data-material");
  });
  it("keeps legacy consumers opt-in and supports semantic surfaces and refs", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <Card data-testid="legacy">Conteúdo</Card>
        <GlassSurface as="article" ref={ref} aria-label="Benefícios">
          Benefícios
        </GlassSurface>
      </>
    );
    expect(screen.getByTestId("legacy")).not.toHaveAttribute("data-material");
    expect(screen.getByRole("article", { name: "Benefícios" })).toHaveAttribute(
      "data-material",
      "solid"
    );
    expect(ref.current).toBe(screen.getByRole("article"));
  });

  it("retains disabled and loading semantics with liquid material", () => {
    const onClick = vi.fn();
    render(
      <Button material="liquid" loading onClick={onClick}>
        Guardar
      </Button>
    );
    const button = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("restores only validated local preferences and persists reductions", async () => {
    localStorage.setItem(
      "vuyela-visual-preferences-v1",
      JSON.stringify({ motion: "reduce", transparency: "invalid" })
    );
    render(<MotionPreferences />);
    await waitFor(() =>
      expect(document.documentElement).toHaveAttribute("data-vy-motion", "reduce")
    );
    expect(document.documentElement).toHaveAttribute("data-vy-transparency", "system");
    fireEvent.change(screen.getByLabelText("Transparência"), { target: { value: "reduce" } });
    expect(document.documentElement).toHaveAttribute("data-vy-transparency", "reduce");
    expect(JSON.parse(localStorage.getItem("vuyela-visual-preferences-v1") ?? "{}")).toEqual({
      motion: "reduce",
      transparency: "reduce"
    });
  });

  it("tolerates unavailable storage", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    render(<MotionPreferences />);
    expect(screen.getByLabelText("Movimento")).toHaveValue("system");
    spy.mockRestore();
  });

  it("contains keyboard focus and restores the trigger on close", async () => {
    const close = vi.fn();
    const { rerender } = render(<button>Origem</button>);
    const trigger = screen.getByRole("button");
    trigger.focus();
    rerender(
      <>
        <button>Origem</button>
        <Modal open title="Rever" material="frosted" onClose={close}>
          <button>Último</button>
        </Modal>
      </>
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveFocus());
    const last = screen.getByRole("button", { name: "Último" });
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
    rerender(<button>Origem</button>);
    expect(trigger).toHaveFocus();
  });

  it("publishes consistent light/dark material tokens", () => {
    expect(tokens.glass).toEqual(jsonTokens.glass);
    expect(tokens.motion.enter).toBe(jsonTokens.motion.enter);
  });
});
