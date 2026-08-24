import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqExplorer, type MarketingFaqItem } from "@/features/marketing/faq-explorer";
import { PricingSelector } from "@/features/marketing/pricing-selector";
import type { SubscriptionPlan } from "@/features/subscriptions/model";

const plans: SubscriptionPlan[] = [
  {
    analyticsLevel: "standard",
    branchLimit: 5,
    campaignLimit: 20,
    description: "Para negócios em crescimento.",
    featureFlags: ["loyalty", "pos"],
    id: "growth-plan",
    monthlyPriceMznMinor: 350000,
    name: "Crescimento",
    slug: "crescimento",
    staffLimit: 25,
    trialDays: 30
  }
];

const faqs: MarketingFaqItem[] = [
  {
    answer: "Os pontos não representam dinheiro.",
    category: "Geral",
    question: "Os pontos podem ser levantados?"
  },
  {
    answer: "O POS aceita QR, cartão ou telefone.",
    category: "Técnico",
    question: "Como identificar o cliente?"
  }
];

describe("NEW PHAS public interactions", () => {
  it("switches the pricing presentation without changing the database plan", () => {
    render(<PricingSelector plans={plans} />);

    expect(screen.getByText("3.500 MZN")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Anual/i }));
    expect(screen.getByText("2.975 MZN")).toBeInTheDocument();
  });

  it("searches and filters help content", () => {
    render(<FaqExplorer items={faqs} />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "QR" } });
    expect(screen.getByText("Como identificar o cliente?")).toBeInTheDocument();
    expect(screen.queryByText("Os pontos podem ser levantados?")).not.toBeInTheDocument();
  });
});
