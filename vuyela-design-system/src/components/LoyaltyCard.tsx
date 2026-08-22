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
        <span className="vy-loyalty-card__brand">
          <strong>{businessName}</strong>
          <small>Rewards</small>
        </span>
        <span className="vy-loyalty-card__status" title={statusLabel}>
          {businessName.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="vy-loyalty-card__balance">
        <div className="vy-loyalty-card__points">
          {points.toLocaleString("pt-MZ")} <small>pontos</small>
        </div>
        <span className="vy-loyalty-card__value">
          Equivalente a {valueMzn.toLocaleString("pt-MZ")} MZN
        </span>
      </div>
      <div className="vy-loyalty-card__bottom">
        <span className="vy-loyalty-card__action">Usar pontos</span>
        <span className="vy-loyalty-card__meta">
          <span className="vy-sr-only">Cliente: {customerName}. </span>
          {cardNumber}
        </span>
      </div>
    </article>
  );
}
