"use client";

import { CreditCard, RefreshCw, ShieldCheck, Trash2, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { QRDisplay } from "../../vuyela-design-system/src/components/Loyalty";

import { clearOfflineCards, readOfflineCards } from "./offline-card-store";
import type { OfflineCardPayload } from "./model";

type OfflineState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; payload: OfflineCardPayload | null };

export function OfflineCardList() {
  const [state, setState] = useState<OfflineState>({ status: "loading" });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    void readOfflineCards()
      .then((payload) => setState({ status: "ready", payload }))
      .catch(() => setState({ status: "error" }));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function removeLocalData() {
    try {
      await clearOfflineCards();
      setState({ status: "ready", payload: null });
    } catch {
      setState({ status: "error" });
    }
  }

  const cards = state.status === "ready" ? (state.payload?.cards ?? []) : [];

  return (
    <>
      <section className={`offline-status${online ? " offline-status--online" : ""}`}>
        {online ? <Wifi aria-hidden="true" size={20} /> : <WifiOff aria-hidden="true" size={20} />}
        <div>
          <strong>{online ? "Ligação disponível" : "Sem ligação a internet"}</strong>
          <p>
            {online
              ? "Pode voltar ao painel para atualizar os dados e utilizar as funcionalidades online."
              : "As identificações guardadas neste dispositivo continuam disponíveis."}
          </p>
        </div>
        {online ? (
          <Link className="offline-action" href="/cliente">
            <RefreshCw aria-hidden="true" size={17} />
            Atualizar
          </Link>
        ) : null}
      </section>

      <section className="offline-security" aria-label="Limite de segurança offline">
        <ShieldCheck aria-hidden="true" size={20} />
        <p>
          Estes QR servem apenas para identificar o cartão. Consultar saldo ou usar pontos requer
          ligação e validação no servidor.
        </p>
      </section>

      {state.status === "loading" ? (
        <div className="offline-empty" role="status">
          <RefreshCw aria-hidden="true" className="offline-loading-icon" size={24} />
          <p>A carregar identificações guardadas...</p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="offline-empty offline-empty--error" role="alert">
          <p>Não foi possível ler os cartões guardados neste dispositivo.</p>
        </div>
      ) : null}

      {state.status === "ready" && cards.length === 0 ? (
        <div className="offline-empty" role="status">
          <CreditCard aria-hidden="true" size={28} />
          <h2>Nenhum cartão guardado</h2>
          <p>Abra o painel do cliente com internet para guardar as identificações ativas.</p>
        </div>
      ) : null}

      {cards.length > 0 ? (
        <section aria-labelledby="offline-card-list-title">
          <div className="offline-section-heading">
            <div>
              <span>Identificacao local</span>
              <h2 id="offline-card-list-title">Os seus cartões</h2>
              <p>
                Atualizado{" "}
                {formatOfflineDate(state.status === "ready" ? state.payload?.updatedAt : null)}
              </p>
            </div>
            <button className="offline-clear" onClick={removeLocalData} type="button">
              <Trash2 aria-hidden="true" size={17} />
              Remover deste dispositivo
            </button>
          </div>
          <div className="offline-card-grid">
            {cards.map((card) => (
              <article className="offline-card" key={card.id}>
                <div>
                  <span>Cartão VUYELA</span>
                  <h3>{card.businessName}</h3>
                  <p>{card.cardNumber}</p>
                </div>
                <QRDisplay code={card.qrCode} label="QR de identificacao" />
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function formatOfflineDate(value: string | null | undefined): string {
  if (!value) {
    return "recentemente";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recentemente";
  }

  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
