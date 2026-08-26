import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  EthernetPort,
  Fingerprint,
  KeyRound,
  Languages,
  LockKeyhole,
  MonitorSmartphone,
  Network,
  Plus,
  Printer,
  ReceiptText,
  Router,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  Trash2,
  UserCog,
  UsersRound,
  WalletCards,
  Wifi
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

  return (
    <div className="pos-settings-layout">
      <PosSettingsNavigation active={view} terminalId={terminal?.id} />
      <section className="pos-settings-main">
        <PosSettingsResult result={result} />
        <SettingsHeader
          eyebrow="Definições do terminal"
          title={settingsNavigation.find((item) => item.id === view)?.label ?? "Geral"}
          body={`${business?.name ?? "Negócio VUYELA"} · ${branch?.name ?? "Sede principal"}`}
        />
        {view === "geral" ? <GeneralSettings business={business} terminal={terminal} /> : null}
        {view === "dispositivos" ? (
          <DeviceSettings business={business} terminal={terminal} />
        ) : null}
        {view === "impressora" ? <PrinterSettings terminal={terminal} /> : null}
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
      <PosSettingsNavigation active="pagamentos" />
      <section className="pos-settings-main">
        <PosSettingsResult result={result} />
        <SettingsHeader
          eyebrow="Métodos de pagamento"
          title="Configuração de pagamentos"
          body="Estado dos canais aceites no terminal VUYELA"
        />
        <nav aria-label="Métodos de pagamento" className="pos-payment-tabs">
          {paymentNavigation.map((item) => {
            const TabIcon = item.icon;
            return (
              <Link
                aria-current={item.id === method ? "page" : undefined}
                className={item.id === method ? "is-active" : undefined}
                href={`/pos/definicoes/pagamentos?metodo=${item.id}`}
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
            title={config.label}
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
                  Quando forem disponibilizadas, as credenciais serão guardadas exclusivamente no
                  servidor e nunca serão enviadas para este navegador.
                </p>
              </div>
            )}
          </SettingsCard>
        </div>

        <SettingsCard title="Disponibilidade no POS" icon={<CheckCircle2 size={20} />}>
          <div className="pos-setting-row">
            <div>
              <strong>Apresentar {config.label}</strong>
              <p>
                {enabled
                  ? "Disponível com confirmação manual na etapa de autorização."
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
              <Link className="pos-settings-button pos-settings-button--secondary" href="/pos">
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
      </section>
    </div>
  );
}

function PosSettingsNavigation({
  active,
  terminalId
}: {
  active: PosSettingsViewId | "pagamentos";
  terminalId?: string;
}) {
  return (
    <aside className="pos-settings-nav">
      <div>
        <span>CONFIGURAÇÃO</span>
        <strong>Terminal POS</strong>
      </div>
      <nav aria-label="Definições do terminal">
        {settingsNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              aria-current={active === item.id ? "page" : undefined}
              className={active === item.id ? "is-active" : undefined}
              href={`/pos/definicoes?vista=${item.id}${terminalId ? `&terminal=${terminalId}` : ""}`}
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
          href="/pos/definicoes/pagamentos"
        >
          <WalletCards aria-hidden="true" size={18} />
          Pagamentos
        </Link>
      </nav>
      <Link className="pos-settings-nav__back" href="/pos">
        Voltar ao POS
      </Link>
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
    <div className="pos-settings-grid">
      <SettingsCard title="Identificação do terminal" icon={<Store size={20} />}>
        <dl className="pos-settings-facts">
          <Fact label="Negócio" value={business.name} />
          <Fact label="Filial" value={branch?.name ?? "Não selecionada"} />
          <Fact label="Terminal" value={terminal?.name ?? "Não registado"} />
          <Fact label="Código" value={terminal?.code ?? "-"} />
          <Fact label="Estado" value={terminalStatusLabel(terminal?.status)} />
        </dl>
      </SettingsCard>
      <SettingsCard title="Localização e formato" icon={<Languages size={20} />}>
        <dl className="pos-settings-facts">
          <Fact label="Idioma" value={terminal?.settings.locale ?? "pt-MZ"} />
          <Fact label="Moeda" value={`${terminal?.settings.currency ?? "MZN"} · Metical`} />
          <Fact label="Fuso horário" value={terminal?.settings.timezone ?? "Africa/Maputo"} />
          <Fact label="Formato de data" value="DD/MM/AAAA" />
        </dl>
      </SettingsCard>
      <SettingsCard
        className="pos-settings-span"
        title="Terminais do negócio"
        icon={<MonitorSmartphone size={20} />}
      >
        <div className="pos-terminal-list">
          {business.terminals.map((item) => (
            <div className={item.id === terminal?.id ? "is-active" : undefined} key={item.id}>
              <Link href={`/pos/definicoes?vista=geral&terminal=${item.id}`}>
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
      {terminal ? (
        <SettingsCard
          className="pos-settings-span"
          title="Comportamento da caixa"
          icon={<ReceiptText size={20} />}
        >
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
                Guardar definições
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
    <div className="pos-settings-grid">
      {terminal.devices.map((device) => (
        <SettingsCard title={device.label} icon={<MonitorSmartphone size={22} />} key={device.id}>
          <p className="pos-settings-copy">
            {deviceTypeLabel(device.type)} · {device.deviceReference}
          </p>
          <span
            className={`pos-config-status pos-config-status--${device.status === "active" ? "success" : "muted"}`}
          >
            {deviceStatusLabel(device.status)}
          </span>
          {business.canManage ? (
            <DeviceStateActions businessId={business.id} device={device} terminalId={terminal.id} />
          ) : null}
        </SettingsCard>
      ))}
      {terminal.devices.length === 0 ? (
        <DeviceCard
          icon={<MonitorSmartphone size={22} />}
          name="Sem dispositivos"
          detail="Registe um dispositivo para este terminal."
          status="Por configurar"
          muted
        />
      ) : null}
      {business.canManage ? (
        <DeviceCreateForm businessId={business.id} terminalId={terminal.id} />
      ) : null}
      <SettingsCard
        className="pos-settings-span"
        title="Política dos dispositivos"
        icon={<ShieldCheck size={20} />}
      >
        <SettingsRows
          rows={[
            ["Acesso à câmara", "Apenas durante a leitura do QR Code"],
            ["Dados guardados localmente", "Nenhum dado sensível"],
            ["Tempo limite da sessão", "Controlado pela autenticação segura"]
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function PrinterSettings({ terminal }: { terminal?: PosTerminalContext }) {
  const printer = terminal?.devices.find(
    (device) => device.type === "printer" && device.status === "active"
  );
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Impressora de recibos" icon={<Printer size={20} />}>
        <div className="pos-settings-callout pos-settings-callout--muted">
          <Printer size={24} />
          <div>
            <strong>{printer ? printer.label : "Impressora não ligada"}</strong>
            <p>
              {printer
                ? "Dispositivo ativo neste terminal."
                : "O comprovativo digital continua sempre disponível."}
            </p>
          </div>
        </div>
        <dl className="pos-settings-facts">
          <Fact label="Tipo recomendado" value="Térmica ESC/POS" />
          <Fact label="Largura" value="80 mm" />
          <Fact label="Ligação" value="USB, Bluetooth ou rede" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Conteúdo do comprovativo" icon={<ReceiptText size={20} />}>
        <SettingsRows
          rows={[
            ["Logótipo VUYELA", "Visível no cabeçalho"],
            ["YELAS ganhas e usados", "Detalhados por transação"],
            ["Referência anti-duplicação", "Visível para auditoria"],
            ["Contacto do negócio", "Obtido do perfil da filial"]
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function NetworkSettings({ terminal }: { terminal?: PosTerminalContext }) {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Estado da ligação" icon={<Wifi size={20} />}>
        <div className="pos-network-status pos-network-status--muted">
          <span />
          <div>
            <strong>
              {terminal?.status === "active" ? "Terminal ativo" : "Terminal indisponível"}
            </strong>
            <p>
              {terminal?.lastSeenAt
                ? `Última atividade: ${formatDateTime(terminal.lastSeenAt)}`
                : "A atividade será registada na primeira transação."}
            </p>
          </div>
        </div>
        <dl className="pos-settings-facts">
          <Fact label="Canal" value="HTTPS cifrado" />
          <Fact label="Região" value="Automática" />
          <Fact label="Sincronização" value="Por verificar" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Requisitos de rede" icon={<Router size={20} />}>
        <SettingsRows
          rows={[
            ["Ligação principal", "Wi-Fi ou Ethernet"],
            ["Protocolo", "TLS obrigatório"],
            ["Operação offline", "Não permitida para saldos"],
            ["Retoma", "Nova consulta ao servidor"]
          ]}
        />
      </SettingsCard>
      <SettingsCard
        className="pos-settings-span"
        title="Proteção contra falhas"
        icon={<EthernetPort size={20} />}
      >
        <p className="pos-settings-copy">
          Uma transação só é concluída depois da confirmação do servidor. A chave de idempotência
          impede o registo duplicado quando a ligação é interrompida.
        </p>
      </SettingsCard>
    </div>
  );
}

function UserSettings({ roles }: { roles: string[] }) {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Operador atual" icon={<UserCog size={20} />}>
        <div className="pos-user-card">
          <span>VY</span>
          <div>
            <strong>Operador autenticado</strong>
            <p>{roles.join(" · ") || "Operador POS"}</p>
          </div>
          <span className="pos-config-status pos-config-status--success">Ativo</span>
        </div>
        <dl className="pos-settings-facts">
          <Fact label="Autenticação" value="Conta VUYELA" />
          <Fact label="Filiais" value="Conforme associação ativa" />
          <Fact label="Permissões" value="Validadas em cada operação" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Gestão da equipa" icon={<UsersRound size={20} />}>
        <p className="pos-settings-copy">
          A criação, suspensão e atribuição de filiais é feita na gestão do negócio para manter uma
          única fonte de permissões.
        </p>
        <Link className="pos-settings-button" href="/negocio">
          Abrir gestão do negócio
        </Link>
      </SettingsCard>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Sessão e acesso" icon={<Fingerprint size={20} />}>
        <SettingsRows
          rows={[
            ["Sessão autenticada", "Obrigatória"],
            ["MFA para ações privilegiadas", "Ativo"],
            ["Bloqueio por inatividade", "Gerido pela plataforma"],
            ["Terminar sessão", "Disponível no cabeçalho"]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Proteção das transações" icon={<KeyRound size={20} />}>
        <SettingsRows
          rows={[
            ["Cálculo de YELAS", "Servidor"],
            ["Alteração de saldo", "RPC transacional"],
            ["Registo no ledger", "Obrigatório"],
            ["Proteção anti-duplicação", "Chave única por transação"]
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

function DeviceCard({
  icon,
  name,
  detail,
  status,
  muted = false
}: {
  icon: ReactNode;
  name: string;
  detail: string;
  status: string;
  muted?: boolean;
}) {
  return (
    <SettingsCard title={name} icon={icon}>
      <p className="pos-settings-copy">{detail}</p>
      <span className={`pos-config-status pos-config-status--${muted ? "muted" : "success"}`}>
        {status}
      </span>
    </SettingsCard>
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
      <Link href="/pos">Voltar ao POS</Link>
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
