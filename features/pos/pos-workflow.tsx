"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Hash,
  Phone,
  Receipt,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  WalletCards
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select } from "../../vuyela-design-system/src/components/Field";
import { submitPosAction } from "./actions";
import { formatMznMinor, posSteps } from "./model";
import type { PosPaymentMethod } from "./model";
import { PosQrScanner } from "./pos-qr-scanner";
import { initialPosActionState } from "./state";
import type { PosActionState } from "./state";
import type { PosBusinessContext, PosContextState } from "./data";

interface PosWorkflowProps {
  context: PosContextState;
}

export function PosWorkflow({ context }: PosWorkflowProps) {
  const [state, formAction, pending] = useActionState(submitPosAction, initialPosActionState);
  const [customerAuthorized, setCustomerAuthorized] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod | null>(null);
  const selectedBusiness = useMemo(() => {
    if (context.status !== "ready") {
      return null;
    }

    return (
      context.businesses.find((business) => business.id === state.businessId) ??
      context.businesses[0] ??
      null
    );
  }, [context, state.businessId]);
  const activeStep = state.transactionId
    ? "success"
    : state.quote && paymentMethod
      ? "confirm"
      : state.quote
        ? "authorize"
        : state.card
          ? "services"
          : "identify";
  const [quoteIdempotencyKey, setQuoteIdempotencyKey] = useState("");

  useEffect(() => {
    setQuoteIdempotencyKey(createBrowserIdempotencyKey());
  }, []);

  if (context.status !== "ready") {
    return (
      <section
        className={`pos-notice${context.status === "error" ? " pos-notice--error" : ""}`}
        aria-labelledby="pos-notice-title"
      >
        <h2 id="pos-notice-title">POS indisponível</h2>
        <p>{context.message}</p>
      </section>
    );
  }

  return (
    <div className="pos-workflow">
      <PosSteps activeStep={activeStep} />

      <div className="pos-layout">
        <section className="pos-panel" aria-labelledby="pos-flow-title">
          <div className="pos-panel__header">
            <span className="pos-eyebrow">Caixa</span>
            <h2 id="pos-flow-title">Nova transação</h2>
          </div>

          {!state.card ? (
            <IdentifyForm
              businesses={context.businesses}
              formAction={formAction}
              pending={pending}
            />
          ) : null}

          {state.card && !state.quote ? (
            <QuoteForm
              branchId={state.branchId}
              businessId={state.businessId}
              formAction={formAction}
              idempotencyKey={state.idempotencyKey || quoteIdempotencyKey}
              pending={pending}
              maximumPoints={state.card.availablePoints}
            />
          ) : null}

          {state.card && state.quote && !state.transactionId ? (
            paymentMethod ? (
              <ConfirmForm
                branchId={state.branchId}
                businessId={state.businessId}
                customerAuthorized={customerAuthorized}
                formAction={formAction}
                idempotencyKey={state.idempotencyKey}
                onAuthorizationChange={setCustomerAuthorized}
                onBack={() => setPaymentMethod(null)}
                paymentMethod={paymentMethod}
                pending={pending}
                state={state}
              />
            ) : (
              <AuthorizationStep onSelect={setPaymentMethod} quote={state.quote} />
            )
          ) : null}

          {state.card && state.quote && state.transactionId ? (
            <SuccessState
              formAction={formAction}
              idempotencyKey={state.idempotencyKey}
              onReset={() => {
                setQuoteIdempotencyKey(createBrowserIdempotencyKey());
                setCustomerAuthorized(false);
                setPaymentMethod(null);
              }}
              state={state}
            />
          ) : null}

          <ActionMessage status={state.status} message={state.message} />
        </section>

        <aside className="pos-summary" aria-label="Resumo da transação">
          <div className="pos-summary__business">
            <span>Negócio</span>
            <strong>{selectedBusiness?.name ?? "VUYELA"}</strong>
            <small>{getBranchLabel(selectedBusiness, state.branchId)}</small>
          </div>

          <CustomerSummary state={state} />
          <QuoteSummary state={state} />
          {paymentMethod ? <PaymentSummary method={paymentMethod} /> : null}
        </aside>
      </div>
    </div>
  );
}

function PosSteps({ activeStep }: { activeStep: string }) {
  const activeIndex = posSteps.findIndex((step) => step.id === activeStep);

  return (
    <ol className="pos-steps" aria-label="Progresso do POS">
      {posSteps.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = step.id === activeStep;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={isDone ? "is-done" : isActive ? "is-active" : ""}
            key={step.id}
          >
            {isDone ? <CheckCircle2 size={18} aria-hidden="true" /> : <span>{index + 1}</span>}
            <strong>{step.label}</strong>
          </li>
        );
      })}
    </ol>
  );
}

function IdentifyForm({
  businesses,
  formAction,
  pending
}: {
  businesses: PosBusinessContext[];
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const firstBusiness = businesses[0] ?? {
    id: "",
    name: "Negócio VUYELA",
    branches: [],
    defaultBranchId: "",
    requiresBranch: true,
    roleLabels: []
  };
  const [selectedBusinessId, setSelectedBusinessId] = useState(firstBusiness.id);
  const selectedBusiness =
    businesses.find((business) => business.id === selectedBusinessId) ?? firstBusiness;
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBusiness.defaultBranchId);
  const [lookupMethod, setLookupMethod] = useState<"qr" | "card" | "phone">("qr");
  const [lookupValue, setLookupValue] = useState("");
  const lookupInputRef = useRef<HTMLInputElement>(null);

  const methodConfig = {
    qr: {
      label: "Código QR",
      placeholder: "VY-...",
      inputMode: "text" as const
    },
    card: {
      label: "Número do cartão",
      placeholder: "VY-...",
      inputMode: "text" as const
    },
    phone: {
      label: "Telefone do cliente",
      placeholder: "+258 84 000 0000",
      inputMode: "tel" as const
    }
  }[lookupMethod];

  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="identify" />
      <input type="hidden" name="lookupMethod" value={lookupMethod} />

      <div className="pos-form-grid">
        <Select
          label="Negócio"
          name="businessId"
          value={selectedBusinessId}
          onChange={(event) => {
            const nextBusiness =
              businesses.find((business) => business.id === event.currentTarget.value) ??
              firstBusiness;

            setSelectedBusinessId(nextBusiness.id);
            setSelectedBranchId(nextBusiness.defaultBranchId);
          }}
          requiredMark
          required
        >
          {businesses.map((business) => (
            <option value={business.id} key={business.id}>
              {business.name}
            </option>
          ))}
        </Select>

        <Select
          label="Filial"
          name="branchId"
          value={selectedBranchId}
          onChange={(event) => {
            setSelectedBranchId(event.currentTarget.value);
          }}
          required={selectedBusiness.requiresBranch}
          requiredMark={selectedBusiness.requiresBranch}
        >
          {!selectedBusiness.requiresBranch ? <option value="">Sede / sem filial</option> : null}
          {selectedBusiness.branches.map((branch) => (
            <option value={branch.id} key={branch.id}>
              {branch.name} - {branch.city}
            </option>
          ))}
        </Select>
      </div>

      <fieldset className="pos-lookup-methods">
        <legend>Como pretende identificar o cliente?</legend>
        <div role="radiogroup" aria-label="Método de identificação">
          {(
            [
              { id: "qr", label: "Ler QR", icon: Camera },
              { id: "card", label: "Cartão", icon: Hash },
              { id: "phone", label: "Telefone", icon: Phone }
            ] as const
          ).map((method) => {
            const Icon = method.icon;
            const selected = lookupMethod === method.id;

            return (
              <button
                aria-checked={selected}
                className={selected ? "is-active" : undefined}
                key={method.id}
                onClick={() => {
                  setLookupMethod(method.id);
                  setLookupValue("");
                }}
                role="radio"
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{method.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {lookupMethod === "qr" ? (
        <PosQrScanner
          onDetected={(value) => {
            setLookupValue(value);
            lookupInputRef.current?.focus();
          }}
        />
      ) : null}

      <Input
        label={methodConfig.label}
        name="lookupValue"
        autoComplete="off"
        inputMode={methodConfig.inputMode}
        onChange={(event) => setLookupValue(event.currentTarget.value)}
        placeholder={methodConfig.placeholder}
        ref={lookupInputRef}
        requiredMark
        required
        value={lookupValue}
      />

      <p className="pos-form-hint">
        {lookupMethod === "phone"
          ? "O telefone é apenas uma alternativa de identificação e deve estar associado ao cartão do cliente."
          : lookupMethod === "card"
            ? "Introduza o número visível no cartão digital do cliente."
            : "A leitura usa apenas o código de identificação; o saldo é sempre consultado no servidor."}
      </p>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        leadingIcon={<ScanLine aria-hidden="true" size={20} />}
      >
        Validar cliente
      </Button>
    </form>
  );
}

function QuoteForm({
  businessId,
  branchId,
  formAction,
  pending,
  idempotencyKey,
  maximumPoints
}: {
  businessId: string;
  branchId: string;
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  pending: boolean;
  maximumPoints: number;
}) {
  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="quote" />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="pos-form__intro">
        <span className="pos-form__step-number">02</span>
        <div>
          <h3>Serviços e valor da compra</h3>
          <p>Registe o serviço ou produto prestado antes de calcular os pontos.</p>
        </div>
      </div>

      <Input
        label="Descrição do serviço ou produto"
        name="serviceDescription"
        maxLength={160}
        placeholder="Ex.: Corte masculino + barba"
      />

      <div className="pos-amount-field">
        <Input
          label="Valor da compra"
          name="grossAmountMzn"
          inputMode="decimal"
          placeholder="0,00"
          requiredMark
          required
        />
        <span>MZN</span>
      </div>

      <div className="pos-form-grid">
        <Input label="Desconto" name="discountAmountMzn" inputMode="decimal" placeholder="0,00" />
        <Input
          label="Pontos a usar"
          name="pointsToRedeem"
          inputMode="numeric"
          min={0}
          max={maximumPoints}
          placeholder="0"
          type="number"
        />
      </div>

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        fullWidth
        loading={pending}
        leadingIcon={<Calculator size={20} />}
      >
        Rever pagamento
      </Button>
    </form>
  );
}

function AuthorizationStep({
  quote,
  onSelect
}: {
  quote: NonNullable<PosActionState["quote"]>;
  onSelect: (method: PosPaymentMethod) => void;
}) {
  const methods: Array<{
    id: PosPaymentMethod;
    label: string;
    detail: string;
    icon: typeof Smartphone;
    enabled: boolean;
  }> = [
    {
      id: "mpesa",
      label: "M-Pesa",
      detail: "Por configurar",
      icon: Smartphone,
      enabled: false
    },
    {
      id: "emola",
      label: "e-Mola",
      detail: "Por configurar",
      icon: Smartphone,
      enabled: false
    },
    {
      id: "mkesh",
      label: "mKesh",
      detail: "Por configurar",
      icon: Smartphone,
      enabled: false
    },
    {
      id: "cash",
      label: "Dinheiro",
      detail: "Confirmação manual",
      icon: Banknote,
      enabled: true
    },
    {
      id: "card",
      label: "Cartão",
      detail: "Confirmação externa",
      icon: WalletCards,
      enabled: true
    }
  ];

  return (
    <section className="pos-authorization" aria-labelledby="pos-payment-title">
      <div className="pos-form__intro">
        <span className="pos-form__step-number">03</span>
        <div>
          <h3 id="pos-payment-title">Autorizar pagamento</h3>
          <p>Selecione como o cliente vai pagar o valor final.</p>
        </div>
      </div>
      <div className="pos-payment-total">
        <span>Total a pagar</span>
        <strong>{formatMznMinor(quote.netAmountMznMinor)}</strong>
      </div>
      <div className="pos-payment-methods">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              disabled={!method.enabled}
              key={method.id}
              onClick={() => onSelect(method.id)}
              type="button"
            >
              <span>
                <Icon aria-hidden="true" size={20} />
              </span>
              <strong>{method.label}</strong>
              <small>{method.detail}</small>
            </button>
          );
        })}
      </div>
      <p className="pos-form-hint">
        Nesta fase, o POS regista apenas o método escolhido. Nenhuma cobrança é iniciada num
        provedor e a confirmação financeira é sempre manual.
      </p>
    </section>
  );
}

function ConfirmForm({
  businessId,
  branchId,
  formAction,
  idempotencyKey,
  customerAuthorized,
  onAuthorizationChange,
  onBack,
  paymentMethod,
  state,
  pending
}: {
  businessId: string;
  branchId: string;
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  customerAuthorized: boolean;
  onAuthorizationChange: (value: boolean) => void;
  onBack: () => void;
  paymentMethod: PosPaymentMethod;
  state: PosActionState;
  pending: boolean;
}) {
  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="confirm" />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      <div className="pos-form__intro">
        <span className="pos-form__step-number">04</span>
        <div>
          <h3>Confirmar transação</h3>
          <p>Revise os dados antes de emitir ou resgatar os pontos.</p>
        </div>
      </div>

      <dl className="pos-confirmation-list">
        <div>
          <dt>Cliente</dt>
          <dd>{state.card?.customerName}</dd>
        </div>
        <div>
          <dt>Serviço</dt>
          <dd>{state.serviceDescription || "Compra no estabelecimento"}</dd>
        </div>
        <div>
          <dt>Pagamento</dt>
          <dd>{paymentMethodLabel(paymentMethod)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{state.quote ? formatMznMinor(state.quote.netAmountMznMinor) : "-"}</dd>
        </div>
      </dl>

      <label className="pos-check">
        <input
          name="customerAuthorized"
          type="checkbox"
          checked={customerAuthorized}
          onChange={(event) => {
            onAuthorizationChange(event.currentTarget.checked);
          }}
          required
        />
        <span>
          <strong>Cliente autorizou</strong>
          <small>Pontos, desconto e valor final confirmados no balcão.</small>
        </span>
      </label>

      <Button
        type="submit"
        variant="reward"
        size="lg"
        fullWidth
        loading={pending}
        leadingIcon={<ShieldCheck size={20} />}
      >
        Confirmar transação
      </Button>
      <button className="pos-back-button" onClick={onBack} type="button">
        <ChevronLeft aria-hidden="true" size={17} />
        Alterar método de pagamento
      </button>
    </form>
  );
}

function SuccessState({
  formAction,
  idempotencyKey,
  onReset,
  state
}: {
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  onReset: () => void;
  state: PosActionState;
}) {
  return (
    <div className="pos-success" role="status">
      <span className="pos-success__icon">
        <BadgeCheck size={48} aria-hidden="true" />
      </span>
      <div>
        <h3>Transação concluída</h3>
        <p>Os pontos e o saldo do cliente foram atualizados.</p>
      </div>
      <dl className="pos-success__receipt">
        <div>
          <dt>Referência</dt>
          <dd>{state.transactionId ?? "-"}</dd>
        </div>
        <div>
          <dt>Total pago</dt>
          <dd>{state.quote ? formatMznMinor(state.quote.netAmountMznMinor) : "-"}</dd>
        </div>
        <div>
          <dt>Pontos ganhos</dt>
          <dd>+{state.quote?.pointsEarned.toLocaleString("pt-MZ") ?? 0} Pts</dd>
        </div>
        <div>
          <dt>Método</dt>
          <dd>{state.paymentMethod ? paymentMethodLabel(state.paymentMethod) : "-"}</dd>
        </div>
      </dl>
      <small className="pos-success__key">Anti-duplicação: {idempotencyKey}</small>
      <form action={formAction}>
        <input type="hidden" name="intent" value="reset" />
        <Button
          type="submit"
          variant="outline"
          leadingIcon={<RotateCcw size={18} />}
          onClick={onReset}
        >
          Nova transação
        </Button>
      </form>
    </div>
  );
}

function CustomerSummary({ state }: { state: PosActionState }) {
  if (!state.card) {
    return (
      <div className="pos-summary__empty">
        <CreditCard size={22} aria-hidden="true" />
        <p>Identifique o cliente para ver pontos e equivalente em MZN.</p>
      </div>
    );
  }

  const valueMznMinor = state.card.availablePoints * state.card.pointValueMznMinor;

  return (
    <div className="pos-summary__section">
      <span className="pos-eyebrow">Cliente</span>
      <h3>{state.card.customerName}</h3>
      <dl className="pos-summary-list">
        <div>
          <dt>Cartão</dt>
          <dd>{state.card.cardNumber}</dd>
        </div>
        <div>
          <dt>Pontos</dt>
          <dd>{state.card.availablePoints.toLocaleString("pt-MZ")}</dd>
        </div>
        <div>
          <dt>Equivalente</dt>
          <dd>{formatMznMinor(valueMznMinor)}</dd>
        </div>
      </dl>
    </div>
  );
}

function QuoteSummary({ state }: { state: PosActionState }) {
  if (!state.quote) {
    return (
      <div className="pos-summary__empty">
        <Receipt size={22} aria-hidden="true" />
        <p>O resumo aparece depois de calcular a compra.</p>
      </div>
    );
  }

  return (
    <div className="pos-summary__section">
      <span className="pos-eyebrow">Resumo</span>
      <dl className="pos-summary-list pos-summary-list--large">
        <div>
          <dt>Compra</dt>
          <dd>{formatMznMinor(state.quote.grossAmountMznMinor)}</dd>
        </div>
        <div>
          <dt>Desconto</dt>
          <dd>{formatMznMinor(state.quote.discountAmountMznMinor)}</dd>
        </div>
        <div>
          <dt>Usar</dt>
          <dd>
            {state.quote.pointsToRedeem.toLocaleString("pt-MZ")} pts /{" "}
            {formatMznMinor(state.quote.pointsRedeemedValueMznMinor)}
          </dd>
        </div>
        <div>
          <dt>Ganhar</dt>
          <dd>{state.quote.pointsEarned.toLocaleString("pt-MZ")} pts</dd>
        </div>
        <div className="pos-summary-list__total">
          <dt>Total</dt>
          <dd>{formatMznMinor(state.quote.netAmountMznMinor)}</dd>
        </div>
      </dl>
    </div>
  );
}

function PaymentSummary({ method }: { method: PosPaymentMethod }) {
  return (
    <div className="pos-summary__section pos-summary__payment">
      <span className="pos-eyebrow">Pagamento</span>
      <strong>{paymentMethodLabel(method)}</strong>
      <small>Selecionado para esta transação</small>
    </div>
  );
}

function ActionMessage({ status, message }: { status: string; message: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`pos-message pos-message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

function getBranchLabel(
  business: { branches: Array<{ id: string; name: string }> } | null,
  id: string
) {
  if (!id) {
    return "Sede / sem filial";
  }

  return business?.branches.find((branch) => branch.id === id)?.name ?? "Filial selecionada";
}

function paymentMethodLabel(method: PosPaymentMethod): string {
  const labels: Record<PosPaymentMethod, string> = {
    mpesa: "M-Pesa",
    emola: "e-Mola",
    mkesh: "mKesh",
    cash: "Dinheiro",
    card: "Cartão bancário"
  };

  return labels[method];
}

function createBrowserIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pos_${crypto.randomUUID()}`;
  }

  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
