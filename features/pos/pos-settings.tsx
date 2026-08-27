import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  DatabaseBackup,
  EthernetPort,
  Fingerprint,
  Gauge,
  HardDrive,
  KeyRound,
  Languages,
  LockKeyhole,
  MonitorSmartphone,
  Network,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCcw,
  ScanLine,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  Trash2,
  Usb,
  UserCog,
  UsersRound,
  Volume2,
  WalletCards,
  Wifi,
  WifiOff
} from "lucide-react";
import type { ReactNode } from "react";

import type {
  PosBusinessContext,
  PosContextState,
  PosDeviceContext,
  PosPaymentChannelContext,
  PosTerminalContext
} from "./data";
import {
  managePosPaymentChannelAction,
  managePosTerminalAction,
  managePosTerminalDeviceAction,
  updatePosTerminalSettingsAction
} from "./settings-actions";
import { posAppRoutes } from "./routes";

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

const settingsNavigation: Array<{
  id: PosSettingsViewId;
  label: string;
  icon: typeof Settings2;
}> = [
  { id: "geral", label: "Geral", icon: Settings2 },
  { id: "dispositivos", label: "Dispositivos", icon: MonitorSmartphone },
  { id: "impressora", label: "Impressora", icon: Printer },
  { id: "rede", label: "Rede", icon: Network },
  { id: "utilizadores", label: "Utilizadores", icon: UsersRound },
  { id: "seguranca", label: "Segurança", icon: ShieldCheck }
];

const paymentNavigation: Array<{
  id: PosPaymentViewId;
  label: string;
  icon: typeof Smartphone;
}> = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone },
  { id: "emola", label: "e-Mola", icon: Smartphone },
  { id: "mkesh", label: "mKesh", icon: Smartphone },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "cartao", label: "Cartão", icon: CreditCard }
];

const settingsPageCopy: Record<
  PosSettingsViewId,
  { eyebrow: string; title: string; body: string }
> = {
  geral: {
    eyebrow: "Definições do sistema",
    title: "Definições Gerais",
    body: "Informações do negócio, região, recibos e comportamento do terminal."
  },
  dispositivos: {
    eyebrow: "Hardware do terminal",
    title: "Dispositivos Conectados",
    body: "Leitores, câmaras e periféricos autorizados para este terminal."
  },
  impressora: {
    eyebrow: "Impressão e recibos",
    title: "Impressoras",
    body: "Estado das impressoras e conteúdo dos comprovativos VUYELA."
  },
  rede: {
    eyebrow: "Conectividade do POS",
    title: "Rede e Conectividade",
    body: "Ligação segura, sincronização e proteção contra interrupções."
  },
  utilizadores: {
    eyebrow: "Acessos do terminal",
    title: "Gestão de Utilizadores",
    body: "Funções autorizadas e ligação à equipa do negócio."
  },
  seguranca: {
    eyebrow: "Proteção da operação",
    title: "Segurança e Acesso",
    body: "Sessões, auditoria e garantias aplicadas às transações."
  }
};

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
  if (context.status !== "ready") {
    return <PosSettingsNotice message={context.message} />;
  }

  const business = context.businesses[0];
  const terminal =
    business?.terminals.find((item) => item.id === terminalId) ??
    business?.terminals.find((item) => item.status === "active") ??
    business?.terminals[0];
  const branch = business?.branches.find((item) => item.id === terminal?.branchId);
  const pageCopy = settingsPageCopy[view];

  return (
    <div className="pos-settings-layout">
      <PosSettingsNavigation active={view} terminalId={terminal?.id} />
      <section className="pos-settings-main">
        <PosSettingsResult result={result} />
        <SettingsHeader
          eyebrow={pageCopy.eyebrow}
          title={pageCopy.title}
          body={`${pageCopy.body} ${business?.name ?? "Negócio VUYELA"} · ${branch?.name ?? "Sede principal"}`}
        />
        {view === "geral" ? <GeneralSettings business={business} terminal={terminal} /> : null}
        {view === "dispositivos" ? (
          <DeviceSettings business={business} terminal={terminal} />
        ) : null}
        {view === "impressora" ? <PrinterSettings business={business} terminal={terminal} /> : null}
        {view === "rede" ? <NetworkSettings terminal={terminal} /> : null}
        {view === "utilizadores" ? <UserSettings roles={business?.roleLabels ?? []} /> : null}
        {view === "seguranca" ? <SecuritySettings /> : null}
      </section>
    </div>
  );
}

export function PosPaymentSettingsView({
  context,
  method,
  result
}: {
  context: PosContextState;
  method: PosPaymentViewId;
  result?: string;
}) {
  if (context.status !== "ready") {
    return <PosSettingsNotice message={context.message} />;
  }

  const config = paymentConfig[method];
  const Icon = config.icon;
  const business = context.businesses[0];
  const branchId = business?.defaultBranchId;
  const databaseMethod = paymentViewToMethod(method);
  const channel = business?.paymentChannels.find(
    (item) =>
      item.method === databaseMethod && (item.branchId === branchId || item.branchId === null)
  );
  const enabled = channel?.status === "active";
  const statusLabel = paymentChannelStatusLabel(channel);

  return (
    <div className="pos-settings-layout">
      <PosSettingsNavigation active="pagamentos" paymentMethod={method} />
      <section className="pos-settings-main">
        <PosSettingsResult result={result} />
        <SettingsHeader
          eyebrow="Métodos de pagamento"
          title={`Configuração ${config.label}`}
          body="Configure a disponibilidade e confirme o estado operacional deste canal no POS VUYELA."
        />
        <nav aria-label="Métodos de pagamento" className="pos-payment-tabs">
          {paymentNavigation.map((item) => {
            const TabIcon = item.icon;
            return (
              <Link
                aria-current={item.id === method ? "page" : undefined}
                className={item.id === method ? "is-active" : undefined}
                href={`${posAppRoutes.payments}?metodo=${item.id}`}
                key={item.id}
              >
                <TabIcon aria-hidden="true" size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pos-settings-grid pos-settings-grid--payment">
          <SettingsCard
            className="pos-payment-provider"
            title="Estado da integração"
            icon={<Icon size={22} />}
          >
            <div className="pos-payment-provider__status">
              <span
                className={`pos-config-status pos-config-status--${enabled ? "success" : "muted"}`}
              >
                {statusLabel}
              </span>
              <p>{config.description}</p>
            </div>
            <dl className="pos-settings-facts">
              <Fact
                label="Processamento"
                value={
                  channel?.mode === "manual" ? "Confirmação manual auditada" : config.processing
                }
              />
              <Fact label="Moeda" value="Metical moçambicano (MZN)" />
              <Fact label="Confirmação" value={config.confirmation} />
              <Fact label="Ambiente" value={publicSetting(channel, "environment", "Produção")} />
            </dl>
          </SettingsCard>

          <SettingsCard title="Credenciais e segurança" icon={<LockKeyhole size={20} />}>
            {config.mode === "manual" ? (
              <div className="pos-settings-callout">
                <Icon aria-hidden="true" size={22} />
                <div>
                  <strong>Sem credenciais externas</strong>
                  <p>{config.manualConfirmation}</p>
                </div>
              </div>
            ) : (
              <div className="pos-secure-fields">
                <SecureField
                  label={config.identifierLabel}
                  value={channel?.maskedIdentifier ?? config.identifierValue}
                />
                <SecureField
                  label="Credenciais do provedor"
                  value={
                    channel?.credentialsConfigured ? "Configuradas no servidor" : "Não configuradas"
                  }
                />
                <p>
                  As chaves privadas são guardadas exclusivamente no servidor. Este ecrã mostra
                  apenas o identificador mascarado e o estado da integração.
                </p>
              </div>
            )}
          </SettingsCard>
          <SettingsCard title="Limites e confirmação" icon={<Gauge size={20} />}>
            <dl className="pos-settings-facts">
              <Fact
                label="Valor mínimo"
                value={publicSetting(channel, "minimumAmount", "Sem limite")}
              />
              <Fact
                label="Valor máximo"
                value={publicSetting(channel, "maximumAmount", "Sem limite")}
              />
              <Fact label="Tempo limite" value={publicSetting(channel, "timeout", "60 segundos")} />
              <Fact
                label="Notificação"
                value={publicSetting(
                  channel,
                  "notification",
                  config.mode === "manual" ? "No POS" : "Confirmação do provedor"
                )}
              />
            </dl>
          </SettingsCard>

          <SettingsCard title="Disponibilidade no POS" icon={<CheckCircle2 size={20} />}>
            <div className="pos-setting-row">
              <div>
                <strong>Apresentar {config.label}</strong>
                <p>
                  {enabled
                    ? config.mode === "manual"
                      ? "Disponível com confirmação do operador na etapa de autorização."
                      : "Disponível após confirmação segura do provedor."
                    : "Oculto até existir uma configuração válida para este negócio."}
                </p>
              </div>
              <span
                aria-checked={enabled}
                aria-label={`${config.label} disponível`}
                className={`pos-readonly-toggle${enabled ? " is-active" : ""}`}
                role="switch"
              >
                <span />
              </span>
            </div>
            {enabled ? (
              <div className="pos-settings-actions">
                <Link
                  className="pos-settings-button pos-settings-button--secondary"
                  href={posAppRoutes.root}
                >
                  Testar confirmação manual
                </Link>
                {business?.canManage && channel ? (
                  <PaymentChannelForm
                    businessId={business.id}
                    channel={channel}
                    label="Suspender no POS"
                    operation="suspend"
                  />
                ) : null}
              </div>
            ) : business?.canManage && channel?.mode === "manual" ? (
              <div className="pos-settings-actions">
                <PaymentChannelForm
                  businessId={business.id}
                  channel={channel}
                  label="Ativar no POS"
                  operation="activate"
                />
              </div>
            ) : null}
          </SettingsCard>

          <SettingsCard
            className="pos-settings-span"
            title="Reconciliação e segurança"
            icon={<RefreshCcw size={20} />}
          >
            <SettingsRows
              rows={[
                [
                  "Reconciliação",
                  config.mode === "manual" ? "Confirmada pelo operador" : "Processada pelo provedor"
                ],
                ["Registo do pagamento", "Obrigatório em transaction_payments"],
                ["Proteção contra duplicação", "Chave de idempotência por operação"],
                ["Credenciais", config.mode === "manual" ? "Não aplicável" : "Geridas no servidor"]
              ]}
            />
          </SettingsCard>
        </div>
      </section>
    </div>
  );
}

function PosSettingsNavigation({
  active,
  terminalId,
  paymentMethod
}: {
  active: PosSettingsViewId | "pagamentos";
  terminalId?: string;
  paymentMethod?: PosPaymentViewId;
}) {
  const isPaymentMenu = paymentMethod !== undefined;

  return (
    <aside className={`pos-settings-nav${isPaymentMenu ? " pos-settings-nav--payments" : ""}`}>
      <div className="pos-settings-nav__heading">
        <span>{isPaymentMenu ? "CONFIGURAÇÃO" : "CONFIGURAÇÕES POS"}</span>
        <strong>{isPaymentMenu ? "Métodos de Pagamento" : "Definições do Terminal"}</strong>
      </div>
      <nav aria-label="Definições do terminal" className="pos-settings-nav__desktop">
        {isPaymentMenu ? (
          <>
            <Link className="pos-settings-nav__return" href={posAppRoutes.settings}>
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar às configurações
            </Link>
            {paymentNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  aria-current={paymentMethod === item.id ? "page" : undefined}
                  className={paymentMethod === item.id ? "is-active" : undefined}
                  href={`${posAppRoutes.payments}?metodo=${item.id}`}
                  key={item.id}
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </>
        ) : (
          <>
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  aria-current={active === item.id ? "page" : undefined}
                  className={active === item.id ? "is-active" : undefined}
                  href={`${posAppRoutes.settings}?vista=${item.id}${terminalId ? `&terminal=${terminalId}` : ""}`}
                  key={item.id}
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              aria-current={active === "pagamentos" ? "page" : undefined}
              className={active === "pagamentos" ? "is-active" : undefined}
              href={posAppRoutes.payments}
            >
              <WalletCards aria-hidden="true" size={18} />
              Pagamentos
            </Link>
          </>
        )}
      </nav>
      <Link className="pos-settings-nav__back" href={posAppRoutes.root}>
        <ArrowLeft aria-hidden="true" size={17} />
        Voltar ao POS
      </Link>
      <nav aria-label="Navegação móvel do POS" className="pos-settings-mobile-nav">
        <Link href={posAppRoutes.root}>
          <Store aria-hidden="true" size={19} />
          <span>POS</span>
        </Link>
        <Link
          aria-current={active === "geral" ? "page" : undefined}
          className={active === "geral" ? "is-active" : undefined}
          href={`${posAppRoutes.settings}?vista=geral${terminalId ? `&terminal=${terminalId}` : ""}`}
        >
          <Settings2 aria-hidden="true" size={19} />
          <span>Geral</span>
        </Link>
        <Link
          aria-current={active === "dispositivos" ? "page" : undefined}
          className={active === "dispositivos" ? "is-active" : undefined}
          href={`${posAppRoutes.settings}?vista=dispositivos${terminalId ? `&terminal=${terminalId}` : ""}`}
        >
          <MonitorSmartphone aria-hidden="true" size={19} />
          <span>Dispositivos</span>
        </Link>
        <Link
          aria-current={active === "pagamentos" ? "page" : undefined}
          className={active === "pagamentos" ? "is-active" : undefined}
          href={posAppRoutes.payments}
        >
          <WalletCards aria-hidden="true" size={19} />
          <span>Pagamentos</span>
        </Link>
        <details
          className={
            active === "impressora" ||
            active === "rede" ||
            active === "utilizadores" ||
            active === "seguranca"
              ? "is-active"
              : undefined
          }
        >
          <summary>
            <Settings2 aria-hidden="true" size={19} />
            <span>Mais</span>
          </summary>
          <div>
            {settingsNavigation.slice(2).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  aria-current={active === item.id ? "page" : undefined}
                  href={`${posAppRoutes.settings}?vista=${item.id}${terminalId ? `&terminal=${terminalId}` : ""}`}
                  key={item.id}
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </details>
      </nav>
    </aside>
  );
}

function GeneralSettings({
  business,
  terminal
}: {
  business?: PosBusinessContext;
  terminal?: PosTerminalContext;
}) {
  if (!business) return <PosSettingsNotice message="Não existe um negócio disponível." />;
  const branch = business.branches.find((item) => item.id === terminal?.branchId);

  return (
    <div className="pos-settings-stack">
      <SettingsCard
        className="pos-settings-span"
        title="Informações do Negócio"
        icon={<Store size={20} />}
      >
        <div className="pos-settings-field-grid">
          <ReadOnlyField label="Nome da empresa" value={business.name} />
          <ReadOnlyField label="NIF / NUIT" value="Protegido na gestão do negócio" />
          <ReadOnlyField
            label="Endereço"
            value={
              branch?.addressLine
                ? `${branch.addressLine}, ${branch.city}`
                : (branch?.city ?? "Por configurar")
            }
          />
          <ReadOnlyField
            label="Telefone"
            value={branch?.phone ?? business.phone ?? "Por configurar"}
          />
          <ReadOnlyField label="Email" value={business.email ?? "Por configurar"} />
          <ReadOnlyField label="Filial ativa" value={branch?.name ?? "Não selecionada"} />
        </div>
        {business.canManage ? (
          <Link
            className="pos-settings-button pos-settings-button--secondary"
            href="/negocio/definicoes"
          >
            Editar informações
          </Link>
        ) : null}
      </SettingsCard>

      <div className="pos-settings-grid">
        <SettingsCard title="Moeda e Região" icon={<Languages size={20} />}>
          <dl className="pos-settings-facts">
            <Fact
              label="Moeda padrão"
              value={`${terminal?.settings.currency ?? "MZN"} · Metical`}
            />
            <Fact label="Fuso horário" value={terminal?.settings.timezone ?? "Africa/Maputo"} />
            <Fact label="Formato de data" value="DD/MM/AAAA" />
            <Fact label="Idioma do sistema" value={terminal?.settings.locale ?? "pt-MZ"} />
          </dl>
        </SettingsCard>

        <SettingsCard title="Terminal Atual" icon={<MonitorSmartphone size={20} />}>
          <dl className="pos-settings-facts">
            <Fact label="Nome" value={terminal?.name ?? "Não registado"} />
            <Fact label="Código" value={terminal?.code ?? "-"} />
            {terminal?.status === "active" ? (
              <Fact label="Estado" value="Ativo" tone="success" />
            ) : (
              <Fact label="Estado" value={terminalStatusLabel(terminal?.status)} />
            )}
            <Fact
              label="Última atividade"
              value={
                terminal?.lastSeenAt ? formatDateTime(terminal.lastSeenAt) : "Ainda sem atividade"
              }
            />
          </dl>
        </SettingsCard>
      </div>

      {terminal ? (
        <SettingsCard
          className="pos-settings-span"
          title="Personalização do Recibo e da Caixa"
          icon={<ReceiptText size={20} />}
        >
          <div className="pos-settings-callout pos-settings-callout--muted">
            <ReceiptText aria-hidden="true" size={23} />
            <div>
              <strong>Identidade VUYELA aplicada</strong>
              <p>O comprovativo inclui negócio, filial, YELAS e referência de auditoria.</p>
            </div>
          </div>
          {business.canManage ? (
            <form action={updatePosTerminalSettingsAction} className="pos-persistent-form">
              <input name="businessId" type="hidden" value={business.id} />
              <input name="terminalId" type="hidden" value={terminal.id} />
              <div className="pos-settings-checkboxes">
                <SettingCheckbox
                  defaultChecked={terminal.settings.requireCustomerAuthorization}
                  label="Pedir confirmação do cliente"
                  name="requireCustomerAuthorization"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.printReceiptAutomatically}
                  label="Imprimir comprovativo automaticamente"
                  name="printReceiptAutomatically"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.showPointsBalance}
                  label="Mostrar YELAS disponíveis"
                  name="showPointsBalance"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.showMznEquivalent}
                  label="Mostrar equivalente em MZN"
                  name="showMznEquivalent"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.allowedLookupMethods.includes("qr")}
                  label="Identificação por QR Code"
                  name="lookupQr"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.allowedLookupMethods.includes("card")}
                  label="Identificação pelo número do cartão"
                  name="lookupCard"
                />
                <SettingCheckbox
                  defaultChecked={terminal.settings.allowedLookupMethods.includes("phone")}
                  label="Identificação por telefone"
                  name="lookupPhone"
                />
              </div>
              <label>
                <span>Bloqueio por inatividade (minutos)</span>
                <input
                  defaultValue={terminal.settings.inactivityTimeoutMinutes}
                  max={480}
                  min={5}
                  name="inactivity_timeout_minutes"
                  required
                  type="number"
                />
              </label>
              <button className="pos-settings-button" type="submit">
                Guardar alterações
              </button>
            </form>
          ) : (
            <SettingsRows
              rows={[
                [
                  "Confirmação do cliente",
                  terminal.settings.requireCustomerAuthorization ? "Obrigatória" : "Opcional"
                ],
                [
                  "Métodos de identificação",
                  terminal.settings.allowedLookupMethods.join(", ").toUpperCase()
                ],
                ["Tempo limite", `${terminal.settings.inactivityTimeoutMinutes} minutos`]
              ]}
            />
          )}
        </SettingsCard>
      ) : null}

      <SettingsCard
        className="pos-settings-span"
        title="Terminais do negócio"
        icon={<MonitorSmartphone size={20} />}
      >
        <div className="pos-terminal-list">
          {business.terminals.map((item) => (
            <div className={item.id === terminal?.id ? "is-active" : undefined} key={item.id}>
              <Link href={`${posAppRoutes.settings}?vista=geral&terminal=${item.id}`}>
                <strong>{item.name}</strong>
                <small>
                  {item.code} · {terminalStatusLabel(item.status)}
                </small>
              </Link>
              {business.canManage ? (
                <TerminalStateActions businessId={business.id} terminal={item} />
              ) : null}
            </div>
          ))}
        </div>
        {business.canManage ? <TerminalCreateForm business={business} /> : null}
      </SettingsCard>
    </div>
  );
}

function DeviceSettings({
  business,
  terminal
}: {
  business?: PosBusinessContext;
  terminal?: PosTerminalContext;
}) {
  if (!business || !terminal) {
    return <PosSettingsNotice message="Selecione um terminal para gerir os dispositivos." />;
  }

  return (
    <div className="pos-settings-stack">
      <SettingsCard
        className="pos-settings-span"
        title="Leitores e Periféricos"
        icon={<Usb size={20} />}
      >
        {terminal.devices.length > 0 ? (
          <div className="pos-device-list">
            {terminal.devices.map((device) => (
              <div className="pos-device-list__item" key={device.id}>
                <span className="pos-device-list__icon">
                  <MonitorSmartphone aria-hidden="true" size={21} />
                </span>
                <div>
                  <strong>{device.label}</strong>
                  <small>
                    {deviceTypeLabel(device.type)} · {device.deviceReference}
                  </small>
                  {device.lastSeenAt ? (
                    <small>Visto em {formatDateTime(device.lastSeenAt)}</small>
                  ) : null}
                </div>
                <span
                  className={`pos-config-status pos-config-status--${device.status === "active" ? "success" : "muted"}`}
                >
                  {deviceStatusLabel(device.status)}
                </span>
                {business.canManage ? (
                  <DeviceStateActions
                    businessId={business.id}
                    device={device}
                    terminalId={terminal.id}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="pos-settings-empty">
            <ScanLine aria-hidden="true" size={25} />
            <div>
              <strong>Nenhum dispositivo registado</strong>
              <p>Registe o leitor, a câmara ou a impressora ligada a este terminal.</p>
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        className="pos-settings-span"
        title="Códigos Suportados"
        icon={<QrCode size={20} />}
      >
        <div className="pos-capability-grid">
          {[
            ["QR Code", terminal.settings.allowedLookupMethods.includes("qr")],
            ["Número de cartão VUYELA", terminal.settings.allowedLookupMethods.includes("card")],
            ["Telefone", terminal.settings.allowedLookupMethods.includes("phone")],
            ["EAN-13", false],
            ["Code 128", false],
            ["DataMatrix", false]
          ].map(([label, enabled]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <ReadonlyToggle active={Boolean(enabled)} label={`${label} suportado`} />
            </div>
          ))}
        </div>
      </SettingsCard>

      <div className="pos-settings-grid">
        <SettingsCard title="Preferências de Leitura" icon={<Volume2 size={20} />}>
          <SettingsRows
            rows={[
              ["Som de confirmação", "Ativo no dispositivo"],
              ["Vibração", "Conforme o equipamento"],
              ["Leitura contínua", "Desativada por segurança"]
            ]}
          />
        </SettingsCard>
        <SettingsCard title="Política dos Dispositivos" icon={<ShieldCheck size={20} />}>
          <SettingsRows
            rows={[
              ["Acesso à câmara", "Apenas durante a leitura do QR Code"],
              ["Dados locais", "Nenhum dado sensível"],
              ["Sessão", "Controlada pela autenticação segura"]
            ]}
          />
        </SettingsCard>
      </div>

      {business.canManage ? (
        <DeviceCreateForm businessId={business.id} terminalId={terminal.id} />
      ) : null}
    </div>
  );
}

function PrinterSettings({
  business,
  terminal
}: {
  business?: PosBusinessContext;
  terminal?: PosTerminalContext;
}) {
  const printers = terminal?.devices.filter((device) => device.type === "printer") ?? [];
  const activePrinter = printers.find((device) => device.status === "active");

  return (
    <div className="pos-settings-stack">
      <SettingsCard
        className="pos-settings-span"
        title="Impressoras Configuradas"
        icon={<Printer size={20} />}
      >
        {printers.length > 0 && terminal ? (
          <div className="pos-device-list">
            {printers.map((printer) => (
              <div className="pos-device-list__item" key={printer.id}>
                <span className="pos-device-list__icon">
                  <Printer aria-hidden="true" size={21} />
                </span>
                <div>
                  <strong>{printer.label}</strong>
                  <small>{printer.deviceReference}</small>
                </div>
                <span
                  className={`pos-config-status pos-config-status--${printer.status === "active" ? "success" : "muted"}`}
                >
                  {deviceStatusLabel(printer.status)}
                </span>
                {business?.canManage ? (
                  <DeviceStateActions
                    businessId={business.id}
                    device={printer}
                    terminalId={terminal.id}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="pos-settings-empty">
            <Printer aria-hidden="true" size={25} />
            <div>
              <strong>Impressora não ligada</strong>
              <p>O comprovativo digital continua sempre disponível.</p>
            </div>
          </div>
        )}
      </SettingsCard>

      <div className="pos-settings-grid">
        <SettingsCard title="Definições de Impressão" icon={<Settings2 size={20} />}>
          <dl className="pos-settings-facts">
            <Fact label="Papel" value="80 mm" />
            <Fact label="Cópias" value="1" />
            <Fact label="Tamanho da fonte" value="Normal" />
            <Fact label="Ligação" value={activePrinter ? "Dispositivo ativo" : "Por configurar"} />
          </dl>
        </SettingsCard>
        <SettingsCard title="Automatização" icon={<ReceiptText size={20} />}>
          <div className="pos-capability-list">
            <SettingStatus
              active={terminal?.settings.printReceiptAutomatically ?? false}
              detail="Após a confirmação do pagamento"
              label="Imprimir automaticamente"
            />
            <SettingStatus
              active
              detail="Identidade visual oficial"
              label="Logótipo no cabeçalho"
            />
          </div>
        </SettingsCard>
      </div>

      <SettingsCard
        className="pos-settings-span"
        title="Conteúdo do Comprovativo"
        icon={<ReceiptText size={20} />}
      >
        <SettingsRows
          rows={[
            ["Logótipo VUYELA", "Visível no cabeçalho"],
            ["YELAS ganhas e usadas", "Detalhadas por transação"],
            ["Referência anti-duplicação", "Visível para auditoria"],
            ["Contacto do negócio", "Obtido do perfil da filial"]
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function NetworkSettings({ terminal }: { terminal?: PosTerminalContext }) {
  const isOnline = terminal?.status === "active";

  return (
    <div className="pos-settings-stack">
      <SettingsCard
        className="pos-settings-span"
        title="Estado da Ligação"
        icon={isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
      >
        <div className={`pos-network-status${isOnline ? "" : " pos-network-status--muted"}`}>
          <span />
          <div>
            <strong>{isOnline ? "Terminal ativo" : "Terminal indisponível"}</strong>
            <p>
              {terminal?.lastSeenAt
                ? `Última atividade: ${formatDateTime(terminal.lastSeenAt)}`
                : "A atividade será registada na primeira transação."}
            </p>
          </div>
        </div>
        <dl className="pos-settings-facts">
          <Fact label="Ligação" value="HTTPS cifrado" />
          <Fact label="Endereço IP" value="Oculto por segurança" />
          <Fact label="Região" value="Automática" />
          <Fact label="Latência" value="Medida em cada operação" />
        </dl>
      </SettingsCard>

      <div className="pos-settings-grid">
        <SettingsCard title="Modo Offline" icon={<HardDrive size={20} />}>
          <div className="pos-capability-list">
            <SettingStatus
              active={false}
              detail="Saldos nunca são alterados sem confirmação do servidor"
              label="Permitir vendas sem internet"
            />
            <SettingStatus
              active={false}
              detail="Não existem transações locais pendentes"
              label="Fila local de transações"
            />
          </div>
        </SettingsCard>
        <SettingsCard title="Sincronização de Dados" icon={<RefreshCcw size={20} />}>
          <SettingsRows
            rows={[
              ["Intervalo", "Em cada operação"],
              [
                "Última sincronização",
                terminal?.lastSeenAt ? formatDateTime(terminal.lastSeenAt) : "Por iniciar"
              ],
              ["Retoma", "Nova consulta ao servidor"]
            ]}
          />
        </SettingsCard>
      </div>

      <SettingsCard className="pos-settings-span" title="Servidor API" icon={<Server size={20} />}>
        <div className="pos-settings-field-grid">
          <ReadOnlyField label="Canal" value="Ligação VUYELA protegida por TLS" />
          <ReadOnlyField label="Estado" value={isOnline ? "Operacional" : "A aguardar terminal"} />
        </div>
        <div className="pos-settings-callout">
          <EthernetPort aria-hidden="true" size={23} />
          <div>
            <strong>Proteção contra falhas</strong>
            <p>
              Uma transação só termina após confirmação do servidor. A idempotência impede registos
              duplicados quando a ligação é interrompida.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

function UserSettings({ roles }: { roles: string[] }) {
  return (
    <div className="pos-settings-stack">
      <SettingsCard
        className="pos-settings-span"
        title="Utilizadores Registados"
        icon={<UserCog size={20} />}
      >
        <div className="pos-user-card">
          <span>VY</span>
          <div>
            <strong>Operador autenticado</strong>
            <p>{roles.join(" · ") || "Operador POS"}</p>
          </div>
          <span className="pos-config-status pos-config-status--success">Ativo</span>
        </div>
        <div className="pos-user-table" role="table" aria-label="Utilizadores do terminal">
          <div role="row">
            <span role="columnheader">Utilizador</span>
            <span role="columnheader">Função</span>
            <span role="columnheader">Estado</span>
            <span role="columnheader">Acesso</span>
          </div>
          <div role="row">
            <strong role="cell">Operador autenticado</strong>
            <span role="cell">{roles.join(", ") || "Operador POS"}</span>
            <span role="cell" className="is-success">
              Ativo
            </span>
            <span role="cell">Sessão atual</span>
          </div>
        </div>
        <Link className="pos-settings-button" href="/negocio?vista=equipa">
          Gerir equipa do negócio
        </Link>
      </SettingsCard>

      <div className="pos-settings-grid">
        <SettingsCard title="Administrador" icon={<ShieldCheck size={20} />}>
          <SettingsRows
            rows={[
              ["Configurar terminais", "Permitido"],
              ["Gerir pagamentos", "Permitido"],
              ["Consultar relatórios", "Permitido"]
            ]}
          />
        </SettingsCard>
        <SettingsCard title="Operador" icon={<UsersRound size={20} />}>
          <SettingsRows
            rows={[
              ["Efetuar transações", "Permitido"],
              ["Consultar clientes", "Conforme filial"],
              ["Alterar definições", "Bloqueado"]
            ]}
          />
        </SettingsCard>
      </div>

      <div className="pos-settings-callout pos-settings-callout--muted">
        <ShieldCheck aria-hidden="true" size={23} />
        <div>
          <strong>Uma única fonte de permissões</strong>
          <p>A criação, suspensão e associação a filiais é feita na gestão da equipa do negócio.</p>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="pos-settings-stack">
      <div className="pos-settings-grid">
        <SettingsCard title="PIN e Acesso Rápido" icon={<Fingerprint size={20} />}>
          <div className="pos-capability-list">
            <SettingStatus
              active
              detail="Obrigatória para operar o terminal"
              label="Sessão autenticada"
            />
            <SettingStatus
              active
              detail="Exigido em ações privilegiadas"
              label="MFA administrativo"
            />
          </div>
          <dl className="pos-settings-facts">
            <Fact label="Bloqueio" value="Gerido pela plataforma" />
            <Fact label="Sessão" value="Pode terminar no cabeçalho" />
          </dl>
        </SettingsCard>
        <SettingsCard title="Cópias e Continuidade" icon={<DatabaseBackup size={20} />}>
          <div className="pos-capability-list">
            <SettingStatus
              active
              detail="Dados persistidos no servidor"
              label="Proteção automática"
            />
            <SettingStatus
              active
              detail="Consultas repetíveis sem duplicação"
              label="Idempotência"
            />
          </div>
          <p className="pos-settings-copy">
            Não são guardadas cópias de saldos ou credenciais neste dispositivo.
          </p>
        </SettingsCard>
      </div>

      <SettingsCard
        className="pos-settings-span"
        title="Registo de Atividade"
        icon={<KeyRound size={20} />}
      >
        <SettingsRows
          rows={[
            ["Autenticação", "Registada na sessão do operador"],
            ["Cálculo de YELAS", "Executado no servidor"],
            ["Alteração de saldo", "RPC transacional auditada"],
            ["Pagamento", "Registado em transaction_payments"]
          ]}
        />
      </SettingsCard>

      <SettingsCard
        className="pos-settings-span"
        title="Dados sensíveis"
        icon={<LockKeyhole size={20} />}
      >
        <div className="pos-settings-callout">
          <ShieldCheck size={24} />
          <div>
            <strong>Nenhuma credencial sensível é exposta</strong>
            <p>
              Chaves de provedores, funções de serviço e regras multi-negócio permanecem no servidor
              com RLS ativo.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

function TerminalCreateForm({ business }: { business: PosBusinessContext }) {
  return (
    <details className="pos-settings-editor">
      <summary>
        <Plus aria-hidden="true" size={16} /> Registar terminal
      </summary>
      <form action={managePosTerminalAction} className="pos-persistent-form">
        <input name="businessId" type="hidden" value={business.id} />
        <input name="operation" type="hidden" value="create" />
        <label>
          <span>Nome</span>
          <input maxLength={100} minLength={2} name="name" placeholder="POS Balcão 2" required />
        </label>
        <label>
          <span>Filial</span>
          <select name="branchId" required>
            {business.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Código personalizado (opcional)</span>
          <input name="code" pattern="POS-[0-9A-Z-]{4,32}" placeholder="POS-MAPUTO-02" />
        </label>
        <button className="pos-settings-button" type="submit">
          Criar terminal
        </button>
      </form>
    </details>
  );
}

function TerminalStateActions({
  businessId,
  terminal
}: {
  businessId: string;
  terminal: PosTerminalContext;
}) {
  if (terminal.status === "revoked") return null;
  const operation = terminal.status === "active" ? "suspend" : "activate";

  return (
    <div className="pos-settings-inline-actions">
      <form action={managePosTerminalAction}>
        <input name="businessId" type="hidden" value={businessId} />
        <input name="terminalId" type="hidden" value={terminal.id} />
        <input name="operation" type="hidden" value={operation} />
        <button type="submit">{operation === "activate" ? "Ativar" : "Suspender"}</button>
      </form>
      {terminal.status !== "active" ? (
        <form action={managePosTerminalAction}>
          <input name="businessId" type="hidden" value={businessId} />
          <input name="terminalId" type="hidden" value={terminal.id} />
          <input name="operation" type="hidden" value="revoke" />
          <button className="is-danger" title="Revogar terminal" type="submit">
            <Trash2 aria-hidden="true" size={14} />
          </button>
        </form>
      ) : null}
    </div>
  );
}

function DeviceCreateForm({ businessId, terminalId }: { businessId: string; terminalId: string }) {
  return (
    <SettingsCard
      className="pos-settings-span"
      title="Registar dispositivo"
      icon={<Plus size={20} />}
    >
      <form action={managePosTerminalDeviceAction} className="pos-persistent-form">
        <input name="businessId" type="hidden" value={businessId} />
        <input name="terminalId" type="hidden" value={terminalId} />
        <input name="operation" type="hidden" value="create" />
        <label>
          <span>Tipo</span>
          <select name="deviceType">
            <option value="browser">Navegador</option>
            <option value="camera">Câmara</option>
            <option value="printer">Impressora</option>
            <option value="card_terminal">Terminal bancário</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label>
          <span>Nome</span>
          <input
            maxLength={100}
            minLength={2}
            name="label"
            placeholder="Impressora do balcão"
            required
          />
        </label>
        <label>
          <span>Referência do dispositivo</span>
          <input
            maxLength={200}
            minLength={8}
            name="deviceReference"
            placeholder="USB-PRINTER-001"
            required
          />
        </label>
        <button className="pos-settings-button" type="submit">
          Registar dispositivo
        </button>
      </form>
    </SettingsCard>
  );
}

function DeviceStateActions({
  businessId,
  device,
  terminalId
}: {
  businessId: string;
  device: PosDeviceContext;
  terminalId: string;
}) {
  if (device.status === "revoked") return null;
  const operation = device.status === "pending" ? "activate" : "revoke";

  return (
    <form action={managePosTerminalDeviceAction} className="pos-settings-actions">
      <input name="businessId" type="hidden" value={businessId} />
      <input name="terminalId" type="hidden" value={terminalId} />
      <input name="deviceId" type="hidden" value={device.id} />
      <input name="deviceType" type="hidden" value={device.type} />
      <input name="operation" type="hidden" value={operation} />
      <button className="pos-settings-button pos-settings-button--secondary" type="submit">
        {operation === "activate" ? "Ativar dispositivo" : "Revogar dispositivo"}
      </button>
    </form>
  );
}

function SettingCheckbox({
  defaultChecked,
  label,
  name
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label>
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function PaymentChannelForm({
  businessId,
  channel,
  label,
  operation
}: {
  businessId: string;
  channel: PosPaymentChannelContext;
  label: string;
  operation: "activate" | "suspend";
}) {
  return (
    <form action={managePosPaymentChannelAction}>
      <input name="businessId" type="hidden" value={businessId} />
      <input name="channelId" type="hidden" value={channel.id} />
      <input name="method" type="hidden" value={channel.method} />
      <input name="operation" type="hidden" value={operation} />
      <button className="pos-settings-button" type="submit">
        {label}
      </button>
    </form>
  );
}

function PosSettingsResult({ result }: { result?: string }) {
  if (!result) return null;
  const messages: Record<string, string> = {
    guardado: "Alteração guardada e registada na auditoria.",
    "dados-invalidos": "Existem dados inválidos ou incompletos.",
    "nao-configurado": "Este canal ainda não tem a configuração necessária.",
    erro: "Não foi possível concluir a alteração. Confirme as permissões."
  };
  const success = result === "guardado";

  return (
    <p className={`pos-message pos-message--${success ? "success" : "error"}`} role="status">
      {messages[result] ?? messages.erro}
    </p>
  );
}

function terminalStatusLabel(status: PosTerminalContext["status"] | undefined) {
  if (status === "active") return "Ativo";
  if (status === "suspended") return "Suspenso";
  if (status === "revoked") return "Revogado";
  return "Em preparação";
}

function deviceTypeLabel(type: PosDeviceContext["type"]) {
  const labels: Record<PosDeviceContext["type"], string> = {
    browser: "Navegador",
    camera: "Câmara",
    printer: "Impressora",
    card_terminal: "Terminal bancário",
    other: "Outro dispositivo"
  };
  return labels[type];
}

function deviceStatusLabel(status: PosDeviceContext["status"]) {
  return status === "active" ? "Ativo" : status === "revoked" ? "Revogado" : "Pendente";
}

function paymentViewToMethod(view: PosPaymentViewId): PosPaymentChannelContext["method"] {
  if (view === "dinheiro") return "cash";
  if (view === "cartao") return "card";
  return view;
}

function paymentChannelStatusLabel(channel?: PosPaymentChannelContext) {
  if (!channel || channel.status === "unconfigured") return "Por configurar";
  if (channel.status === "testing") return "Em testes";
  if (channel.status === "suspended") return "Suspenso";
  return channel.mode === "manual" ? "Confirmação manual ativa" : "Ligado ao provedor";
}

function publicSetting(
  channel: PosPaymentChannelContext | undefined,
  key: string,
  fallback: string
) {
  const value = channel?.publicSettings[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Ativo" : "Desativado";
  return fallback;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function SettingsHeader({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <header className="pos-settings-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{body}</p>
    </header>
  );
}

function SettingsCard({
  title,
  icon,
  className = "",
  children
}: {
  title: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`pos-settings-card ${className}`}>
      <header>
        <span>{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={tone === "success" ? "is-success" : undefined}>{value}</dd>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="pos-readonly-field">
      <span>{label}</span>
      <input readOnly value={value} />
    </label>
  );
}

function ReadonlyToggle({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      aria-checked={active}
      aria-label={label}
      className={`pos-readonly-toggle${active ? " is-active" : ""}`}
      role="switch"
    >
      <span />
    </span>
  );
}

function SettingStatus({
  active,
  detail,
  label
}: {
  active: boolean;
  detail: string;
  label: string;
}) {
  return (
    <div className="pos-setting-row">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <ReadonlyToggle active={active} label={label} />
    </div>
  );
}

function SettingsRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="pos-settings-rows">
      {rows.map(([label, detail]) => (
        <div key={label}>
          <span>
            <strong>{label}</strong>
            <small>{detail}</small>
          </span>
          <CheckCircle2 aria-hidden="true" size={18} />
        </div>
      ))}
    </div>
  );
}

function SecureField({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span>{label}</span>
      <input aria-label={label} readOnly value={value} />
    </label>
  );
}

function PosSettingsNotice({ message }: { message: string }) {
  return (
    <section className="pos-notice">
      <h1>Definições indisponíveis</h1>
      <p>{message}</p>
      <Link href={posAppRoutes.root}>Voltar ao POS</Link>
    </section>
  );
}

const paymentConfig: Record<
  PosPaymentViewId,
  {
    label: string;
    description: string;
    processing: string;
    confirmation: string;
    identifierLabel: string;
    identifierValue: string;
    manualConfirmation: string;
    mode: "manual" | "provider";
    enabled: boolean;
    statusLabel: string;
    statusTone: "success" | "muted";
    icon: typeof Smartphone;
  }
> = {
  mpesa: {
    label: "M-Pesa",
    description: "Canal M-Pesa previsto para configuração segura por negócio.",
    processing: "Integração não configurada",
    confirmation: "Indisponível",
    identifierLabel: "Código do comerciante",
    identifierValue: "Não configurado",
    manualConfirmation: "",
    mode: "provider",
    enabled: false,
    statusLabel: "Por configurar",
    statusTone: "muted",
    icon: Smartphone
  },
  emola: {
    label: "e-Mola",
    description: "Canal e-Mola previsto para configuração segura por negócio.",
    processing: "Integração não configurada",
    confirmation: "Indisponível",
    identifierLabel: "Conta comercial",
    identifierValue: "Não configurada",
    manualConfirmation: "",
    mode: "provider",
    enabled: false,
    statusLabel: "Por configurar",
    statusTone: "muted",
    icon: Smartphone
  },
  mkesh: {
    label: "mKesh",
    description: "Canal mKesh previsto para configuração segura por negócio.",
    processing: "Integração não configurada",
    confirmation: "Indisponível",
    identifierLabel: "Identificador comercial",
    identifierValue: "Não configurado",
    manualConfirmation: "",
    mode: "provider",
    enabled: false,
    statusLabel: "Por configurar",
    statusTone: "muted",
    icon: Smartphone
  },
  dinheiro: {
    label: "Dinheiro",
    description: "Registo de valores recebidos diretamente no balcão.",
    processing: "Confirmação pelo operador",
    confirmation: "Imediata no POS",
    identifierLabel: "Caixa",
    identifierValue: "Confirmação do operador",
    manualConfirmation: "O operador confirma o valor recebido antes de concluir a transação.",
    mode: "manual",
    enabled: true,
    statusLabel: "Confirmação manual",
    statusTone: "success",
    icon: Banknote
  },
  cartao: {
    label: "Cartão",
    description: "Pagamento processado num terminal bancário externo.",
    processing: "Terminal bancário do negócio",
    confirmation: "Confirmação pelo operador",
    identifierLabel: "Terminal",
    identifierValue: "Não associado",
    manualConfirmation:
      "O operador confirma no VUYELA apenas depois da aprovação no terminal bancário externo.",
    mode: "manual",
    enabled: true,
    statusLabel: "Confirmação manual",
    statusTone: "success",
    icon: CreditCard
  }
};
