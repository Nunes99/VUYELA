"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  CreditCard,
  Receipt,
  RotateCcw,
  ScanLine,
  ShieldCheck
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select } from "../../vuyela-design-system/src/components/Field";
import { initialPosActionState, submitPosAction } from "./actions";
import { formatMznMinor, posSteps } from "./model";
import type { PosActionState } from "./actions";
import type { PosBusinessContext, PosContextState } from "./data";

interface PosWorkflowProps {
  context: PosContextState;
}

export function PosWorkflow({ context }: PosWorkflowProps) {
  const [state, formAction, pending] = useActionState(submitPosAction, initialPosActionState);
  const [customerAuthorized, setCustomerAuthorized] = useState(false);
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
    : state.quote && customerAuthorized
      ? "confirm"
      : state.quote
        ? "authorization"
        : state.card
          ? "amount"
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
        <h2 id="pos-notice-title">POS indisponivel</h2>
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
            <h2 id="pos-flow-title">Nova transaccao</h2>
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
            <ConfirmForm
              branchId={state.branchId}
              businessId={state.businessId}
              customerAuthorized={customerAuthorized}
              formAction={formAction}
              idempotencyKey={state.idempotencyKey}
              onAuthorizationChange={setCustomerAuthorized}
              pending={pending}
            />
          ) : null}

          {state.card && state.quote && state.transactionId ? (
            <SuccessState
              formAction={formAction}
              idempotencyKey={state.idempotencyKey}
              onReset={() => {
                setQuoteIdempotencyKey(createBrowserIdempotencyKey());
                setCustomerAuthorized(false);
              }}
              transactionId={state.transactionId}
            />
          ) : null}

          <ActionMessage status={state.status} message={state.message} />
        </section>

        <aside className="pos-summary" aria-label="Resumo da transaccao">
          <div className="pos-summary__business">
            <span>Negocio</span>
            <strong>{selectedBusiness?.name ?? "VUYELA"}</strong>
            <small>{getBranchLabel(selectedBusiness, state.branchId)}</small>
          </div>

          <CustomerSummary state={state} />
          <QuoteSummary state={state} />
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
    name: "Negocio VUYELA",
    branches: [],
    defaultBranchId: "",
    requiresBranch: true,
    roleLabels: []
  };
  const [selectedBusinessId, setSelectedBusinessId] = useState(firstBusiness.id);
  const selectedBusiness =
    businesses.find((business) => business.id === selectedBusinessId) ?? firstBusiness;
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBusiness.defaultBranchId);

  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="identify" />

      <div className="pos-form-grid">
        <Select
          label="Negocio"
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

      <Input
        label="Cartao ou QR"
        name="cardCode"
        autoComplete="off"
        inputMode="text"
        placeholder="VY-..."
        requiredMark
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        leadingIcon={<ScanLine size={20} />}
      >
        Identificar cliente
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

      <Input
        label="Valor da compra"
        name="grossAmountMzn"
        inputMode="decimal"
        placeholder="0,00"
        requiredMark
        required
      />

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
        Calcular
      </Button>
    </form>
  );
}

function ConfirmForm({
  businessId,
  branchId,
  formAction,
  idempotencyKey,
  customerAuthorized,
  onAuthorizationChange,
  pending
}: {
  businessId: string;
  branchId: string;
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  customerAuthorized: boolean;
  onAuthorizationChange: (value: boolean) => void;
  pending: boolean;
}) {
  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="confirm" />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

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
        Confirmar transaccao
      </Button>
    </form>
  );
}

function SuccessState({
  formAction,
  idempotencyKey,
  onReset,
  transactionId
}: {
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  onReset: () => void;
  transactionId: string;
}) {
  return (
    <div className="pos-success" role="status">
      <BadgeCheck size={44} aria-hidden="true" />
      <div>
        <h3>Transaccao concluida</h3>
        <p>Referencia: {transactionId}</p>
        <small>Anti-duplicacao: {idempotencyKey}</small>
      </div>
      <form action={formAction}>
        <input type="hidden" name="intent" value="reset" />
        <Button
          type="submit"
          variant="outline"
          leadingIcon={<RotateCcw size={18} />}
          onClick={onReset}
        >
          Nova transaccao
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
          <dt>Cartao</dt>
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

  return business?.branches.find((branch) => branch.id === id)?.name ?? "Filial seleccionada";
}

function createBrowserIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pos_${crypto.randomUUID()}`;
  }

  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
