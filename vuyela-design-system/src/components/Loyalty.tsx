import type { HTMLAttributes, ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface PointsBalanceProps extends HTMLAttributes<HTMLDivElement> {
  businessName: string;
  points: number;
  valueMzn?: number;
  label?: string;
}

export function PointsBalance({
  businessName,
  points,
  valueMzn = points,
  label = "Saldo disponível",
  className = "",
  ...props
}: PointsBalanceProps) {
  return (
    <div className={["vy-points-balance", className].filter(Boolean).join(" ")} {...props}>
      <span>{label}</span>
      <strong>{points.toLocaleString("pt-MZ")} pontos</strong>
      <small>
        Equivalente a {valueMzn.toLocaleString("pt-MZ")} MZN neste estabelecimento: {businessName}
      </small>
    </div>
  );
}

export interface RewardBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  points?: number | undefined;
}

export function RewardBadge({ label, points, className = "", ...props }: RewardBadgeProps) {
  return (
    <span className={["vy-reward-badge", className].filter(Boolean).join(" ")} {...props}>
      <span>{label}</span>
      {points !== undefined ? <strong>{points.toLocaleString("pt-MZ")} pontos</strong> : null}
    </span>
  );
}

export type TransactionTone = "earn" | "redeem" | "expire" | "neutral";

export interface TransactionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  points: number;
  tone?: TransactionTone;
  timestamp?: string | undefined;
}

export function TransactionItem({
  title,
  description,
  points,
  tone = points >= 0 ? "earn" : "redeem",
  timestamp,
  className = "",
  ...props
}: TransactionItemProps) {
  const sign = points > 0 ? "+" : "";

  return (
    <article
      className={["vy-transaction", `vy-transaction--${tone}`, className].filter(Boolean).join(" ")}
      {...props}
    >
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
        {timestamp ? <time>{timestamp}</time> : null}
      </div>
      <b>
        {sign}
        {points.toLocaleString("pt-MZ")} pontos
      </b>
    </article>
  );
}

export interface BusinessCardProps extends HTMLAttributes<HTMLElement> {
  name: string;
  category: string;
  location: string;
  rewardRate: string;
  action?: ReactNode;
}

export function BusinessCard({
  name,
  category,
  location,
  rewardRate,
  action,
  className = "",
  ...props
}: BusinessCardProps) {
  return (
    <article className={["vy-business-card", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-business-card__media" aria-hidden="true" />
      <div>
        <span>{category}</span>
        <h3>{name}</h3>
        <p>{location}</p>
        <strong>{rewardRate}</strong>
      </div>
      {action}
    </article>
  );
}

export interface OfferCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  businessName: string;
  description: string;
  badge?: ReactNode;
  action?: ReactNode;
}

export function OfferCard({
  title,
  businessName,
  description,
  badge,
  action,
  className = "",
  ...props
}: OfferCardProps) {
  return (
    <article className={["vy-offer-card", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-offer-card__top">
        <span>{businessName}</span>
        {badge}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </article>
  );
}

export interface QRDisplayProps extends HTMLAttributes<HTMLDivElement> {
  code: string;
  label?: string;
  expiresAt?: string | undefined;
}

export function QRDisplay({
  code,
  label = "Código QR",
  expiresAt,
  className = "",
  ...props
}: QRDisplayProps) {
  return (
    <div className={["vy-qr-display", className].filter(Boolean).join(" ")} {...props}>
      <span>{label}</span>
      <div className="vy-qr-display__matrix">
        <QRCodeSVG
          aria-label={`${label}: ${code}`}
          bgColor="#ffffff"
          fgColor="#032b38"
          level="M"
          marginSize={1}
          role="img"
          size={176}
          value={code}
        />
      </div>
      <strong>{code}</strong>
      {expiresAt ? <small>Expira em {expiresAt}</small> : null}
    </div>
  );
}

export interface QRScannerProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function QRScanner({
  title = "Ler QR Code",
  description = "Aponte a câmara para identificar o cartão ou validar a autorização.",
  action,
  className = "",
  ...props
}: QRScannerProps) {
  return (
    <div className={["vy-qr-scanner", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-qr-scanner__frame" aria-hidden="true">
        <span />
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
