import { QRDisplay, RewardBadge } from "../../vuyela-design-system/src/components/Loyalty";

import type { CustomerCardsState } from "./data";
import { CustomerCardVisual } from "./customer-card-visual";
import { formatCustomerCardValueMzn } from "./model";

interface CustomerCardsViewProps {
  state: CustomerCardsState;
}

export function CustomerCardsView({ state }: CustomerCardsViewProps) {
  if (state.status === "error") {
    return (
      <div className="customer-cards-notice customer-cards-notice--error" role="status">
        <h2>Cartões indisponíveis</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="customer-cards-notice" role="status">
        <h2>Ainda não tem cartões</h2>
        <p>
          Quando aderir a um negócio VUYELA, o cartão digital aparece aqui com YELAS, equivalente em
          MZN e código de identificação.
        </p>
      </div>
    );
  }

  return (
    <div className="customer-cards">
      <div className="customer-cards__header">
        <p>
          Cada cartão pertence ao negócio que o emitiu. As YELAS não são dinheiro e só podem ser
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
              <CustomerCardVisual card={card} />
            </div>

            <div className="customer-card-row__details">
              <div>
                <span className="customer-card-row__eyebrow">Negócio</span>
                <h2 id={`customer-card-${card.id}`}>{card.businessName}</h2>
                <p>{card.expiryLabel}</p>
              </div>

              <div className="customer-card-row__facts" aria-label="Detalhes do cartão">
                <span>
                  Cliente<strong>{card.customerName}</strong>
                </span>
                <span>
                  Número<strong>{card.cardNumber}</strong>
                </span>
                <span>
                  Nível<strong>{card.currentTierName}</strong>
                </span>
                <span>
                  Valor<strong>{formatCustomerCardValueMzn(card.valueMzn)}</strong>
                </span>
              </div>

              {card.nextTierName && card.pointsUntilNextTier !== null ? (
                <RewardBadge
                  label={`Faltam ${card.pointsUntilNextTier.toLocaleString(
                    "pt-MZ"
                  )} YELAS para ${card.nextTierName}`}
                />
              ) : (
                <RewardBadge label="Nível máximo atual" />
              )}
            </div>

            <QRDisplay
              code={card.qrCode}
              label="QR de identificação"
              className="customer-card-row__qr"
            />
          </section>
        ))}
      </div>
    </div>
  );
}
