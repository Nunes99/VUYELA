"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  Droplets,
  Heart,
  Info,
  LockKeyhole,
  Mail,
  Phone,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Scissors,
  ShoppingBag,
  Smile,
  Sparkles,
  Smartphone,
  UserRound,
  WalletCards
} from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select } from "../../vuyela-design-system/src/components/Field";
import { submitPosAction } from "./actions";
import {
  buildPosQuote,
  formatMznCompact,
  parseMznToMinorUnits,
  posSteps,
  splitVatInclusive
} from "./model";
import type { PosCustomerCard, PosPaymentMethod, PosStepId } from "./model";
import { PosQrScanner } from "./pos-qr-scanner";
import { initialPosActionState } from "./state";
import type { PosActionState } from "./state";
import type {
  PosBusinessContext,
  PosCatalogItemContext,
  PosContextState,
  PosPaymentChannelContext
} from "./data";

interface PosWorkflowProps {
  context: PosContextState;
  initialPaymentMethod?: PosPaymentMethod | null;
  initialState?: PosActionState;
}

const defaultLookupMethods: Array<"qr" | "card" | "phone"> = ["qr", "card", "phone"];

export function PosWorkflow({
  context,
  initialPaymentMethod = null,
  initialState = initialPosActionState
}: PosWorkflowProps) {
  const [state, formAction, pending] = useActionState(submitPosAction, initialState);
  const [customerAuthorized, setCustomerAuthorized] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod | null>(initialPaymentMethod);
  const [catalogItemId, setCatalogItemId] = useState(initialState.catalogItemId);
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
  const activeStep: PosStepId = state.transactionId
    ? "success"
    : state.quote && paymentMethod
      ? "confirm"
      : state.quote
        ? "authorize"
        : state.card
          ? "services"
          : "identify";
  const [quoteIdempotencyKey, setQuoteIdempotencyKey] = useState("");
  const selectedCatalogItems = useMemo(
    () =>
      selectedBusiness?.catalogItems.filter(
        (item) => item.branchId === null || item.branchId === state.branchId
      ) ?? [],
    [selectedBusiness, state.branchId]
  );
  const selectedPaymentChannels = useMemo(
    () =>
      selectedBusiness?.paymentChannels.filter(
        (channel) => channel.branchId === null || channel.branchId === state.branchId
      ) ?? [],
    [selectedBusiness, state.branchId]
  );
  const selectedCatalogItem =
    selectedCatalogItems.find((item) => item.id === (catalogItemId || state.catalogItemId)) ?? null;

  useEffect(() => {
    setQuoteIdempotencyKey(createBrowserIdempotencyKey());
  }, []);

  useEffect(() => {
    if (!state.card || state.quote || selectedCatalogItems.length === 0) {
      return;
    }

    setCatalogItemId((current) =>
      selectedCatalogItems.some((item) => item.id === current)
        ? current
        : (selectedCatalogItems[0]?.id ?? "")
    );
  }, [selectedCatalogItems, state.card, state.quote]);

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
        <section className={`pos-panel pos-panel--${activeStep}`} aria-labelledby="pos-flow-title">
          {activeStep !== "success" ? <PosPanelHeading activeStep={activeStep} /> : null}

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
              card={state.card}
              formAction={formAction}
              idempotencyKey={state.idempotencyKey || quoteIdempotencyKey}
              pending={pending}
              terminalId={state.terminalId}
              catalogItems={selectedCatalogItems}
              selectedItemId={catalogItemId}
              onSelectItem={setCatalogItemId}
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
                terminalId={state.terminalId}
                onAuthorizationChange={setCustomerAuthorized}
                onBack={() => setPaymentMethod(null)}
                paymentMethod={paymentMethod}
                pending={pending}
                state={state}
              />
            ) : (
              <AuthorizationStep
                channels={selectedPaymentChannels}
                onSelect={setPaymentMethod}
                quote={state.quote}
              />
            )
          ) : null}

          {state.card && state.quote && state.transactionId ? (
            <SuccessState
              formAction={formAction}
              onReset={() => {
                setQuoteIdempotencyKey(createBrowserIdempotencyKey());
                setCustomerAuthorized(false);
                setPaymentMethod(null);
                setCatalogItemId("");
              }}
              state={state}
            />
          ) : null}

          <ActionMessage status={state.status} message={state.message} />
        </section>

        <PosTransactionSummary
          activeStep={activeStep}
          business={selectedBusiness}
          paymentMethod={paymentMethod}
          selectedCatalogItem={selectedCatalogItem}
          state={state}
        />
      </div>
    </div>
  );
}

function PosPanelHeading({ activeStep }: { activeStep: Exclude<PosStepId, "success"> }) {
  const content = {
    identify: { eyebrow: "Caixa", title: "Nova transação" },
    services: { eyebrow: "Serviços disponíveis", title: "Selecione os Serviços" },
    authorize: { eyebrow: "Pagamento", title: "Autorizar Pagamento" },
    confirm: { eyebrow: "Revisão", title: "Confirmar Transação" }
  }[activeStep];

  return (
    <div className="pos-panel__header">
      <span className="pos-eyebrow">{content.eyebrow}</span>
      <h2 id="pos-flow-title">{content.title}</h2>
    </div>
  );
}

function PosSteps({ activeStep }: { activeStep: PosStepId }) {
  const activeIndex = posSteps.findIndex((step) => step.id === activeStep);

  return (
    <ol className="pos-steps" aria-label="Progresso do POS">
      {posSteps.map((step, index) => {
        const isActive = step.id === activeStep;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={isActive ? "is-active" : index < activeIndex ? "is-done" : ""}
            key={step.id}
          >
            <span>{index + 1}</span>
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
    roleLabels: [],
    canManage: false,
    terminals: [],
    paymentChannels: [],
    catalogItems: []
  };
  const [selectedBusinessId, setSelectedBusinessId] = useState(firstBusiness.id);
  const selectedBusiness =
    businesses.find((business) => business.id === selectedBusinessId) ?? firstBusiness;
  const [selectedBranchId, setSelectedBranchId] = useState(selectedBusiness.defaultBranchId);
  const terminalsForBranch = selectedBusiness.terminals.filter(
    (terminal) => terminal.branchId === selectedBranchId && terminal.status === "active"
  );
  const [selectedTerminalId, setSelectedTerminalId] = useState(terminalsForBranch[0]?.id ?? "");
  const [lookupMethod, setLookupMethod] = useState<"qr" | "card" | "phone">("qr");
  const [lookupValue, setLookupValue] = useState("");
  const lookupInputRef = useRef<HTMLInputElement>(null);
  const selectedTerminal = terminalsForBranch.find(
    (terminal) => terminal.id === selectedTerminalId
  );
  const allowedLookupMethods = useMemo(
    () => selectedTerminal?.settings.allowedLookupMethods ?? defaultLookupMethods,
    [selectedTerminal]
  );

  useEffect(() => {
    if (!allowedLookupMethods.includes(lookupMethod)) {
      setLookupMethod(allowedLookupMethods[0] ?? "qr");
      setLookupValue("");
    }
  }, [allowedLookupMethods, lookupMethod]);

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
            setSelectedTerminalId(
              nextBusiness.terminals.find(
                (terminal) =>
                  terminal.branchId === nextBusiness.defaultBranchId && terminal.status === "active"
              )?.id ?? ""
            );
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
            const nextBranchId = event.currentTarget.value;
            setSelectedBranchId(nextBranchId);
            setSelectedTerminalId(
              selectedBusiness.terminals.find(
                (terminal) => terminal.branchId === nextBranchId && terminal.status === "active"
              )?.id ?? ""
            );
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

        {terminalsForBranch.length > 1 ? (
          <Select
            label="Terminal"
            name="terminalId"
            value={selectedTerminalId}
            onChange={(event) => setSelectedTerminalId(event.currentTarget.value)}
            requiredMark
            required
          >
            {terminalsForBranch.map((terminal) => (
              <option value={terminal.id} key={terminal.id}>
                {terminal.name} · {terminal.code}
              </option>
            ))}
          </Select>
        ) : (
          <input name="terminalId" type="hidden" value={selectedTerminalId} />
        )}
      </div>

      <fieldset className="pos-lookup-methods">
        <legend>Como pretende identificar o cliente?</legend>
        <div role="radiogroup" aria-label="Método de identificação">
          {(
            [
              { id: "qr", label: "Ler QR", icon: QrCode },
              { id: "card", label: "Nº Cartão", icon: CreditCard },
              { id: "phone", label: "Telefone", icon: Phone }
            ] as const
          )
            .filter((method) => allowedLookupMethods.includes(method.id))
            .map((method) => {
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
        disabled={!selectedTerminalId}
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
  card,
  formAction,
  pending,
  idempotencyKey,
  terminalId,
  catalogItems,
  selectedItemId,
  onSelectItem
}: {
  businessId: string;
  branchId: string;
  card: PosCustomerCard;
  formAction: (formData: FormData) => void;
  idempotencyKey: string;
  pending: boolean;
  terminalId: string;
  catalogItems: PosCatalogItemContext[];
  selectedItemId: string;
  onSelectItem: (itemId: string) => void;
}) {
  const [customDescription, setCustomDescription] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [requestedPoints, setRequestedPoints] = useState(0);
  const selectedItem = catalogItems.find((item) => item.id === selectedItemId) ?? null;
  const hasCatalog = catalogItems.length > 0;
  const grossAmountMznMinor = selectedItem?.priceMznMinor ?? parseOptionalMzn(customAmount);
  const maximumQuote = useMemo(
    () =>
      grossAmountMznMinor > 0
        ? buildPosQuote({
            grossAmountMznMinor,
            discountAmountMznMinor: 0,
            requestedPointsToRedeem: Number.MAX_SAFE_INTEGER,
            card
          })
        : null,
    [card, grossAmountMznMinor]
  );
  const maximumRedeemablePoints = maximumQuote?.maximumRedeemablePoints ?? 0;
  const quotePreview = useMemo(
    () =>
      grossAmountMznMinor > 0
        ? buildPosQuote({
            grossAmountMznMinor,
            discountAmountMznMinor: 0,
            requestedPointsToRedeem: usePoints ? requestedPoints : 0,
            card
          })
        : null,
    [card, grossAmountMznMinor, requestedPoints, usePoints]
  );
  const canContinue = grossAmountMznMinor > 0;

  useEffect(() => {
    setRequestedPoints((current) => Math.min(current, maximumRedeemablePoints));

    if (maximumRedeemablePoints === 0) {
      setUsePoints(false);
    }
  }, [maximumRedeemablePoints]);

  const updateRequestedPoints = (value: number) => {
    const nextValue = Number.isFinite(value) ? Math.trunc(value) : 0;
    setRequestedPoints(Math.max(0, Math.min(nextValue, maximumRedeemablePoints)));
  };

  return (
    <form action={formAction} className="pos-form">
      <input type="hidden" name="intent" value="quote" />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="terminalId" value={terminalId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input name="discountAmountMzn" type="hidden" value="0" />
      <input
        name="pointsToRedeem"
        type="hidden"
        value={usePoints ? (quotePreview?.pointsToRedeem ?? 0) : 0}
      />

      {hasCatalog ? (
        <>
          <input name="catalogItemId" type="hidden" value={selectedItem?.id ?? ""} />
          <input name="serviceDescription" type="hidden" value={selectedItem?.name ?? ""} />
          <input
            name="grossAmountMzn"
            type="hidden"
            value={selectedItem ? minorUnitsToInput(selectedItem.priceMznMinor) : ""}
          />
          <div className="pos-catalog-grid" role="radiogroup" aria-label="Serviços disponíveis">
            {catalogItems.map((item, index) => {
              const Icon = catalogItemIcon(index, item.kind);
              const selected = item.id === selectedItemId;

              return (
                <button
                  aria-checked={selected}
                  className={selected ? "is-selected" : undefined}
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  role="radio"
                  type="button"
                >
                  <span className="pos-catalog-card__topline">
                    <i aria-hidden="true">
                      <Icon size={19} />
                    </i>
                    <strong>{formatMznCompact(item.priceMznMinor)}</strong>
                  </span>
                  <span className="pos-catalog-card__copy">
                    <b>{item.name}</b>
                    <small>
                      {item.description || (item.kind === "product" ? "Produto" : "Serviço")}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="pos-catalog-empty">
          <ShoppingBag aria-hidden="true" size={24} />
          <div>
            <strong>Venda sem catálogo</strong>
            <p>Indique a descrição e o valor para continuar.</p>
          </div>
          <Input
            label="Descrição no comprovativo"
            name="serviceDescription"
            maxLength={160}
            onChange={(event) => setCustomDescription(event.currentTarget.value)}
            placeholder="Ex.: Corte masculino + barba"
            required
            requiredMark
            value={customDescription}
          />
          <Input
            label="Valor da compra em MZN"
            name="grossAmountMzn"
            inputMode="decimal"
            onChange={(event) => setCustomAmount(event.currentTarget.value)}
            placeholder="0,00"
            required
            requiredMark
            value={customAmount}
          />
        </div>
      )}

      <section className="pos-loyalty-manager" aria-labelledby="pos-loyalty-title">
        <div className="pos-loyalty-manager__heading">
          <div>
            <span className="pos-section-label">Fidelização VUYELA</span>
            <h3 id="pos-loyalty-title">Gerir pontos desta compra</h3>
          </div>
          <div className="pos-loyalty-manager__balance">
            <small>Saldo disponível</small>
            <strong>{card.availablePoints.toLocaleString("pt-MZ")} pontos</strong>
            <span>
              Equivale a {formatMznCompact(card.availablePoints * card.pointValueMznMinor)}
            </span>
          </div>
        </div>

        <label className="pos-loyalty-toggle">
          <span>
            <strong>Usar pontos como parte do pagamento</strong>
            <small>Até {maximumRedeemablePoints.toLocaleString("pt-MZ")} pontos nesta compra</small>
          </span>
          <input
            checked={usePoints}
            disabled={maximumRedeemablePoints === 0}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;
              setUsePoints(enabled);
              if (enabled && requestedPoints === 0) {
                setRequestedPoints(maximumRedeemablePoints);
              }
            }}
            type="checkbox"
          />
          <i aria-hidden="true">
            <span />
          </i>
        </label>

        {usePoints ? (
          <div className="pos-loyalty-manager__controls">
            <div className="pos-loyalty-manager__field">
              <label htmlFor="pos-points-to-redeem">Pontos a utilizar</label>
              <div>
                <input
                  id="pos-points-to-redeem"
                  inputMode="numeric"
                  max={maximumRedeemablePoints}
                  min="0"
                  onChange={(event) => updateRequestedPoints(Number(event.currentTarget.value))}
                  step="1"
                  type="number"
                  value={requestedPoints}
                />
                <button
                  onClick={() => updateRequestedPoints(maximumRedeemablePoints)}
                  type="button"
                >
                  Usar máximo
                </button>
              </div>
              <input
                aria-label="Ajustar pontos a utilizar"
                max={maximumRedeemablePoints}
                min="0"
                onChange={(event) => updateRequestedPoints(Number(event.currentTarget.value))}
                step="1"
                type="range"
                value={requestedPoints}
              />
            </div>
          </div>
        ) : null}

        <dl className="pos-loyalty-manager__preview">
          <div>
            <dt>Desconto em pontos</dt>
            <dd>-{formatMznCompact(quotePreview?.pointsRedeemedValueMznMinor ?? 0)}</dd>
          </div>
          <div>
            <dt>Restante a pagar</dt>
            <dd>{quotePreview ? formatMznCompact(quotePreview.netAmountMznMinor) : "-"}</dd>
          </div>
          <div>
            <dt>Pontos a creditar</dt>
            <dd>+{quotePreview?.pointsEarned.toLocaleString("pt-MZ") ?? 0} pts</dd>
          </div>
        </dl>
        <p className="pos-loyalty-manager__note">
          O saldo e os novos pontos são confirmados no servidor quando o pagamento for concluído.
        </p>
      </section>

      <Button
        className="pos-primary-action"
        disabled={!canContinue}
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        trailingIcon={<ArrowRight aria-hidden="true" size={20} />}
      >
        Confirmar Serviços selecionados
      </Button>
    </form>
  );
}

function AuthorizationStep({
  quote,
  channels,
  onSelect
}: {
  quote: NonNullable<PosActionState["quote"]>;
  channels: PosPaymentChannelContext[];
  onSelect: (method: PosPaymentMethod) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PosPaymentMethod | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const methods = useMemo<
    Array<{
      id: PosPaymentMethod;
      label: string;
      detail: string;
      icon: typeof Smartphone;
      enabled: boolean;
    }>
  >(
    () =>
      quote.netAmountMznMinor === 0
        ? [
            {
              id: "points",
              label: "Pontos VUYELA",
              detail: "Compra totalmente liquidada",
              icon: BadgeCheck,
              enabled: true
            }
          ]
        : [
            {
              id: "mpesa",
              label: "M-Pesa",
              detail: "Pagamento móvel Vodacom",
              icon: Smartphone,
              enabled: channelIsReady(channels, "mpesa")
            },
            {
              id: "emola",
              label: "e-Mola",
              detail: "Pagamento móvel Movitel",
              icon: Smartphone,
              enabled: channelIsReady(channels, "emola")
            },
            {
              id: "mkesh",
              label: "Mkesh",
              detail: "Pagamento móvel",
              icon: Smartphone,
              enabled: channelIsReady(channels, "mkesh")
            },
            {
              id: "cash",
              label: "Dinheiro",
              detail: channelDetail(channels, "cash"),
              icon: Banknote,
              enabled: channelIsActive(channels, "cash")
            },
            {
              id: "card",
              label: "Cartão",
              detail: channelDetail(channels, "card"),
              icon: WalletCards,
              enabled: channelIsActive(channels, "card")
            }
          ],
    [channels, quote.netAmountMznMinor]
  );

  useEffect(() => {
    const availableMethod = methods.find((method) => method.enabled)?.id ?? null;

    setSelectedMethod((current) =>
      current && methods.some((method) => method.id === current && method.enabled)
        ? current
        : availableMethod
    );
  }, [methods]);

  return (
    <section className="pos-authorization" aria-labelledby="pos-payment-title">
      <h3 className="sr-only" id="pos-payment-title">
        Método de pagamento
      </h3>
      <strong className="pos-section-label">
        Método de pagamento <span aria-hidden="true">*</span>
      </strong>
      <div className="pos-payment-methods" role="radiogroup" aria-label="Método de pagamento">
        {methods.map((method) => {
          const Icon = method.icon;
          const selected = selectedMethod === method.id;
          return (
            <button
              aria-checked={selected}
              className={`${selected ? "is-selected " : ""}pos-payment-method--${method.id}`}
              disabled={!method.enabled}
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              role="radio"
              type="button"
            >
              {selected ? (
                <i className="pos-payment-method__check" aria-hidden="true">
                  <Check size={15} />
                </i>
              ) : null}
              <span>
                <Icon aria-hidden="true" size={20} />
              </span>
              <strong>{method.label}</strong>
              <small>{method.enabled ? method.detail : channelDetail(channels, method.id)}</small>
            </button>
          );
        })}
      </div>

      <div className="pos-voucher-field">
        <label htmlFor="pos-voucher-code">Código de Desconto / Vale</label>
        <div>
          <input
            id="pos-voucher-code"
            onChange={(event) => {
              setVoucherCode(event.currentTarget.value.toUpperCase());
              setVoucherMessage("");
            }}
            placeholder="Introduza código..."
            value={voucherCode}
          />
          <button
            onClick={() =>
              setVoucherMessage(
                voucherCode.trim()
                  ? "Este vale não está disponível para esta transação."
                  : "Introduza um código para validar."
              )
            }
            type="button"
          >
            Aplicar
          </button>
        </div>
        {voucherMessage ? <small role="status">{voucherMessage}</small> : null}
      </div>

      <Button
        className="pos-primary-action"
        disabled={!selectedMethod}
        fullWidth
        onClick={() => selectedMethod && onSelect(selectedMethod)}
        size="lg"
        trailingIcon={<ArrowRight aria-hidden="true" size={20} />}
        type="button"
        variant="primary"
      >
        Prosseguir para Resumo
      </Button>
    </section>
  );
}

function ConfirmForm({
  businessId,
  branchId,
  formAction,
  idempotencyKey,
  terminalId,
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
  terminalId: string;
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
      <input type="hidden" name="terminalId" value={terminalId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      <dl className="pos-confirmation-list pos-confirmation-list--review">
        <div>
          <dt>Cliente</dt>
          <dd>
            {state.card?.customerName} ({state.card?.cardNumber})
          </dd>
        </div>
        <div>
          <dt>Serviço Adicionado</dt>
          <dd>{state.serviceDescription || "Compra no estabelecimento"}</dd>
        </div>
        <div>
          <dt>Método de Pagamento</dt>
          <dd>
            {paymentMethodLabel(paymentMethod)}
            <button className="pos-inline-edit" onClick={onBack} type="button">
              Alterar
            </button>
          </dd>
        </div>
        {state.quote?.pointsToRedeem ? (
          <div>
            <dt>Pontos utilizados</dt>
            <dd>
              {state.quote.pointsToRedeem.toLocaleString("pt-MZ")} pts (-
              {formatMznCompact(state.quote.pointsRedeemedValueMznMinor)})
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Pontos a creditar</dt>
          <dd>+{state.quote?.pointsEarned.toLocaleString("pt-MZ") ?? 0} pts</dd>
        </div>
        <div className="pos-confirmation-list__total">
          <dt>Total a Liquidar</dt>
          <dd>{state.quote ? formatMznCompact(state.quote.netAmountMznMinor) : "-"}</dd>
        </div>
      </dl>

      {paymentMethod === "card" ? (
        <Input
          label="Referência do terminal bancário"
          name="paymentReference"
          maxLength={100}
          placeholder="Ex.: TPA-984251"
          requiredMark
          required
        />
      ) : null}

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
        <span>Aceito os termos de faturação e transação eletrónica.</span>
      </label>

      <Button
        className="pos-primary-action"
        disabled={!customerAuthorized}
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        leadingIcon={<LockKeyhole aria-hidden="true" size={20} />}
      >
        Confirmar Pagamento
      </Button>
    </form>
  );
}

function SuccessState({
  formAction,
  onReset,
  state
}: {
  formAction: (formData: FormData) => void;
  onReset: () => void;
  state: PosActionState;
}) {
  const receiptNumber = state.receiptNumber ?? state.transactionId ?? "-";
  const completedAt = state.completedAt
    ? new Intl.DateTimeFormat("pt-MZ", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(state.completedAt))
    : "-";

  const emailReceipt = () => {
    const subject = encodeURIComponent(`Recibo VUYELA ${receiptNumber}`);
    const body = encodeURIComponent(
      [
        `Recibo: ${receiptNumber}`,
        `Data e hora: ${completedAt}`,
        `Valor da compra: ${state.quote ? formatMznCompact(state.quote.grossAmountMznMinor) : "-"}`,
        `Pontos utilizados: ${state.quote?.pointsToRedeem ?? 0}`,
        `Total pago: ${state.quote ? formatMznCompact(state.quote.netAmountMznMinor) : "-"}`,
        `Pontos creditados: ${state.quote?.pointsEarned ?? 0}`,
        `Método: ${state.paymentMethod ? paymentMethodLabel(state.paymentMethod) : "-"}`
      ].join("\n")
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="pos-success" role="status">
      <span className="pos-success__icon">
        <Check size={46} aria-hidden="true" />
      </span>
      <div>
        <h3>Transação concluída com sucesso!</h3>
        <p>A transação foi concluída com sucesso no sistema POS VUYELA.</p>
      </div>
      <dl className="pos-success__receipt">
        <div>
          <dt>ID Transação</dt>
          <dd>#{receiptNumber}</dd>
        </div>
        <div>
          <dt>Data e Hora</dt>
          <dd>{completedAt}</dd>
        </div>
        <div>
          <dt>Método utilizado</dt>
          <dd>{state.paymentMethod ? paymentMethodLabel(state.paymentMethod) : "-"}</dd>
        </div>
        <div>
          <dt>Pontos utilizados</dt>
          <dd>{state.quote?.pointsToRedeem.toLocaleString("pt-MZ") ?? 0} pts</dd>
        </div>
        <div>
          <dt>Pontos creditados</dt>
          <dd>+{state.quote?.pointsEarned.toLocaleString("pt-MZ") ?? 0} pts</dd>
        </div>
        <div>
          <dt>Saldo atualizado</dt>
          <dd>{state.card?.availablePoints.toLocaleString("pt-MZ") ?? 0} pts</dd>
        </div>
      </dl>
      <div className="pos-success__actions">
        <Button
          className="pos-success__secondary-action"
          leadingIcon={<Printer aria-hidden="true" size={18} />}
          onClick={() => window.print()}
          type="button"
          variant="outline"
        >
          Imprimir Recibo
        </Button>
        <Button
          className="pos-success__secondary-action"
          leadingIcon={<Mail aria-hidden="true" size={18} />}
          onClick={emailReceipt}
          type="button"
          variant="outline"
        >
          Enviar por Email
        </Button>
      </div>
      <form action={formAction}>
        <input type="hidden" name="intent" value="reset" />
        <Button
          className="pos-primary-action"
          fullWidth
          type="submit"
          variant="primary"
          leadingIcon={<Plus aria-hidden="true" size={18} />}
          onClick={onReset}
        >
          Nova transação
        </Button>
      </form>
    </div>
  );
}

function PosTransactionSummary({
  activeStep,
  business,
  paymentMethod,
  selectedCatalogItem,
  state
}: {
  activeStep: PosStepId;
  business: PosBusinessContext | null;
  paymentMethod: PosPaymentMethod | null;
  selectedCatalogItem: PosCatalogItemContext | null;
  state: PosActionState;
}) {
  const branch = getSelectedBranch(business, state.branchId);

  if (activeStep === "identify") {
    return (
      <aside className="pos-summary pos-summary--identify" aria-label="Resumo do negócio">
        <div className="pos-summary__heading">
          <span className="pos-eyebrow">Negócio</span>
          <h3>{business?.name ?? "Negócio VUYELA"}</h3>
          <small>{branch ? `${branch.name}, ${branch.city}` : "Sede / sem filial"}</small>
        </div>
        <div className="pos-summary__guide">
          <p>
            <Info aria-hidden="true" size={18} />
            <span>Identifique o cliente para ver os pontos e o equivalente em MZN.</span>
          </p>
          <p>
            <ShoppingBag aria-hidden="true" size={18} />
            <span>O resumo aparece depois de selecionar o serviço.</span>
          </p>
        </div>
        <div className="pos-summary__qr-note">
          <QrCode aria-hidden="true" size={28} />
          <strong>Aceita QR do cartão</strong>
          <small>ou da aplicação do cliente</small>
        </div>
      </aside>
    );
  }

  if (activeStep === "services") {
    return (
      <aside className="pos-summary pos-summary--services" aria-label="Serviço selecionado">
        <div className="pos-summary__customer">
          <span aria-hidden="true">
            <UserRound size={25} />
          </span>
          <div>
            <h3>{state.card?.customerName ?? "Cliente VUYELA"}</h3>
            <small>ID: {state.card?.cardNumber ?? "-"}</small>
          </div>
        </div>
        <div className="pos-summary__selected-service">
          <span className="pos-summary__label">Serviço selecionado</span>
          <div>
            <strong>{selectedCatalogItem?.name ?? "Selecione um serviço"}</strong>
            <b>{selectedCatalogItem ? formatMznCompact(selectedCatalogItem.priceMznMinor) : "-"}</b>
          </div>
        </div>
        <div className="pos-summary__total">
          <strong>Total provisório</strong>
          <b>{selectedCatalogItem ? formatMznCompact(selectedCatalogItem.priceMznMinor) : "-"}</b>
        </div>
      </aside>
    );
  }

  if (activeStep === "authorize" && state.quote) {
    const taxes = splitVatInclusive(state.quote.netAmountMznMinor);

    return (
      <aside className="pos-summary pos-summary--values" aria-label="Resumo dos valores">
        <h3>Resumo dos Valores</h3>
        <dl>
          <div>
            <dt>Valor da compra</dt>
            <dd>{formatMznCompact(state.quote.grossAmountMznMinor)}</dd>
          </div>
          {state.quote.discountAmountMznMinor > 0 ? (
            <div>
              <dt>Desconto comercial</dt>
              <dd>-{formatMznCompact(state.quote.discountAmountMznMinor)}</dd>
            </div>
          ) : null}
          {state.quote.pointsToRedeem > 0 ? (
            <div>
              <dt>Pontos utilizados</dt>
              <dd>
                {state.quote.pointsToRedeem.toLocaleString("pt-MZ")} pts (-
                {formatMznCompact(state.quote.pointsRedeemedValueMznMinor)})
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Base do valor restante</dt>
            <dd>{formatMznCompact(taxes.subtotalMznMinor)}</dd>
          </div>
          <div>
            <dt>IVA (16%)</dt>
            <dd>{formatMznCompact(taxes.vatMznMinor)}</dd>
          </div>
          <div className="pos-summary__payment-total">
            <dt>Total a pagar</dt>
            <dd>{formatMznCompact(state.quote.netAmountMznMinor)}</dd>
          </div>
          <div className="pos-summary__points-credit">
            <dt>Pontos a creditar</dt>
            <dd>+{state.quote.pointsEarned.toLocaleString("pt-MZ")} pts</dd>
          </div>
        </dl>
      </aside>
    );
  }

  if (activeStep === "confirm" && state.quote) {
    return (
      <aside className="pos-summary pos-summary--receipt" aria-label="Recibo provisório">
        <h3>Recibo Provisório</h3>
        <div className="pos-summary__receipt-sheet">
          <strong>POS VUYELA</strong>
          <p>
            {business?.name ?? "Negócio VUYELA"} - {branch?.name ?? "Principal"}
          </p>
          <small>Data: {formatPosDate(new Date())}</small>
          <div>
            <span>{state.serviceDescription || "Compra no estabelecimento"}</span>
            <strong>{formatMznCompact(state.quote.grossAmountMznMinor)}</strong>
          </div>
          {state.quote.pointsToRedeem > 0 ? (
            <div>
              <span>Pontos utilizados ({state.quote.pointsToRedeem.toLocaleString("pt-MZ")})</span>
              <strong>-{formatMznCompact(state.quote.pointsRedeemedValueMznMinor)}</strong>
            </div>
          ) : null}
          <div>
            <b>Total Pago</b>
            <strong>{formatMznCompact(state.quote.netAmountMznMinor)}</strong>
          </div>
          <div className="pos-summary__receipt-points">
            <span>Pontos a creditar</span>
            <strong>+{state.quote.pointsEarned.toLocaleString("pt-MZ")} pts</strong>
          </div>
          <small>{paymentMethod ? paymentMethodLabel(paymentMethod) : ""}</small>
        </div>
      </aside>
    );
  }

  return (
    <aside className="pos-summary pos-summary--success" aria-label="Pontos acumulados">
      <h3>Cliente Fiel</h3>
      <p>O saldo de pontos do cliente foi atualizado com sucesso.</p>
      <div>
        <BadgeCheck aria-hidden="true" size={22} />
        <strong>+{state.quote?.pointsEarned.toLocaleString("pt-MZ") ?? 0} Pontos Acumulados</strong>
      </div>
      {state.quote?.pointsToRedeem ? (
        <p>{state.quote.pointsToRedeem.toLocaleString("pt-MZ")} pontos foram utilizados.</p>
      ) : null}
      <div className="pos-summary__updated-balance">
        <WalletCards aria-hidden="true" size={22} />
        <strong>
          {state.card?.availablePoints.toLocaleString("pt-MZ") ?? 0} pontos disponíveis
        </strong>
      </div>
    </aside>
  );
}

function ActionMessage({ status, message }: { status: string; message: string }) {
  if (!message || status !== "error") {
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

function getSelectedBranch(business: PosBusinessContext | null, id: string) {
  if (!business) {
    return null;
  }

  return (
    business.branches.find((branch) => branch.id === (id || business.defaultBranchId)) ??
    business.branches[0] ??
    null
  );
}

function paymentMethodLabel(method: PosPaymentMethod): string {
  const labels: Record<PosPaymentMethod, string> = {
    mpesa: "M-Pesa",
    emola: "e-Mola",
    mkesh: "Mkesh",
    cash: "Dinheiro",
    card: "Cartão bancário",
    points: "Pontos VUYELA"
  };

  return labels[method];
}

function parseOptionalMzn(value: string): number {
  if (!value.trim()) {
    return 0;
  }

  try {
    return parseMznToMinorUnits(value);
  } catch {
    return 0;
  }
}

function channelIsActive(
  channels: PosPaymentChannelContext[],
  method: PosPaymentChannelContext["method"]
) {
  return channels.some((channel) => channel.method === method && channel.status === "active");
}

function channelIsReady(
  channels: PosPaymentChannelContext[],
  method: PosPaymentChannelContext["method"]
) {
  // Provider payments remain disabled until a server-side provider adapter confirms them.
  if (method === "mpesa" || method === "emola" || method === "mkesh") {
    return false;
  }

  return channelIsActive(channels, method);
}

function channelDetail(channels: PosPaymentChannelContext[], method: PosPaymentMethod) {
  if (method === "points") return "Saldo de pontos VUYELA";

  const channel = channels.find((candidate) => candidate.method === method);

  if (!channel || channel.status === "unconfigured") return "Por configurar";
  if (channel.status === "testing") return "Em testes";
  if (channel.status === "suspended") return "Suspenso";
  if (method === "mpesa" || method === "emola" || method === "mkesh") {
    return channel.credentialsConfigured ? "Integração pendente" : "Credenciais por configurar";
  }
  return channel.mode === "manual" ? "Confirmação manual" : "Ligado ao provedor";
}

function catalogItemIcon(index: number, kind: PosCatalogItemContext["kind"]) {
  if (kind === "product") {
    return ShoppingBag;
  }

  return [Scissors, UserRound, Sparkles, Droplets, Heart, Smile][index % 6] ?? Sparkles;
}

function minorUnitsToInput(value: number) {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

function formatPosDate(date: Date) {
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Africa/Maputo"
  }).format(date);
}

function createBrowserIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pos_${crypto.randomUUID()}`;
  }

  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
