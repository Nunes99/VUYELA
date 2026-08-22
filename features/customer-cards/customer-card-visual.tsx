"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw } from "lucide-react";

import type { DigitalCustomerCard } from "./model";

interface CustomerCardVisualProps {
  card: DigitalCustomerCard;
}

export function CustomerCardVisual({ card }: CustomerCardVisualProps) {
  const [showBack, setShowBack] = useState(false);
  const faceLabel = showBack ? "Mostrar a frente do cartão" : "Mostrar o verso do cartão";

  return (
    <div className="customer-digital-card" data-face={showBack ? "back" : "front"}>
      <article
        aria-label={`${showBack ? "Verso" : "Frente"} do cartão ${card.businessName}`}
        className="customer-digital-card__surface"
      >
        <div className="customer-digital-card__pattern" aria-hidden="true" />
        <div className="customer-digital-card__brand">
          <span aria-hidden="true">V</span>
          <strong>{showBack ? "VUYELA" : card.businessName}</strong>
          <small>by LEMOTE</small>
        </div>

        {showBack ? (
          <div className="customer-digital-card__back-content">
            <span className="customer-digital-card__face-label">Verso do cartão</span>
            <div className="customer-digital-card__back-qr">
              <QRCodeSVG
                aria-label={`QR de identificação: ${card.cardNumber}`}
                bgColor="#ffffff"
                fgColor="#022c3a"
                level="M"
                marginSize={1}
                role="img"
                size={176}
                value={card.qrCode}
              />
            </div>
            <strong>{card.cardNumber}</strong>
            <small>Apresente este código no estabelecimento.</small>
          </div>
        ) : (
          <>
            <span className="customer-digital-card__face-label">Cartão digital</span>
            <div className="customer-digital-card__balance">
              <span>Saldo disponível</span>
              <strong>
                {card.availablePoints.toLocaleString("pt-MZ")} <small>pontos</small>
              </strong>
              <b>Equivalente a {card.valueMzn.toLocaleString("pt-MZ")} MZN</b>
            </div>
            <span className="customer-digital-card__customer">{card.customerName}</span>
            <div className="customer-digital-card__front-qr">
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
            </div>
          </>
        )}

        <button
          aria-label={faceLabel}
          className="customer-digital-card__flip"
          onClick={() => setShowBack((current) => !current)}
          title={faceLabel}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={17} />
        </button>
      </article>
    </div>
  );
}
