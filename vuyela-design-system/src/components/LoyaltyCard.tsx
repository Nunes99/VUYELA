export interface LoyaltyCardProps {
  businessName: string;
  points: number;
  valueMzn?: number;
  customerName: string;
  cardNumber: string;
  statusLabel?: string;
  className?: string;
}

export function LoyaltyCard({
  businessName,
  points,
  valueMzn = points,
  customerName,
  cardNumber,
  statusLabel = "Cartão digital",
  className = ""
}: LoyaltyCardProps) {
  return (
    <article
      className={["vy-loyalty-card", className].filter(Boolean).join(" ")}
      aria-label={`Cartão de fidelização ${businessName}`}
    >
      <div className="vy-loyalty-card__top">
        <span className="vy-loyalty-card__brand">{businessName}</span>
        <span className="vy-loyalty-card__status">{statusLabel}</span>
      </div>
      <div className="vy-loyalty-card__balance">
        <span className="vy-loyalty-card__label">Saldo disponível</span>
        <div className="vy-loyalty-card__points">
          {points.toLocaleString("pt-MZ")} <small>pontos</small>
        </div>
        <span className="vy-loyalty-card__value">
          Equivalente a {valueMzn.toLocaleString("pt-MZ")} MZN
        </span>
      </div>
      <div className="vy-loyalty-card__bottom">
        <span className="vy-loyalty-card__meta">
          Cliente<strong>{customerName}</strong>
        </span>
        <span className="vy-loyalty-card__meta">
          N.º do cartão<strong>{cardNumber}</strong>
        </span>
      </div>
    </article>
  );
}
