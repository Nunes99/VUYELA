import { QRDisplay, RewardBadge } from "../../vuyela-design-system/src/components/Loyalty";
import { LoyaltyCard } from "../../vuyela-design-system/src/components/LoyaltyCard";

import type { CustomerCardsState } from "./data";

interface CustomerCardsViewProps {
  state: CustomerCardsState;
}

export function CustomerCardsView({ state }: CustomerCardsViewProps) {
  if (state.status === "error") {
    return (
      <div className="customer-cards-notice customer-cards-notice--error" role="status">
        <h2>Cartoes indisponiveis</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="customer-cards-notice" role="status">
        <h2>Ainda nao tem cartoes</h2>
        <p>
          Quando aderir a um negocio VUYELA, o cartao digital aparece aqui com pontos, equivalente
          em MZN e codigo de identificacao.
        </p>
      </div>
    );
  }

  return (
    <div className="customer-cards">
      <div className="customer-cards__header">
        <p>
          Cada cartao pertence ao negocio que o emitiu. Os pontos nao sao dinheiro e so podem ser
          usados nesse estabelecimento.
        </p>
      </div>

      <div className="customer-cards__list">
        {state.cards.map((card) => (
          <section
            className="customer-card-row"
            aria-labelledby={`customer-card-${card.id}`}
            key={card.id}
          >
            <div className="customer-card-row__main">
              <LoyaltyCard
                businessName={card.businessName}
                points={card.availablePoints}
                valueMzn={card.valueMzn}
                customerName={card.customerName}
                cardNumber={card.cardNumber}
                statusLabel={card.statusLabel}
              />
            </div>

            <div className="customer-card-row__details">
              <div>
                <span className="customer-card-row__eyebrow">Negocio</span>
                <h2 id={`customer-card-${card.id}`}>{card.businessName}</h2>
                <p>{card.expiryLabel}</p>
              </div>

              <div className="customer-card-row__facts" aria-label="Detalhes do cartao">
                <span>
                  Cliente<strong>{card.customerName}</strong>
                </span>
                <span>
                  Numero<strong>{card.cardNumber}</strong>
                </span>
                <span>
                  Nivel<strong>{card.currentTierName}</strong>
                </span>
                <span>
                  Valor<strong>{card.valueMzn.toLocaleString("pt-MZ")} MZN</strong>
                </span>
              </div>

              {card.nextTierName && card.pointsUntilNextTier !== null ? (
                <RewardBadge
                  label={`Faltam ${card.pointsUntilNextTier.toLocaleString(
                    "pt-MZ"
                  )} pontos para ${card.nextTierName}`}
                />
              ) : (
                <RewardBadge label="Nivel maximo actual" />
              )}
            </div>

            <QRDisplay
              code={card.qrCode}
              label="QR de identificacao"
              className="customer-card-row__qr"
            />
          </section>
        ))}
      </div>
    </div>
  );
}
