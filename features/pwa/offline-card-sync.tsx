"use client";

import { useEffect } from "react";

import type { DigitalCustomerCard } from "@/features/customer-cards/model";

import { saveOfflineCards } from "./offline-card-store";

export function OfflineCardSync({ cards }: { cards: DigitalCustomerCard[] }) {
  useEffect(() => {
    if (!("indexedDB" in window)) {
      return;
    }

    const activeCards = cards
      .filter((card) => card.status === "active")
      .map((card) => ({
        id: card.id,
        businessId: card.businessId,
        businessName: card.businessName,
        cardNumber: card.cardNumber,
        qrCode: card.qrCode
      }));

    void saveOfflineCards(activeCards).catch(() => {
      // Offline storage is optional and must never interrupt the authenticated dashboard.
    });
  }, [cards]);

  return null;
}
