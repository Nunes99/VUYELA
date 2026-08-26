"use client";

import Link from "next/link";
import { Activity, ArrowLeft, Gift, MoreVertical, RefreshCw } from "lucide-react";
import { useState } from "react";

import {
  CustomerCardVisual,
  type CustomerCardFace
} from "@/features/customer-cards/customer-card-visual";
import type { DigitalCustomerCard } from "@/features/customer-cards/model";

import type { CustomerActivityItem } from "./model";

export function CustomerMobileCardDetail({
  activity,
  card
}: {
  activity: CustomerActivityItem[];
  card: DigitalCustomerCard;
}) {
  const [face, setFace] = useState<CustomerCardFace>("front");
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

      <CustomerCardVisual card={card} face={face} onFaceChange={setFace} />

      <section className="customer-mobile-reward">
        <header>
          <h3>Próxima Recompensa</h3>
          <strong>
            {card.availablePoints.toLocaleString("pt-MZ")} / {rewardTarget.toLocaleString("pt-MZ")}{" "}
            YL
          </strong>
        </header>
        <span>
          <i style={{ width: `${progress}%` }} />
        </span>
        <p>
          Faltam {(rewardTarget - card.availablePoints).toLocaleString("pt-MZ")} YELAS para resgatar
          a próxima recompensa.
        </p>
      </section>

      <nav className="customer-mobile-card-actions" aria-label="Ações do cartão">
        <button onClick={() => setFace(face === "front" ? "back" : "front")} type="button">
          <RefreshCw /> {face === "front" ? "Ver Verso" : "Ver Frente"}
        </button>
        <Link href="/cliente?vista=atividade">
          <Activity /> Histórico
        </Link>
        <Link href="/cliente?vista=ofertas">
          <Gift /> Ofertas
        </Link>
      </nav>

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
              {item.points.toLocaleString("pt-MZ")} YL
            </b>
          </article>
        ))}
        {activity.length === 0 ? <p>Sem transações recentes neste cartão.</p> : null}
      </section>
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
