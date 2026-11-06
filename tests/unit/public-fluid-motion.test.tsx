import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MotionPreferences, VisualPreferencesProvider } from "@lemote/vuyela-design-system";
import { BusinessDashboardDemo } from "@/features/marketing/business-dashboard-demo";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.vyMotion;
  delete document.documentElement.dataset.vyTransparency;
});

it("responds to OS motion changes without disabling deliberate demo navigation", () => {
  vi.useFakeTimers();
  let reduced = false;
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener)
    })
  });
  render(
    <VisualPreferencesProvider>
      <MotionPreferences />
      <BusinessDashboardDemo />
    </VisualPreferencesProvider>
  );
  expect(screen.getByText("Demonstração · dados ilustrativos")).toBeVisible();
  act(() => vi.advanceTimersByTime(4700));
  expect(screen.getByText("Taxa de retorno")).toBeVisible();
  act(() => {
    reduced = true;
    listeners.forEach((listener) => listener());
  });
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByText("Taxa de retorno")).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Campanhas" }));
  expect(screen.getByText("Taxa de conversão")).toBeVisible();
  act(() => {
    reduced = false;
    listeners.forEach((listener) => listener());
  });
  act(() => vi.advanceTimersByTime(4700));
  expect(screen.getByText("Clientes que voltaram")).toBeVisible();
});
