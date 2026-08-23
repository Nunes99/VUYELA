"use client";

import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";

import type { DigitalCustomerCard } from "./model";

export type CustomerCardFace = "front" | "back";

interface CustomerCardVisualProps {
  card: DigitalCustomerCard;
  compact?: boolean;
  face?: CustomerCardFace;
  onFaceChange?: (face: CustomerCardFace) => void;
}

export function CustomerCardVisual({
  card,
  compact = false,
  face,
  onFaceChange
}: CustomerCardVisualProps) {
  const [internalFace, setInternalFace] = useState<CustomerCardFace>("front");
  const currentFace = face ?? internalFace;
  const isBack = currentFace === "back";
  const nextFace: CustomerCardFace = isBack ? "front" : "back";
  const actionLabel = isBack ? "Mostrar a frente do cartão" : "Mostrar o verso do cartão";

  function changeFace(): void {
    if (compact) return;
    setInternalFace(nextFace);
    onFaceChange?.(nextFace);
  }

  const faces = (
    <span className="customer-digital-card__inner">
      <span
        aria-hidden={isBack}
        aria-label={`Frente do cartão ${card.businessName}`}
        className="customer-digital-card__face customer-digital-card__face--front"
        role={isBack ? undefined : "img"}
      >
        <CardPattern />
        <CardBrand businessName={card.businessName} />
        <span className="customer-digital-card__face-label">{card.currentTierName}</span>
        <span className="customer-digital-card__balance">
          <span>Saldo disponível</span>
          <strong>
            {card.availablePoints.toLocaleString("pt-MZ")} <small>Pts</small>
          </strong>
          <b>Equivale a {card.valueMzn.toLocaleString("pt-MZ")} MZN</b>
        </span>
        <span className="customer-digital-card__customer">
          <small>{card.customerName}</small>
          <strong>{card.cardNumber}</strong>
        </span>
        <span className="customer-digital-card__front-qr">
          <QRCodeSVG
            aria-label={`QR de identificação: ${card.cardNumber}`}
            bgColor="#ffffff"
            fgColor="#022c3a"
            level="M"
            marginSize={1}
            role="img"
            size={128}
            value={card.qrCode}
          />
        </span>
      </span>

      <span
        aria-hidden={!isBack}
        aria-label={`Verso do cartão ${card.businessName}`}
        className="customer-digital-card__face customer-digital-card__face--back"
        role={isBack ? "img" : undefined}
      >
        <CardPattern />
        <CardBrand businessName="VUYELA" />
        <span className="customer-digital-card__face-label">Verso do cartão</span>
        <span className="customer-digital-card__back-content">
          <span>
            <small>Número</small>
            <strong>{card.cardNumber}</strong>
          </span>
          <span>
            <small>Cliente</small>
            <strong>{card.customerName}</strong>
          </span>
          <span>
            <small>Nível</small>
            <strong>{card.currentTierName}</strong>
          </span>
          <span>
            <small>Validade</small>
            <strong>{card.expiryLabel}</strong>
          </span>
        </span>
      </span>
    </span>
  );

  return (
    <div
      className={`customer-digital-card${compact ? " customer-digital-card--compact" : ""}`}
      data-face={currentFace}
    >
      {compact ? (
        <div className="customer-digital-card__surface">{faces}</div>
      ) : (
        <button
          aria-label={actionLabel}
          className="customer-digital-card__surface"
          onClick={changeFace}
          type="button"
        >
          {faces}
        </button>
      )}
    </div>
  );
}

function CardPattern() {
  return <span className="customer-digital-card__pattern" aria-hidden="true" />;
}

function CardBrand({ businessName }: { businessName: string }) {
  return (
    <span className="customer-digital-card__brand">
      <b aria-hidden="true">V</b>
      <strong>{businessName}</strong>
    </span>
  );
}
