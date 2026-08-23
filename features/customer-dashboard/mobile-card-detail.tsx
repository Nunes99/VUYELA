"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, MoreVertical, QrCode, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import type { DigitalCustomerCard } from "@/features/customer-cards/model";

import type { CustomerActivityItem } from "./model";

export function CustomerMobileCardDetail({
  activity,
  card
}: {
  activity: CustomerActivityItem[];
  card: DigitalCustomerCard;
}) {
  const [showQr, setShowQr] = useState(false);
  const rewardTarget = Math.max(5000, Math.ceil(card.availablePoints / 1000) * 1000);
  const progress = Math.min(100, (card.availablePoints / rewardTarget) * 100);

  return (
    <div className="customer-mobile-card-detail">
      <header className="customer-mobile-header customer-mobile-header--card">
        <Link aria-label="Voltar aos cartões" href="/cliente?vista=cartoes">
          <ArrowLeft />
        </Link>
        <h2>{card.businessName}</h2>
        <button aria-label="Mais opções" disabled title="Mais opções" type="button">
          <MoreVertical />
        </button>
      </header>

      <button
        aria-label={showQr ? "Mostrar a frente do cartão" : "Mostrar o QR Code do cartão"}
        className="customer-mobile-card-face"
        data-face={showQr ? "back" : "front"}
        onClick={() => setShowQr((current) => !current)}
        type="button"
      >
        <span className="customer-mobile-card-face__pattern" aria-hidden="true" />
        <span className="customer-mobile-card-face__brand">
          <b>V</b> {showQr ? "VUYELA" : card.businessName}
        </span>
        <span className="customer-mobile-card-face__tier">{card.currentTierName}</span>
        {showQr ? (
          <span className="customer-mobile-card-face__back-meta">
            <small>Número</small>
            <strong>{card.cardNumber}</strong>
          </span>
        ) : (
          <>
            <span className="customer-mobile-card-face__balance">
              <small>Saldo disponível</small>
              <strong>{card.availablePoints.toLocaleString("pt-MZ")} Pts</strong>
              <b>Equivale a {card.valueMzn.toLocaleString("pt-MZ")} MZN</b>
            </span>
            <span className="customer-mobile-card-face__customer">
              <small>{card.customerName}</small>
              <strong>{card.cardNumber}</strong>
            </span>
          </>
        )}
      </button>

      {showQr ? (
        <>
          <section className="customer-mobile-qr-panel" aria-label="QR Code de identificação">
            <h3>QR Code de identificação</h3>
            <QRCodeSVG
              aria-label={`QR de identificação: ${card.cardNumber}`}
              bgColor="#ffffff"
              fgColor="#0f2832"
              level="M"
              marginSize={1}
              role="img"
              size={180}
              value={card.qrCode}
            />
            <strong>{card.cardNumber}</strong>
          </section>
          <button
            className="customer-mobile-card-turn"
            onClick={() => setShowQr(false)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" /> Toque para voltar à frente
          </button>
        </>
      ) : (
        <>
          <section className="customer-mobile-reward">
            <header>
              <h3>Próxima Recompensa</h3>
              <strong>
                {card.availablePoints.toLocaleString("pt-MZ")} /{" "}
                {rewardTarget.toLocaleString("pt-MZ")} Pts
              </strong>
            </header>
            <span>
              <i style={{ width: `${progress}%` }} />
            </span>
            <p>
              Faltam {(rewardTarget - card.availablePoints).toLocaleString("pt-MZ")} pontos para
              resgatar a próxima recompensa.
            </p>
          </section>
          <div className="customer-mobile-card-actions">
            <button onClick={() => setShowQr(true)} type="button">
              <QrCode /> Ver QR Code
            </button>
            <Link href="/cliente?vista=atividade">
              <Search /> Histórico
            </Link>
            <button disabled type="button">
              <LockKeyhole /> Bloquear
            </button>
          </div>
          <section className="customer-mobile-card-activity">
            <h3>Transações Recentes</h3>
            {activity.slice(0, 3).map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <small>{formatDate(item.occurredAt)}</small>
                </div>
                <b className={`is-${item.tone}`}>
                  {item.points > 0 ? "+" : ""}
                  {item.points.toLocaleString("pt-MZ")} Pts
                </b>
              </article>
            ))}
            {activity.length === 0 ? <p>Sem transações recentes neste cartão.</p> : null}
          </section>
        </>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
