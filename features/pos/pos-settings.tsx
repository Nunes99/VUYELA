import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  EthernetPort,
  Fingerprint,
  Gauge,
  KeyRound,
  Languages,
  LockKeyhole,
  MonitorSmartphone,
  Network,
  Printer,
  ReceiptText,
  Router,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  UserCog,
  UsersRound,
  WalletCards,
  Wifi
} from "lucide-react";
import type { ReactNode } from "react";

import type { PosContextState } from "./data";

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
  view
}: {
  context: PosContextState;
  view: PosSettingsViewId;
}) {
  if (context.status !== "ready") {
    return <PosSettingsNotice message={context.message} />;
  }

  const business = context.businesses[0];
  const branch = business?.branches.find((item) => item.id === business.defaultBranchId);

  return (
    <div className="pos-settings-layout">
      <PosSettingsNavigation active={view} />
      <section className="pos-settings-main">
        <SettingsHeader
          eyebrow="Definições do terminal"
          title={settingsNavigation.find((item) => item.id === view)?.label ?? "Geral"}
          body={`${business?.name ?? "Negócio VUYELA"} · ${branch?.name ?? "Sede principal"}`}
        />
        {view === "geral" ? (
          <GeneralSettings
            businessName={business?.name ?? "VUYELA"}
            branchName={branch?.name ?? "Sede"}
          />
        ) : null}
        {view === "dispositivos" ? <DeviceSettings /> : null}
        {view === "impressora" ? <PrinterSettings /> : null}
        {view === "rede" ? <NetworkSettings /> : null}
        {view === "utilizadores" ? <UserSettings roles={business?.roleLabels ?? []} /> : null}
        {view === "seguranca" ? <SecuritySettings /> : null}
      </section>
    </div>
  );
}

export function PosPaymentSettingsView({
  context,
  method
}: {
  context: PosContextState;
  method: PosPaymentViewId;
}) {
  if (context.status !== "ready") {
    return <PosSettingsNotice message={context.message} />;
  }

  const config = paymentConfig[method];
  const Icon = config.icon;

  return (
    <div className="pos-settings-layout">
      <PosSettingsNavigation active="pagamentos" />
      <section className="pos-settings-main">
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
              <span className={`pos-config-status pos-config-status--${config.statusTone}`}>
                {config.statusLabel}
              </span>
              <p>{config.description}</p>
            </div>
            <dl className="pos-settings-facts">
              <Fact label="Processamento" value={config.processing} />
              <Fact label="Moeda" value="Metical moçambicano (MZN)" />
              <Fact label="Confirmação" value={config.confirmation} />
            </dl>
          </SettingsCard>

          <SettingsCard title="Credenciais e segurança" icon={<LockKeyhole size={20} />}>
            {method === "dinheiro" ? (
              <div className="pos-settings-callout">
                <Banknote aria-hidden="true" size={22} />
                <div>
                  <strong>Sem credenciais externas</strong>
                  <p>O operador confirma o valor recebido antes de concluir a transação.</p>
                </div>
              </div>
            ) : (
              <div className="pos-secure-fields">
                <SecureField label={config.identifierLabel} value={config.identifierValue} />
                <SecureField label="Chave privada" value="••••••••••••••••" />
                <p>
                  As credenciais são cifradas e geridas exclusivamente no servidor. Nunca são
                  enviadas para este navegador.
                </p>
              </div>
            )}
          </SettingsCard>
        </div>

        <SettingsCard title="Disponibilidade no POS" icon={<CheckCircle2 size={20} />}>
          <div className="pos-setting-row">
            <div>
              <strong>Apresentar {config.label}</strong>
              <p>Este método aparece na etapa de autorização da transação.</p>
            </div>
            <span className="pos-readonly-toggle" aria-label={`${config.label} disponível`}>
              <span />
            </span>
          </div>
          <div className="pos-settings-actions">
            <Link className="pos-settings-button pos-settings-button--secondary" href="/pos">
              Testar no POS
            </Link>
            <Link className="pos-settings-button" href="/negocio/definicoes">
              Gerir integração segura
            </Link>
          </div>
        </SettingsCard>
      </section>
    </div>
  );
}

function PosSettingsNavigation({ active }: { active: PosSettingsViewId | "pagamentos" }) {
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
              href={`/pos/definicoes?vista=${item.id}`}
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
  businessName,
  branchName
}: {
  businessName: string;
  branchName: string;
}) {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Identificação do terminal" icon={<Store size={20} />}>
        <dl className="pos-settings-facts">
          <Fact label="Negócio" value={businessName} />
          <Fact label="Filial" value={branchName} />
          <Fact label="Terminal" value="VUYELA POS · Principal" />
          <Fact label="Estado" value="Online e operacional" tone="success" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Localização e formato" icon={<Languages size={20} />}>
        <dl className="pos-settings-facts">
          <Fact label="Idioma" value="Português (Moçambique)" />
          <Fact label="Moeda" value="MZN · Metical" />
          <Fact label="Fuso horário" value="África/Maputo" />
          <Fact label="Formato de data" value="DD/MM/AAAA" />
        </dl>
      </SettingsCard>
      <SettingsCard title="Comportamento da caixa" icon={<ReceiptText size={20} />}>
        <SettingsRows
          rows={[
            ["Pedir confirmação do cliente", "Obrigatório em todas as transações"],
            ["Imprimir comprovativo", "Apenas quando existe impressora ligada"],
            ["Iniciar nova transação", "Depois da confirmação do operador"]
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Pontos e saldo" icon={<Gauge size={20} />}>
        <SettingsRows
          rows={[
            ["Mostrar pontos disponíveis", "Depois da identificação do cliente"],
            ["Mostrar equivalente em MZN", "Sempre que houver saldo"],
            ["Cálculo de pontos", "Executado e validado no servidor"]
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function DeviceSettings() {
  return (
    <div className="pos-settings-grid">
      <DeviceCard
        icon={<MonitorSmartphone size={22} />}
        name="Este dispositivo"
        detail="Navegador seguro · Sessão atual"
        status="Ligado"
      />
      <DeviceCard
        icon={<Printer size={22} />}
        name="Impressora térmica"
        detail="Nenhuma impressora selecionada"
        status="Por configurar"
        muted
      />
      <DeviceCard
        icon={<CreditCard size={22} />}
        name="Terminal bancário"
        detail="Operação externa ao VUYELA"
        status="Disponível"
      />
      <DeviceCard
        icon={<Smartphone size={22} />}
        name="Câmara / QR Code"
        detail="Permissão solicitada apenas na leitura"
        status="Pronta"
      />
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

function PrinterSettings() {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Impressora de recibos" icon={<Printer size={20} />}>
        <div className="pos-settings-callout pos-settings-callout--muted">
          <Printer size={24} />
          <div>
            <strong>Impressora não ligada</strong>
            <p>O comprovativo digital continua sempre disponível.</p>
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
            ["Pontos ganhos e usados", "Detalhados por transação"],
            ["Referência anti-duplicação", "Visível para auditoria"],
            ["Contacto do negócio", "Obtido do perfil da filial"]
          ]}
        />
      </SettingsCard>
    </div>
  );
}

function NetworkSettings() {
  return (
    <div className="pos-settings-grid">
      <SettingsCard title="Estado da ligação" icon={<Wifi size={20} />}>
        <div className="pos-network-status">
          <span />
          <div>
            <strong>Ligação ativa</strong>
            <p>O terminal consegue validar operações no servidor.</p>
          </div>
        </div>
        <dl className="pos-settings-facts">
          <Fact label="Canal" value="HTTPS cifrado" />
          <Fact label="Região" value="Automática" />
          <Fact label="Sincronização" value="Em tempo real" />
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
            ["Cálculo de pontos", "Servidor"],
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
    statusLabel: string;
    statusTone: "success" | "muted";
    icon: typeof Smartphone;
  }
> = {
  mpesa: {
    label: "M-Pesa",
    description: "Pagamentos móveis Vodacom para o mercado moçambicano.",
    processing: "Confirmação no canal M-Pesa",
    confirmation: "Referência do provedor",
    identifierLabel: "Código do comerciante",
    identifierValue: "•••• 2048",
    statusLabel: "Disponível",
    statusTone: "success",
    icon: Smartphone
  },
  emola: {
    label: "e-Mola",
    description: "Carteira móvel Movitel integrada no fluxo do POS.",
    processing: "Confirmação no canal e-Mola",
    confirmation: "Referência do provedor",
    identifierLabel: "Conta comercial",
    identifierValue: "•••• 8170",
    statusLabel: "Disponível",
    statusTone: "success",
    icon: Smartphone
  },
  mkesh: {
    label: "mKesh",
    description: "Canal de pagamento móvel para clientes mKesh.",
    processing: "Confirmação no canal mKesh",
    confirmation: "Referência do provedor",
    identifierLabel: "Identificador comercial",
    identifierValue: "•••• 4632",
    statusLabel: "Disponível",
    statusTone: "success",
    icon: Smartphone
  },
  dinheiro: {
    label: "Dinheiro",
    description: "Registo de valores recebidos diretamente no balcão.",
    processing: "Confirmação pelo operador",
    confirmation: "Imediata no POS",
    identifierLabel: "Caixa",
    identifierValue: "Terminal principal",
    statusLabel: "Ativo",
    statusTone: "success",
    icon: Banknote
  },
  cartao: {
    label: "Cartão",
    description: "Pagamento processado num terminal bancário externo.",
    processing: "Terminal bancário do negócio",
    confirmation: "Confirmação pelo operador",
    identifierLabel: "Terminal",
    identifierValue: "•••• 9021",
    statusLabel: "Disponível",
    statusTone: "success",
    icon: CreditCard
  }
};
