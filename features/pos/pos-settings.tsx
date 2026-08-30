import type { PosContextState } from "./data";
import { PosPaymentSettingsScreen } from "./pos-payment-settings";
import { PosTerminalSettingsScreen } from "./pos-terminal-settings";

export const posSettingsViews = [
  "geral",
  "dispositivos",
  "impressora",
  "rede",
  "utilizadores",
  "seguranca"
] as const;

export type PosSettingsViewId = (typeof posSettingsViews)[number];

export const posPaymentViews = ["mpesa", "emola", "mkesh", "dinheiro", "cartao"] as const;

export type PosPaymentViewId = (typeof posPaymentViews)[number];

export function parsePosSettingsView(value: string | string[] | undefined): PosSettingsViewId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return posSettingsViews.includes(candidate as PosSettingsViewId)
    ? (candidate as PosSettingsViewId)
    : "geral";
}

export function parsePosPaymentView(value: string | string[] | undefined): PosPaymentViewId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return posPaymentViews.includes(candidate as PosPaymentViewId)
    ? (candidate as PosPaymentViewId)
    : "mpesa";
}

export function PosSettingsView({
  context,
  view,
  terminalId,
  result
}: {
  context: PosContextState;
  view: PosSettingsViewId;
  terminalId?: string;
  result?: string;
}) {
  return (
    <PosTerminalSettingsScreen
      context={context}
      result={result}
      terminalId={terminalId}
      view={view}
    />
  );
}

export function PosPaymentSettingsView({
  context,
  method,
  result,
  businessId,
  branchId,
  basePath,
  returnHref
}: {
  context: PosContextState;
  method: PosPaymentViewId;
  result?: string;
  businessId?: string;
  branchId?: string;
  basePath?: string;
  returnHref?: string;
}) {
  return (
    <PosPaymentSettingsScreen
      basePath={basePath}
      branchId={branchId}
      businessId={businessId}
      context={context}
      method={method}
      result={result}
      returnHref={returnHref}
    />
  );
}
