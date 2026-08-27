import type { PosBusinessContext, PosContextState, PosPaymentChannelContext } from "./data";
import type { PosPaymentViewId } from "./pos-settings";
import { PosPaymentNavigation } from "./pos-settings-navigation";
import {
  Field,
  MobileBreadcrumb,
  ResultMessage,
  SaveButton,
  SelectField,
  settingBoolean,
  settingNumber,
  settingString,
  SettingsCard,
  SettingsHeader,
  SettingsUnavailable,
  StatusBadge,
  SwitchField
} from "./pos-settings-ui";
import { configurePosPaymentChannelAction } from "./settings-actions";

const methodConfig: Record<
  PosPaymentViewId,
  { label: string; databaseMethod: PosPaymentChannelContext["method"] }
> = {
  mpesa: { label: "M-Pesa", databaseMethod: "mpesa" },
  emola: { label: "e-Mola", databaseMethod: "emola" },
  mkesh: { label: "Mkesh", databaseMethod: "mkesh" },
  dinheiro: { label: "Dinheiro", databaseMethod: "cash" },
  cartao: { label: "Cartão", databaseMethod: "card" }
};

export function PosPaymentSettingsScreen({
  context,
  method,
  result
}: {
  context: PosContextState;
  method: PosPaymentViewId;
  result?: string;
}) {
  if (context.status !== "ready") return <SettingsUnavailable message={context.message} />;

  const business = context.businesses[0];
  const config = methodConfig[method];
  const branchId = business?.defaultBranchId;
  const channel = business?.paymentChannels.find(
    (item) =>
      item.method === config.databaseMethod &&
      (item.branchId === branchId || item.branchId === null)
  );

  if (!business || !channel) {
    return <SettingsUnavailable message="Este método ainda não foi provisionado para a filial." />;
  }

  return (
    <div className="pos-figma-settings-layout">
      <PosPaymentNavigation method={method} />
      <main className="pos-figma-settings-main pos-figma-settings-main--payment">
        <MobileBreadcrumb label={config.label} />
        <ResultMessage result={result} />
        <SettingsHeader eyebrow="Métodos de pagamento" title={`${config.label} — Configuração`} />
        <form action={configurePosPaymentChannelAction} className="pos-figma-settings-form">
          <PaymentFormIdentity business={business} channel={channel} />
          <fieldset disabled={!business.canManage}>
            {method === "mpesa" ? <MpesaSettings business={business} channel={channel} /> : null}
            {method === "emola" ? <EmolaSettings channel={channel} /> : null}
            {method === "mkesh" ? <MkeshSettings channel={channel} /> : null}
            {method === "dinheiro" ? <CashSettings channel={channel} /> : null}
            {method === "cartao" ? <CardSettings channel={channel} /> : null}
            {business.canManage ? <SaveButton /> : null}
          </fieldset>
        </form>
      </main>
    </div>
  );
}

function MpesaSettings({
  business,
  channel
}: {
  business: PosBusinessContext;
  channel: PosPaymentChannelContext;
}) {
  const settings = channel.publicSettings;
  return (
    <>
      <SettingsCard title="Credenciais da API">
        <div className="pos-figma-grid pos-figma-grid--two">
          <SecretField configured={channel.credentialsConfigured} label="API Key" name="apiKey" />
          <SecretField
            configured={channel.credentialsConfigured}
            label="API Secret"
            name="apiSecret"
          />
          <Field
            defaultValue={settingString(settings, "merchantId", "")}
            label="Merchant ID"
            maxLength={80}
            name="merchantId"
            required
          />
          <div className="pos-figma-environment-field">
            <SelectField
              defaultValue={settingString(settings, "environment", "production")}
              label="Ambiente"
              name="environment"
            >
              <option value="production">Produção</option>
              <option value="sandbox">Sandbox</option>
            </SelectField>
            <ChannelStatus channel={channel} />
            <button
              disabled
              title="Disponível após configuração do adaptador oficial M-Pesa."
              type="button"
            >
              Testar ligação
            </button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Configurações de Transação">
        <div className="pos-figma-grid pos-figma-grid--three">
          <MoneyField
            defaultValue={settingNumber(settings, "minimumAmount", 50)}
            label="Valor Mínimo"
            name="minimumAmount"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "maximumAmount", 150000)}
            label="Valor Máximo"
            name="maximumAmount"
          />
          <Field
            defaultValue={settingNumber(settings, "timeoutSeconds", 120)}
            label="Timeout de Pagamento (segundos)"
            max={600}
            min={30}
            name="timeoutSeconds"
            type="number"
          />
        </div>
        <SwitchField
          defaultChecked={settingBoolean(settings, "smsNotifications", true)}
          description="Enviar confirmação via SMS aos clientes"
          label="Notificações por SMS"
          name="smsNotifications"
        />
      </SettingsCard>
      <SettingsCard title="Número de Negócio & Códigos">
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field
            defaultValue={settingString(settings, "ussdShortcode", "*150*00#")}
            label="USSD Shortcode"
            maxLength={30}
            name="ussdShortcode"
          />
          <Field
            defaultValue={settingString(settings, "confirmationNumber", business.phone ?? "")}
            label="Número de Confirmação"
            maxLength={30}
            name="confirmationNumber"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Relatórios & Reconciliação">
        <SwitchField
          defaultChecked={settingBoolean(settings, "autoReconciliation", true)}
          description="Validar transações automaticamente com o extrato M-Pesa."
          label="Reconciliação Automática"
          name="autoReconciliation"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={settingString(settings, "reconciliationFrequency", "daily")}
            label="Frequência"
            name="reconciliationFrequency"
          >
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
          </SelectField>
          <Field
            defaultValue={settingString(settings, "reportEmail", business.email ?? "")}
            label="Email de Relatórios"
            name="reportEmail"
            type="email"
          />
        </div>
      </SettingsCard>
    </>
  );
}

function EmolaSettings({ channel }: { channel: PosPaymentChannelContext }) {
  const settings = channel.publicSettings;
  return (
    <>
      <SettingsCard title="Credenciais de Integração">
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field
            defaultValue={settingString(settings, "partnerCode", "")}
            label="Partner Code"
            maxLength={80}
            name="partnerCode"
            required
          />
          <SecretField
            configured={channel.credentialsConfigured}
            label="Token de Autenticação"
            name="integrationToken"
          />
          <Field
            className="pos-figma-field--wide"
            defaultValue={settingString(settings, "callbackUrl", "https://api.vuyela.co.mz/emola")}
            label="URL Callback"
            name="callbackUrl"
            required
            type="url"
          />
        </div>
        <ChannelStatus channel={channel} />
      </SettingsCard>
      <SettingsCard title="Limites Operacionais">
        <div className="pos-figma-grid pos-figma-grid--three">
          <MoneyField
            defaultValue={settingNumber(settings, "minimumAmount", 100)}
            label="Valor Mínimo por Transação"
            name="minimumAmount"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "maximumAmount", 100000)}
            label="Valor Máximo por Transação"
            name="maximumAmount"
          />
          <Field
            defaultValue={settingNumber(settings, "dailyTransactionLimit", 500)}
            label="Máximo de Transações Diárias"
            min={1}
            name="dailyTransactionLimit"
            type="number"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Alertas & Notificações">
        <SwitchField
          defaultChecked={settingBoolean(settings, "pushNotifications", false)}
          description="Enviar push em tempo real para o operador"
          label="Notificação Push"
          name="pushNotifications"
        />
        <SwitchField
          defaultChecked={settingBoolean(settings, "smsFallback", true)}
          description="Usar SMS em caso de falha de conexão de dados"
          label="SMS Fallback"
          name="smsFallback"
        />
        <Field
          defaultValue={settingString(settings, "supportEmail", "suporte@vuyela.co.mz")}
          label="Email de Suporte Interno"
          name="supportEmail"
          type="email"
        />
      </SettingsCard>
    </>
  );
}

function MkeshSettings({ channel }: { channel: PosPaymentChannelContext }) {
  const settings = channel.publicSettings;
  return (
    <>
      <SettingsCard title="Integração & Chaves de Segurança">
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field
            defaultValue={settingString(settings, "merchantId", "")}
            label="Merchant ID"
            maxLength={80}
            name="merchantId"
            required
          />
          <SecretField
            configured={channel.credentialsConfigured}
            label="Chave Pública (RSA)"
            name="rsaPublicKey"
          />
          <div className="pos-figma-environment-field pos-figma-field--wide">
            <SelectField
              defaultValue={settingString(settings, "environment", "sandbox")}
              label="Ambiente de Trabalho"
              name="environment"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Produção</option>
            </SelectField>
            <ChannelStatus channel={channel} />
            <button
              disabled
              title="Disponível após configuração do adaptador oficial mKesh."
              type="button"
            >
              Ativar Produção
            </button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Configuração de Pagamento QR">
        <SwitchField
          defaultChecked={settingBoolean(settings, "staticQrCode", true)}
          description="Mantém o mesmo QR para transações rápidas no caixa"
          label="Gerar QR Code Estático"
          name="staticQrCode"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={String(settingNumber(settings, "qrValidityMinutes", 30))}
            label="Validade do QR Dinâmico"
            name="qrValidityMinutes"
          >
            <option value="5">5 minutos</option>
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="60">60 minutos</option>
          </SelectField>
          <Field
            defaultValue={settingString(settings, "referencePrefix", "BRB-")}
            label="Prefixo de Referência"
            maxLength={12}
            name="referencePrefix"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Webhooks & Retentativas">
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field
            defaultValue={settingString(
              settings,
              "successUrl",
              "https://api.vuyela.co.mz/mkesh/success"
            )}
            label="URL de Sucesso"
            name="successUrl"
            type="url"
          />
          <Field
            defaultValue={settingString(
              settings,
              "failureUrl",
              "https://api.vuyela.co.mz/mkesh/fail"
            )}
            label="URL de Falha"
            name="failureUrl"
            type="url"
          />
        </div>
        <SwitchField
          defaultChecked={settingBoolean(settings, "automaticRetry", true)}
          description="Reenviar webhook em caso de timeout do servidor"
          label="Retry Automático"
          name="automaticRetry"
        />
        <SelectField
          defaultValue={String(settingNumber(settings, "maximumRetries", 3))}
          label="Máximo de Retentativas"
          name="maximumRetries"
        >
          <option value="0">Sem retentativas</option>
          <option value="1">1 tentativa</option>
          <option value="3">3 tentativas</option>
          <option value="5">5 tentativas</option>
        </SelectField>
      </SettingsCard>
    </>
  );
}

function CashSettings({ channel }: { channel: PosPaymentChannelContext }) {
  const settings = channel.publicSettings;
  return (
    <>
      <SettingsCard title="Parâmetros de Caixa Registadora">
        <div className="pos-figma-grid pos-figma-grid--two">
          <MoneyField
            defaultValue={settingNumber(settings, "initialFloat", 5000)}
            label="Fundo de Caixa Inicial"
            name="initialFloat"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "lowFundAlert", 1000)}
            label="Alertar se Fundo estiver abaixo de"
            name="lowFundAlert"
          />
        </div>
        <SwitchField
          defaultChecked={settingBoolean(settings, "mandatoryCloseCount", true)}
          description="Exigir inserção manual das cédulas físicas no fecho de turno"
          label="Contagem Obrigatória no Fecho"
          name="mandatoryCloseCount"
        />
      </SettingsCard>
      <SettingsCard title="Gestão de Trocos & Arredondamentos">
        <SwitchField
          defaultChecked={settingBoolean(settings, "automaticRounding", true)}
          description="Arredondar valores fracionados para facilitar troco físico"
          label="Arredondamento Automático"
          name="automaticRounding"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <SelectField
            defaultValue={String(settingNumber(settings, "roundingUnit", 1))}
            label="Arredondar para"
            name="roundingUnit"
          >
            <option value="1">1 MT</option>
            <option value="5">5 MT</option>
            <option value="10">10 MT</option>
          </SelectField>
          <SwitchField
            defaultChecked={settingBoolean(settings, "logChange", true)}
            description="Guardar logs de trocos entregues"
            label="Registar Trocos no Histórico"
            name="logChange"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Limites e Segurança">
        <div className="pos-figma-grid pos-figma-grid--two">
          <MoneyField
            defaultValue={settingNumber(settings, "managerApprovalThreshold", 10000)}
            label="Exigir Aprovação Gerente acima de"
            name="managerApprovalThreshold"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "maximumCashBalance", 200000)}
            label="Limite Máximo de Caixa Diário"
            name="maximumCashBalance"
          />
          <MoneyField
            className="pos-figma-field--wide"
            defaultValue={settingNumber(settings, "safeDepositThreshold", 50000)}
            label="Alerta de Depósito Obrigatório no Cofre (acima de)"
            name="safeDepositThreshold"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Configurações de Fim de Dia">
        <Field
          defaultValue={settingString(settings, "automaticClosingTime", "22:00")}
          label="Horário de Fecho Automático"
          name="automaticClosingTime"
          type="time"
        />
        <SwitchField
          defaultChecked={settingBoolean(settings, "printClosingReport", true)}
          description="Gerar talão físico com resumo de caixa."
          label="Imprimir Relatório no Fecho"
          name="printClosingReport"
        />
        <SwitchField
          defaultChecked={settingBoolean(settings, "emailClosingReport", true)}
          description="Enviar cópia em PDF para a gerência."
          label="Enviar Relatório por Email"
          name="emailClosingReport"
        />
      </SettingsCard>
    </>
  );
}

function CardSettings({ channel }: { channel: PosPaymentChannelContext }) {
  const settings = channel.publicSettings;
  return (
    <>
      <SettingsCard title="Terminal TPA (POS Físico)">
        <div className="pos-figma-grid pos-figma-grid--three">
          <Field
            defaultValue={settingString(settings, "terminalModel", "Ingenico Move/3500")}
            label="Modelo do Terminal"
            name="terminalModel"
            required
          />
          <Field
            defaultValue={settingString(settings, "terminalSerialNumber", "")}
            label="Número de Série"
            name="terminalSerialNumber"
            required
          />
          <div className="pos-figma-field">
            <span>Estado do Terminal</span>
            <ChannelStatus channel={channel} />
          </div>
          <SelectField
            className="pos-figma-field--wide"
            defaultValue={settingString(settings, "connectionType", "wifi_4g")}
            label="Tipo de Conexão"
            name="connectionType"
          >
            <option value="wifi_4g">Wi-Fi + 4G Fallback</option>
            <option value="ethernet">Ethernet</option>
            <option value="usb">USB</option>
          </SelectField>
        </div>
      </SettingsCard>
      <SettingsCard title="Bandeiras de Cartão Aceites">
        <div className="pos-figma-toggle-grid">
          <SwitchField
            defaultChecked={settingBoolean(settings, "visa", true)}
            label="Visa"
            name="visa"
          />
          <SwitchField
            defaultChecked={settingBoolean(settings, "mastercard", true)}
            label="Mastercard"
            name="mastercard"
          />
          <SwitchField
            defaultChecked={settingBoolean(settings, "maestro", true)}
            label="Maestro"
            name="maestro"
          />
          <SwitchField
            defaultChecked={settingBoolean(settings, "americanExpress", false)}
            label="American Express"
            name="americanExpress"
          />
          <SwitchField
            defaultChecked={settingBoolean(settings, "unionPay", false)}
            label="UnionPay"
            name="unionPay"
          />
        </div>
      </SettingsCard>
      <SettingsCard title="Opções de Transação">
        <SwitchField
          defaultChecked={settingBoolean(settings, "contactless", true)}
          description="Permitir pagamentos por aproximação"
          label="Contactless / NFC Ativo"
          name="contactless"
        />
        <div className="pos-figma-grid pos-figma-grid--two">
          <MoneyField
            defaultValue={settingNumber(settings, "contactlessLimit", 5000)}
            label="Limite Contactless sem PIN"
            name="contactlessLimit"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "pinThreshold", 2500)}
            label="PIN Obrigatório acima de"
            name="pinThreshold"
          />
        </div>
        <SwitchField
          defaultChecked={settingBoolean(settings, "preAuthorization", false)}
          description="Reservar saldo antes de processar valor final"
          label="Pré-Autorização"
          name="preAuthorization"
        />
      </SettingsCard>
      <SettingsCard title="Taxas e Custos Operacionais">
        <div className="pos-figma-grid pos-figma-grid--two">
          <Field
            defaultValue={settingNumber(settings, "processingRate", 1.8)}
            label="Taxa de Processamento (TDR)"
            max={20}
            min={0}
            name="processingRate"
            step="0.1"
            suffix="%"
            type="number"
          />
          <MoneyField
            defaultValue={settingNumber(settings, "fixedFee", 15)}
            label="Taxa Fixa por Transação"
            name="fixedFee"
          />
        </div>
        <p className="pos-figma-cost-estimate">
          Estimativa mensal calculada a partir do volume real após a ativação do terminal.
        </p>
      </SettingsCard>
    </>
  );
}

function PaymentFormIdentity({
  business,
  channel
}: {
  business: PosBusinessContext;
  channel: PosPaymentChannelContext;
}) {
  return (
    <>
      <input name="businessId" type="hidden" value={business.id} />
      <input name="channelId" type="hidden" value={channel.id} />
      <input name="method" type="hidden" value={channel.method} />
    </>
  );
}

function SecretField({
  configured,
  label,
  name
}: {
  configured: boolean;
  label: string;
  name: string;
}) {
  return (
    <Field
      autoComplete="new-password"
      label={label}
      minLength={8}
      name={name}
      placeholder={configured ? "••••••••••••••••" : "Introduza a credencial"}
      required={!configured}
      type="password"
    />
  );
}

function MoneyField({
  className,
  defaultValue,
  label,
  name
}: {
  className?: string;
  defaultValue: number;
  label: string;
  name: string;
}) {
  return (
    <Field
      className={className}
      defaultValue={defaultValue}
      label={label}
      min={0}
      name={name}
      suffix="MT"
      type="number"
    />
  );
}

function ChannelStatus({ channel }: { channel: PosPaymentChannelContext }) {
  const state = {
    active: {
      label: channel.mode === "provider" ? "Conectado" : "Ativo",
      tone: "success" as const
    },
    testing: { label: "Aguarda teste", tone: "warning" as const },
    suspended: { label: "Suspenso", tone: "danger" as const },
    unconfigured: { label: "Não configurado", tone: "muted" as const }
  }[channel.status];
  return <StatusBadge tone={state.tone}>{state.label}</StatusBadge>;
}
