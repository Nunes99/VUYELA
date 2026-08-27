import { Check, ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function SettingsCard({
  title,
  description,
  className,
  children
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`pos-figma-card${className ? ` ${className}` : ""}`}>
      <header>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function SettingsHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="pos-figma-page-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  );
}

export function MobileBreadcrumb({ label }: { label: string }) {
  return (
    <div className="pos-figma-mobile-breadcrumb" aria-label="Localização atual">
      <span>Definições</span>
      <b>/</b>
      <strong>{label}</strong>
    </div>
  );
}

export function ResultMessage({ result }: { result?: string }) {
  if (!result) return null;

  const messages: Record<string, { text: string; tone: "success" | "warning" | "error" }> = {
    guardado: { text: "Alterações guardadas com sucesso.", tone: "success" },
    "aguarda-teste": {
      text: "Credenciais guardadas em segurança. A ligação aguarda validação com o provedor.",
      tone: "warning"
    },
    "dados-invalidos": { text: "Reveja os campos e tente novamente.", tone: "error" },
    erro: { text: "Não foi possível guardar as alterações.", tone: "error" },
    "nao-configurado": {
      text: "Conclua a configuração antes de ativar este método.",
      tone: "warning"
    }
  };
  const message = messages[result];
  if (!message) return null;

  return (
    <p className={`pos-figma-result pos-figma-result--${message.tone}`} role="status">
      {message.text}
    </p>
  );
}

export function Field({
  label,
  suffix,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <label className={`pos-figma-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <span className="pos-figma-input-wrap">
        <input {...props} />
        {suffix ? <small>{suffix}</small> : null}
      </span>
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`pos-figma-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <span className="pos-figma-select-wrap">
        <select {...props}>{children}</select>
        <ChevronDown aria-hidden="true" size={16} />
      </span>
    </label>
  );
}

export function SwitchField({
  name,
  label,
  description,
  defaultChecked = false,
  disabled = false
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={`pos-figma-switch-row${disabled ? " is-disabled" : ""}`}>
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <input defaultChecked={defaultChecked} disabled={disabled} name={name} type="checkbox" />
      <i aria-hidden="true">
        <span />
      </i>
    </label>
  );
}

export function SaveButton() {
  return (
    <button className="pos-figma-save" type="submit">
      <Check aria-hidden="true" size={16} />
      Guardar alterações
    </button>
  );
}

export function StatusBadge({
  children,
  tone = "success"
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "muted";
}) {
  return <span className={`pos-figma-status pos-figma-status--${tone}`}>{children}</span>;
}

export function settingSection(
  settings: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const value = settings[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function settingString(
  settings: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = settings[key];
  return typeof value === "string" && value ? value : fallback;
}

export function settingNumber(
  settings: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const value = settings[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function settingBoolean(
  settings: Record<string, unknown>,
  key: string,
  fallback: boolean
): boolean {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
}

export function SettingsUnavailable({ message }: { message: string }) {
  return (
    <section className="pos-notice" aria-labelledby="pos-settings-notice-title">
      <h2 id="pos-settings-notice-title">Definições indisponíveis</h2>
      <p>{message}</p>
    </section>
  );
}
