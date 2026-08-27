import Link from "next/link";
import { Bluetooth, Camera, Check, CircleX, Plus, Printer, QrCode, Wifi } from "lucide-react";

import type {
  PosBusinessContext,
  PosContextState,
  PosDeviceContext,
  PosTerminalContext
} from "./data";
import type { PosSettingsViewId } from "./pos-settings";
import { PosSettingsNavigation } from "./pos-settings-navigation";
import {
  Field,
  MobileBreadcrumb,
  ResultMessage,
  SaveButton,
  SelectField,
  settingBoolean,
  settingNumber,
  settingSection,
  settingString,
  SettingsCard,
  SettingsHeader,
  SettingsUnavailable,
  StatusBadge,
  SwitchField
} from "./pos-settings-ui";
import { managePosTerminalDeviceAction, updatePosTerminalSectionAction } from "./settings-actions";

const pageTitles: Record<PosSettingsViewId, string> = {
  geral: "Definições Gerais",
  dispositivos: "Dispositivos Conectados",
  impressora: "Impressoras",
  rede: "Rede e Conectividade",
  utilizadores: "Gestão de Utilizadores",
  seguranca: "Segurança e Acesso"
};

const breadcrumbLabels: Record<PosSettingsViewId, string> = {
  geral: "Geral",
  dispositivos: "Dispositivos",
  impressora: "Impressora",
  rede: "Rede",
  utilizadores: "Utilizadores",
  seguranca: "Segurança"
};

export function PosTerminalSettingsScreen({
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
  if (context.status !== "ready") return <SettingsUnavailable message={context.message} />;

  const business = context.businesses[0];
  const terminal =
    business?.terminals.find((item) => item.id === terminalId) ??
    business?.terminals.find((item) => item.status === "active") ??
    business?.terminals[0];

  if (!business || !terminal) {
    return <SettingsUnavailable message="Registe um terminal para configurar o POS." />;
  }

  return (
    <div className="pos-figma-settings-layout">
      <PosSettingsNavigation terminalId={terminal.id} view={view} />
      <main className="pos-figma-settings-main">
        <MobileBreadcrumb label={breadcrumbLabels[view]} />
        <ResultMessage result={result} />
        <SettingsHeader eyebrow="Definições do sistema" title={pageTitles[view]} />
        {view === "geral" ? <GeneralSettings business={business} terminal={terminal} /> : null}
        {view === "dispositivos" ? (
          <DeviceSettings business={business} terminal={terminal} />
        ) : null}
        {view === "impressora" ? <PrinterSettings business={business} terminal={terminal} /> : null}
        {view === "rede" ? <NetworkSettings business={business} terminal={terminal} /> : null}
        {view === "utilizadores" ? <UserSettings business={business} /> : null}
        {view === "seguranca" ? <SecuritySettings business={business} terminal={terminal} /> : null}
      </main>
    </div>
  );
}

function GeneralSettings({
  business,
  terminal
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
}) {
  const branch = business.branches.find((item) => item.id === terminal.branchId);
  const settings = settingSection(terminal.settings.configuration, "general");

  return (
    <form action={updatePosTerminalSectionAction} className="pos-figma-settings-form">
      <FormIdentity business={business} section="general" terminal={terminal} view="geral" />
      <SettingsCard
        description="Atualize os dados principais do seu estabelecimento."
        title="Informações do Negócio"
      >
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field defaultValue={business.name} label="Nome da Empresa" readOnly />
          <Field defaultValue={business.nuit ?? "Por configurar"} label="NIF / NUIT" readOnly />
          <Field
            defaultValue={
              branch?.addressLine
                ? `${branch.addressLine}, ${branch.city}`
                : (branch?.city ?? "Por configurar")
            }
            label="Endereço"
            readOnly
          />
          <Field
            defaultValue={branch?.phone ?? business.phone ?? "Por configurar"}
            label="Telefone"
            readOnly
          />
        </div>
        {business.canManage ? (
          <Link className="pos-figma-secondary-action" href="/negocio/definicoes">
            Editar informações
          </Link>
        ) : null}
      </SettingsCard>

      <SettingsCard
        description="Defina as configurações regionais para transações."
        title="Moeda e Região"
      >
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField defaultValue="MZN" disabled label="Moeda Padrão">
            <option value="MZN">MZN - Metical Moçambicano</option>
          </SelectField>
          <SelectField
            defaultValue={settingString(settings, "timezone", terminal.settings.timezone)}
            label="Fuso Horário"
            name="timezone"
          >
            <option value="Africa/Maputo">África/Maputo (CAT)</option>
          </SelectField>
          <SelectField
            defaultValue={settingString(settings, "dateFormat", "DD/MM/AAAA")}
            label="Formato de Data"
            name="dateFormat"
          >
            <option value="DD/MM/AAAA">DD/MM/AAAA</option>
            <option value="AAAA-MM-DD">AAAA-MM-DD</option>
          </SelectField>
          <SelectField
            defaultValue={settingString(settings, "locale", terminal.settings.locale)}
            label="Idioma do Sistema"
            name="locale"
          >
            <option value="pt-MZ">Português</option>
            <option value="en-MZ">English</option>
          </SelectField>
        </div>
      </SettingsCard>

      <SettingsCard
        description="Configure o layout e mensagens impressas no recibo."
        title="Personalização do Recibo"
      >
        <label className="pos-figma-logo-control">
          <input
            defaultChecked={settingBoolean(settings, "receiptLogoEnabled", true)}
            name="receiptLogoEnabled"
            type="checkbox"
          />
          <span>
            <QrCode aria-hidden="true" size={20} /> Logótipo
          </span>
          <strong>Logótipo nos recibos</strong>
          <small>PNG, JPG. Máx.: 2MB (Recomendado 200x200px)</small>
        </label>
        <div className="pos-figma-grid">
          <Field
            defaultValue={settingString(settings, "thankYouMessage", "Obrigado pela preferência!")}
            label="Mensagem Personalizada de Agradecimento"
            maxLength={160}
            name="thankYouMessage"
          />
          <Field
            defaultValue={settingString(
              settings,
              "receiptFooter",
              "Contribuinte Isento de IVA nos termos do Artigo 9 do CIVA"
            )}
            label="Rodapé do Recibo"
            maxLength={240}
            name="receiptFooter"
          />
        </div>
      </SettingsCard>
      {business.canManage ? <SaveButton /> : null}
    </form>
  );
}

function DeviceSettings({
  business,
  terminal
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
}) {
  const settings = settingSection(terminal.settings.configuration, "devices");
  const scanners = terminal.devices.filter(
    (device) => device.type === "camera" || device.type === "other"
  );

  return (
    <div className="pos-figma-page-stack">
      <section className="pos-figma-list-section">
        <header className="pos-figma-section-heading">
          <div>
            <h2>Scanners de Código</h2>
            <p>Gerencie os leitores emparelhados neste terminal.</p>
          </div>
          {business.canManage ? (
            <DeviceCreator business={business} terminal={terminal} type="camera" />
          ) : null}
        </header>
        <div className="pos-figma-device-list">
          {scanners.map((device) => (
            <DeviceRow business={business} device={device} key={device.id} terminal={terminal} />
          ))}
          <article className="pos-figma-device-row">
            <span className="pos-figma-device-icon">
              <Camera aria-hidden="true" size={20} />
            </span>
            <div>
              <strong>Câmara integrada</strong>
              <small>Scanner através da câmara do dispositivo</small>
            </div>
            <StatusBadge>Ativo</StatusBadge>
          </article>
        </div>
      </section>

      <form action={updatePosTerminalSectionAction} className="pos-figma-settings-form">
        <FormIdentity
          business={business}
          section="devices"
          terminal={terminal}
          view="dispositivos"
        />
        <section className="pos-figma-list-section">
          <header className="pos-figma-section-heading">
            <div>
              <h2>Tipos de Código Suportados</h2>
              <p>Ative ou desative formatos específicos de leitura.</p>
            </div>
          </header>
          <div className="pos-figma-toggle-grid">
            <SwitchField
              defaultChecked={settingBoolean(settings, "qrCode", true)}
              label="QR Code"
              name="qrCode"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "ean13", true)}
              label="EAN-13"
              name="ean13"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "code128", true)}
              label="Code 128"
              name="code128"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "pdf417", true)}
              label="PDF417"
              name="pdf417"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "dataMatrix", true)}
              label="DataMatrix"
              name="dataMatrix"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "aztec", false)}
              label="Aztec"
              name="aztec"
            />
          </div>
        </section>
        <SettingsCard title="Configurações de Leitura">
          <div className="pos-figma-grid pos-figma-grid--two">
            <label className="pos-figma-range-field">
              <span>
                Sensibilidade do scanner <b>{settingNumber(settings, "scannerSensitivity", 75)}%</b>
              </span>
              <input
                defaultValue={settingNumber(settings, "scannerSensitivity", 75)}
                max="100"
                min="1"
                name="scannerSensitivity"
                type="range"
              />
            </label>
            <SelectField
              defaultValue={String(settingNumber(settings, "readTimeoutSeconds", 5))}
              label="Tempo limite de leitura"
              name="readTimeoutSeconds"
            >
              <option value="3">3 segundos</option>
              <option value="5">5 segundos</option>
              <option value="10">10 segundos</option>
            </SelectField>
          </div>
          <div className="pos-figma-toggle-grid">
            <SwitchField
              defaultChecked={settingBoolean(settings, "soundConfirmation", true)}
              description="Beep sonoro ao validar código"
              label="Som de confirmação"
              name="soundConfirmation"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "vibration", true)}
              description="Feedback tátil no terminal"
              label="Vibração ao ler"
              name="vibration"
            />
            <SwitchField
              defaultChecked={settingBoolean(settings, "continuousReading", false)}
              description="Manter câmara ativa após ler"
              label="Leitura contínua"
              name="continuousReading"
            />
          </div>
        </SettingsCard>
        {business.canManage ? <SaveButton /> : null}
      </form>
    </div>
  );
}

function PrinterSettings({
  business,
  terminal
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
}) {
  const settings = settingSection(terminal.settings.configuration, "printer");
  const printers = terminal.devices.filter((device) => device.type === "printer");
  return (
    <div className="pos-figma-page-stack">
      <section className="pos-figma-list-section">
        <header className="pos-figma-section-heading">
          <div>
            <h2>Impressoras Configuradas</h2>
            <p>Gerencie as impressoras associadas a este terminal.</p>
          </div>
          {business.canManage ? (
            <DeviceCreator business={business} terminal={terminal} type="printer" />
          ) : null}
        </header>
        <div className="pos-figma-device-list">
          {printers.length ? (
            printers.map((device) => (
              <DeviceRow business={business} device={device} key={device.id} terminal={terminal} />
            ))
          ) : (
            <p className="pos-figma-empty">Ainda não existem impressoras configuradas.</p>
          )}
        </div>
      </section>
      <form action={updatePosTerminalSectionAction} className="pos-figma-settings-form">
        <FormIdentity business={business} section="printer" terminal={terminal} view="impressora" />
        <SettingsCard
          description="Ajustes de comportamento e formato do papel."
          title="Configurações de Impressão"
        >
          <div className="pos-figma-grid pos-figma-grid--three">
            <SelectField
              defaultValue={settingString(settings, "paperWidth", "80mm")}
              label="Largura do Papel"
              name="paperWidth"
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
            </SelectField>
            <SelectField
              defaultValue={String(settingNumber(settings, "receiptCopies", 1))}
              label="Cópias por Recibo"
              name="receiptCopies"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </SelectField>
            <SelectField
              defaultValue={settingString(settings, "fontSize", "normal")}
              label="Tamanho da Fonte"
              name="fontSize"
            >
              <option value="small">Pequena</option>
              <option value="normal">Normal</option>
              <option value="large">Grande</option>
            </SelectField>
          </div>
          <SwitchField
            defaultChecked={settingBoolean(
              settings,
              "printAutomatically",
              terminal.settings.printReceiptAutomatically
            )}
            description="Imprimir recibo imediatamente após o pagamento."
            label="Imprimir automaticamente"
            name="printAutomatically"
          />
          <SwitchField
            defaultChecked={settingBoolean(settings, "printLogo", true)}
            description="Inclui a imagem do logótipo no topo de todos os talões."
            label="Imprimir logótipo no cabeçalho"
            name="printLogo"
          />
        </SettingsCard>
        {business.canManage ? <SaveButton /> : null}
      </form>
    </div>
  );
}

function NetworkSettings({
  business,
  terminal
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
}) {
  const settings = settingSection(terminal.settings.configuration, "network");
  const connected = terminal.status === "active";
  return (
    <form action={updatePosTerminalSectionAction} className="pos-figma-settings-form">
      <FormIdentity business={business} section="network" terminal={terminal} view="rede" />
      <SettingsCard
        description="Verifique a integridade da ligação de rede."
        title="Estado da Conexão"
      >
        <div className="pos-figma-network-overview">
          <div>
            <Wifi aria-hidden="true" size={32} />
            <strong>{connected ? "Conectado à Internet" : "Ligação indisponível"}</strong>
            <StatusBadge tone={connected ? "success" : "danger"}>
              {connected ? "Ligação estável" : "Sem ligação"}
            </StatusBadge>
          </div>
          <dl>
            <div>
              <dt>Terminal</dt>
              <dd>{terminal.code}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{connected ? "Online" : "Offline"}</dd>
            </div>
            <div>
              <dt>Última atividade</dt>
              <dd>{terminal.lastSeenAt ? formatDateTime(terminal.lastSeenAt) : "Sem registo"}</dd>
            </div>
            <div>
              <dt>Sincronização</dt>
              <dd>Protegida</dd>
            </div>
          </dl>
        </div>
      </SettingsCard>
      <SettingsCard
        description="Garanta as vendas mesmo em caso de falha de conexão."
        title="Modo Offline"
      >
        <div className="pos-figma-info-row">
          <div>
            <strong>Operação Offline Contínua</strong>
            <p>
              As transações são guardadas localmente e enviadas à nuvem assim que a internet
              regressar.
            </p>
          </div>
          <StatusBadge tone="muted">0 transações pendentes</StatusBadge>
        </div>
        <SwitchField
          defaultChecked={settingBoolean(settings, "allowOfflineSales", false)}
          description="O terminal continuará a aceitar apenas pagamentos em numerário."
          label="Permitir vendas sem internet"
          name="allowOfflineSales"
        />
      </SettingsCard>
      <SettingsCard
        description="Frequência de comunicação com a base central."
        title="Sincronização de Dados"
      >
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={String(settingNumber(settings, "syncIntervalMinutes", 5))}
            label="Intervalo de Auto-Sincronização"
            name="syncIntervalMinutes"
          >
            <option value="1">1 minuto</option>
            <option value="5">5 minutos</option>
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
          </SelectField>
          <Field
            defaultValue={
              terminal.lastSeenAt ? formatDateTime(terminal.lastSeenAt) : "Ainda não sincronizado"
            }
            label="Última Sincronização"
            readOnly
          />
        </div>
      </SettingsCard>
      <SettingsCard
        description="Servidor de destino para chamadas e autenticação."
        title="Servidor API"
      >
        <Field
          defaultValue={settingString(settings, "apiBaseUrl", "https://api.vuyela.co.mz/v2")}
          label="URL do Servidor API"
          name="apiBaseUrl"
          type="url"
        />
        <div className="pos-figma-inline-status">
          <StatusBadge>Operacional</StatusBadge>
          <button
            disabled
            title="O diagnóstico remoto será ativado com o serviço de monitorização."
            type="button"
          >
            Testar conexão
          </button>
        </div>
      </SettingsCard>
      {business.canManage ? <SaveButton /> : null}
    </form>
  );
}

function UserSettings({ business }: { business: PosBusinessContext }) {
  const permissions = [
    "Efetuar Transações",
    "Configurações Globais",
    "Visualizar Relatórios",
    "Gerir Utilizadores",
    "Autorizar Reembolsos"
  ];
  return (
    <div className="pos-figma-page-stack">
      <section className="pos-figma-list-section">
        <header className="pos-figma-section-heading">
          <div>
            <h2>Utilizadores Registados</h2>
            <p>Colaboradores com acesso a este terminal de vendas.</p>
          </div>
          {business.canManage ? (
            <Link className="pos-figma-primary-action" href="/negocio?vista=equipa">
              <Plus aria-hidden="true" size={16} /> Adicionar utilizador
            </Link>
          ) : null}
        </header>
        <div className="pos-figma-user-list">
          {business.roleLabels.map((role) => (
            <article key={role}>
              <div>
                <strong>{role}</strong>
                <small>Acesso atribuído à sua conta</small>
              </div>
              <StatusBadge>Ativo</StatusBadge>
              {business.canManage ? <Link href="/negocio?vista=equipa">Editar</Link> : null}
            </article>
          ))}
        </div>
      </section>
      <section className="pos-figma-list-section">
        <header className="pos-figma-section-heading">
          <div>
            <h2>Permissões por Função</h2>
            <p>Verifique os privilégios pré-configurados.</p>
          </div>
        </header>
        <div className="pos-figma-role-grid">
          <RoleCard label="Administrador" permissions={permissions} />
          <RoleCard
            label="Operador"
            permissions={permissions.filter(
              (item) => item === "Efetuar Transações" || item === "Visualizar Relatórios"
            )}
            allPermissions={permissions}
            limited
          />
        </div>
      </section>
    </div>
  );
}

function SecuritySettings({
  business,
  terminal
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
}) {
  const settings = settingSection(terminal.settings.configuration, "security");
  return (
    <form action={updatePosTerminalSectionAction} className="pos-figma-settings-form">
      <FormIdentity business={business} section="security" terminal={terminal} view="seguranca" />
      <SettingsCard
        description="Gerencie as políticas de login e segurança."
        title="Autenticação e Bloqueio"
      >
        <SwitchField
          defaultChecked={settingBoolean(settings, "requireQuickAccessPin", true)}
          description="Solicita um PIN de 4 dígitos para reativar o terminal após períodos de inatividade."
          label="Exigir PIN para acesso rápido"
          name="requireQuickAccessPin"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={String(
              settingNumber(
                settings,
                "inactivityTimeoutMinutes",
                terminal.settings.inactivityTimeoutMinutes
              )
            )}
            label="Bloqueio Automático após inatividade"
            name="inactivityTimeoutMinutes"
          >
            <option value="5">5 minutos</option>
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="60">60 minutos</option>
          </SelectField>
          <SelectField
            defaultValue={String(settingNumber(settings, "forcePinChangeDays", 90))}
            label="Forçar alteração de PIN"
            name="forcePinChangeDays"
          >
            <option value="30">Cada 30 dias</option>
            <option value="90">Cada 90 dias</option>
            <option value="180">Cada 180 dias</option>
          </SelectField>
        </div>
      </SettingsCard>
      <SettingsCard
        description="Garanta que os dados de vendas estão seguros."
        title="Cópia de Segurança (Backup)"
      >
        <SwitchField
          defaultChecked={settingBoolean(settings, "automaticCloudBackup", true)}
          description="Assegura a transmissão diária das faturas para os servidores seguros."
          label="Backup em Nuvem Automático"
          name="automaticCloudBackup"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={settingString(settings, "backupFrequency", "daily")}
            label="Frequência dos Backups"
            name="backupFrequency"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
          </SelectField>
          <Field
            defaultValue="Gerido pela infraestrutura VUYELA"
            label="Último Backup Bem Sucedido"
            readOnly
          />
        </div>
        <div className="pos-figma-storage">
          <span>Armazenamento Utilizado</span>
          <strong>Gerido automaticamente</strong>
          <i>
            <b />
          </i>
        </div>
      </SettingsCard>
      <SettingsCard
        description="Histórico recente de ações críticas do terminal."
        title="Registo de Atividade"
      >
        <div className="pos-figma-activity-list">
          <div>
            <strong>Estado do terminal</strong>
            <span>{terminal.status === "active" ? "Ativo e autorizado" : terminal.status}</span>
          </div>
          <div>
            <strong>Última ligação</strong>
            <span>
              {terminal.lastSeenAt ? formatDateTime(terminal.lastSeenAt) : "Ainda sem atividade"}
            </span>
          </div>
          <div>
            <strong>Identificador</strong>
            <span>{terminal.code}</span>
          </div>
        </div>
        <Link className="pos-figma-text-link" href="/negocio?vista=transacoes">
          Ver registo de atividade completo →
        </Link>
      </SettingsCard>
      {business.canManage ? <SaveButton /> : null}
    </form>
  );
}

function FormIdentity({
  business,
  terminal,
  section,
  view
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
  section: string;
  view: PosSettingsViewId;
}) {
  return (
    <>
      <input name="businessId" type="hidden" value={business.id} />
      <input name="terminalId" type="hidden" value={terminal.id} />
      <input name="section" type="hidden" value={section} />
      <input name="view" type="hidden" value={view} />
    </>
  );
}

function DeviceCreator({
  business,
  terminal,
  type
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
  type: "camera" | "printer";
}) {
  return (
    <details className="pos-figma-add-device">
      <summary>
        <Plus aria-hidden="true" size={16} /> Adicionar{" "}
        {type === "printer" ? "impressora" : "dispositivo"}
      </summary>
      <form action={managePosTerminalDeviceAction}>
        <input name="businessId" type="hidden" value={business.id} />
        <input name="terminalId" type="hidden" value={terminal.id} />
        <input name="operation" type="hidden" value="create" />
        <input name="deviceType" type="hidden" value={type} />
        <Field label="Nome" name="label" required />
        <Field label="Referência do dispositivo" minLength={8} name="deviceReference" required />
        <button className="pos-figma-primary-action" type="submit">
          Adicionar
        </button>
      </form>
    </details>
  );
}

function DeviceRow({
  business,
  terminal,
  device
}: {
  business: PosBusinessContext;
  terminal: PosTerminalContext;
  device: PosDeviceContext;
}) {
  const Icon = device.type === "printer" ? Printer : Bluetooth;
  return (
    <article className="pos-figma-device-row">
      <span className="pos-figma-device-icon">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div>
        <strong>{device.label}</strong>
        <small>{device.deviceReference}</small>
      </div>
      <StatusBadge
        tone={
          device.status === "active"
            ? "success"
            : device.status === "revoked"
              ? "danger"
              : "warning"
        }
      >
        {device.status === "active"
          ? "Conectado"
          : device.status === "revoked"
            ? "Desconectado"
            : "Pendente"}
      </StatusBadge>
      {business.canManage ? (
        <form action={managePosTerminalDeviceAction}>
          <input name="businessId" type="hidden" value={business.id} />
          <input name="terminalId" type="hidden" value={terminal.id} />
          <input name="deviceId" type="hidden" value={device.id} />
          <input name="deviceType" type="hidden" value={device.type} />
          <input name="label" type="hidden" value={device.label} />
          <input
            name="operation"
            type="hidden"
            value={device.status === "active" ? "revoke" : "activate"}
          />
          <button className={device.status === "active" ? "is-danger" : ""} type="submit">
            {device.status === "active" ? "Desconectar" : "Ativar"}
          </button>
        </form>
      ) : null}
    </article>
  );
}

function RoleCard({
  label,
  permissions,
  allPermissions = permissions,
  limited = false
}: {
  label: string;
  permissions: string[];
  allPermissions?: string[];
  limited?: boolean;
}) {
  return (
    <article>
      <header>
        <strong>{label}</strong>
        <StatusBadge tone={limited ? "muted" : "success"}>
          {limited ? "Limitado" : "Total privileges"}
        </StatusBadge>
      </header>
      <ul>
        {allPermissions.map((permission) => {
          const enabled = permissions.includes(permission);
          return (
            <li className={enabled ? "" : "is-disabled"} key={permission}>
              {enabled ? (
                <Check aria-hidden="true" size={15} />
              ) : (
                <CircleX aria-hidden="true" size={15} />
              )}
              {permission}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Maputo"
  }).format(new Date(value));
}
