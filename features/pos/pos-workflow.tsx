"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Minus,
  PackageSearch,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  ScanLine,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  UserRound,
  WalletCards,
  X
} from "lucide-react";
import Image from "next/image";

import { submitPosAction } from "./actions";
import type {
  PosCartItemInput,
  PosLookupMethod,
  PosPaymentMethod,
  PosQuote
} from "./model";
import { formatMznCompact, posSteps, splitVatInclusive } from "./model";
import { PosQrScanner } from "./pos-qr-scanner";
import { initialPosActionState } from "./state";
import type { PosActionState } from "./state";
import type {
  PosBusinessContext,
  PosCatalogItemContext,
  PosContextState,
  PosPaymentChannelContext,
  PosTerminalContext
} from "./data";

interface PosWorkflowProps {
  context: PosContextState;
  initialPaymentMethod?: PosPaymentMethod | null;
  initialState?: PosActionState;
}

type CatalogFilter = "all" | "service" | "product";

export function PosWorkflow({
  context,
  initialPaymentMethod = null,
  initialState = initialPosActionState
}: PosWorkflowProps) {
  const [state, formAction, pending] = useActionState(submitPosAction, initialState);
  const readyBusinesses = useMemo(
    () => (context.status === "ready" ? context.businesses : []),
    [context]
  );
  const firstBusiness = readyBusinesses[0] ?? null;
  const [businessId, setBusinessId] = useState(
    initialState.businessId || firstBusiness?.id || ""
  );
  const selectedBusiness = useMemo(
    () => readyBusinesses.find((business) => business.id === businessId) ?? firstBusiness,
    [businessId, firstBusiness, readyBusinesses]
  );
  const [branchId, setBranchId] = useState(
    initialState.branchId || selectedBusiness?.defaultBranchId || ""
  );
  const terminals = useMemo(
    () =>
      selectedBusiness?.terminals.filter(
        (terminal) => terminal.branchId === branchId && terminal.status === "active"
      ) ?? [],
    [branchId, selectedBusiness]
  );
  const [terminalId, setTerminalId] = useState(
    initialState.terminalId || terminals[0]?.id || ""
  );
  const [cart, setCart] = useState<PosCartItemInput[]>(initialCart(initialState));
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod | null>(
    initialPaymentMethod
  );
  const [idempotencyKey, setIdempotencyKey] = useState(
    initialState.idempotencyKey || createBrowserIdempotencyKey()
  );

  useEffect(() => {
    if (state.businessId) setBusinessId(state.businessId);
    if (state.branchId) setBranchId(state.branchId);
    if (state.terminalId) setTerminalId(state.terminalId);
    if (state.cart.length > 0) setCart(state.cart);
    if (state.idempotencyKey) setIdempotencyKey(state.idempotencyKey);
  }, [state.branchId, state.businessId, state.cart, state.idempotencyKey, state.terminalId]);

  useEffect(() => {
    if (!selectedBusiness) return;
    if (!selectedBusiness.branches.some((branch) => branch.id === branchId)) {
      setBranchId(selectedBusiness.defaultBranchId);
    }
  }, [branchId, selectedBusiness]);

  useEffect(() => {
    if (!terminals.some((terminal) => terminal.id === terminalId)) {
      setTerminalId(terminals[0]?.id ?? "");
    }
  }, [terminalId, terminals]);

  const availableCatalog = useMemo(
    () =>
      selectedBusiness?.catalogItems.filter(
        (item) => item.branchId === null || item.branchId === branchId
      ) ?? [],
    [branchId, selectedBusiness]
  );
  const channels = useMemo(
    () =>
      selectedBusiness?.paymentChannels.filter(
        (channel) => channel.branchId === null || channel.branchId === branchId
      ) ?? [],
    [branchId, selectedBusiness]
  );
  const activeStep = state.transactionId
    ? "success"
    : state.quote && paymentMethod
      ? "payment"
      : state.quote
        ? "benefits"
        : "sale";

  if (context.status !== "ready") {
    return (
      <section className={`pos-notice${context.status === "error" ? " pos-notice--error" : ""}`}>
        <h2>POS indisponível</h2>
        <p>{context.message}</p>
      </section>
    );
  }

  if (!selectedBusiness) {
    return (
      <section className="pos-notice">
        <h2>Sem negócio ativo</h2>
        <p>Esta conta não tem um negócio disponível para operar o POS.</p>
      </section>
    );
  }

  const formContext = {
    businessId,
    branchId,
    terminalId,
    cart,
    idempotencyKey
  };

  return (
    <main className="pos-sale" data-step={activeStep}>
      <PosProgress activeStep={activeStep} />

      {activeStep === "sale" ? (
        <SaleStep
          businesses={readyBusinesses}
          businessId={businessId}
          branchId={branchId}
          cart={cart}
          catalog={availableCatalog}
          formAction={formAction}
          idempotencyKey={idempotencyKey}
          onBranchChange={(nextBranchId) => {
            setBranchId(nextBranchId);
            setCart([]);
            setIdempotencyKey(createBrowserIdempotencyKey());
          }}
          onBusinessChange={(nextBusinessId) => {
            const nextBusiness = readyBusinesses.find(
              (business) => business.id === nextBusinessId
            );
            setBusinessId(nextBusinessId);
            setBranchId(nextBusiness?.defaultBranchId ?? "");
            setTerminalId("");
            setCart([]);
            setIdempotencyKey(createBrowserIdempotencyKey());
          }}
          onCartChange={setCart}
          onTerminalChange={setTerminalId}
          pending={pending}
          selectedBusiness={selectedBusiness}
          terminalId={terminalId}
          terminals={terminals}
        />
      ) : null}

      {activeStep === "benefits" && state.quote ? (
        <BenefitsStep
          channels={channels}
          formAction={formAction}
          formContext={formContext}
          onContinue={() =>
            setPaymentMethod(state.quote?.netAmountMznMinor === 0 ? "points" : "cash")
          }
          onEdit={() => {
            setPaymentMethod(null);
            setIdempotencyKey(createBrowserIdempotencyKey());
          }}
          pending={pending}
          state={{ ...state, quote: state.quote }}
        />
      ) : null}

      {activeStep === "payment" && state.quote && paymentMethod ? (
        <PaymentStep
          channels={channels}
          formAction={formAction}
          formContext={formContext}
          onBack={() => setPaymentMethod(null)}
          onPaymentMethodChange={setPaymentMethod}
          paymentMethod={paymentMethod}
          pending={pending}
          state={{ ...state, quote: state.quote }}
        />
      ) : null}

      {activeStep === "success" && state.quote ? (
        <SuccessStep
          business={selectedBusiness}
          formAction={formAction}
          onReset={() => {
            setCart([]);
            setPaymentMethod(null);
            setIdempotencyKey(createBrowserIdempotencyKey());
          }}
          state={{ ...state, quote: state.quote }}
          terminal={selectedBusiness.terminals.find((terminal) => terminal.id === terminalId) ?? null}
        />
      ) : null}

      <ActionMessage message={state.message} status={state.status} />
    </main>
  );
}

function SaleStep({
  businesses,
  selectedBusiness,
  businessId,
  branchId,
  terminalId,
  terminals,
  catalog,
  cart,
  idempotencyKey,
  formAction,
  pending,
  onBusinessChange,
  onBranchChange,
  onTerminalChange,
  onCartChange
}: {
  businesses: PosBusinessContext[];
  selectedBusiness: PosBusinessContext;
  businessId: string;
  branchId: string;
  terminalId: string;
  terminals: PosBusinessContext["terminals"];
  catalog: PosCatalogItemContext[];
  cart: PosCartItemInput[];
  idempotencyKey: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onBusinessChange: (businessId: string) => void;
  onBranchChange: (branchId: string) => void;
  onTerminalChange: (terminalId: string) => void;
  onCartChange: (cart: PosCartItemInput[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const filteredCatalog = catalog.filter((item) => {
    const matchesFilter = filter === "all" || item.kind === filter;
    const haystack = `${item.name} ${item.description ?? ""} ${item.sku ?? ""}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });
  const cartLines = resolveCartLines(cart, catalog);
  const cartTotal = cartLines.reduce(
    (total, line) => total + line.item.priceMznMinor * line.quantity,
    0
  );

  const updateQuantity = (catalogItemId: string, quantity: number) => {
    const nextCart = cart.filter((item) => item.catalogItemId !== catalogItemId);
    if (quantity > 0) nextCart.push({ catalogItemId, quantity });
    onCartChange(nextCart);
  };

  return (
    <div className="pos-sale__workspace">
      <section className="pos-sale__catalog" aria-labelledby="pos-sale-title">
        <header className="pos-sale__heading">
          <div>
            <span>Nova venda</span>
            <h1 id="pos-sale-title">Catálogo</h1>
            <p className="pos-sale__heading-note">
              Selecione os produtos ou serviços para começar a venda.
            </p>
          </div>
          <div className="pos-sale__context">
            {businesses.length > 1 ? (
              <label>
                <span>Negócio</span>
                <select value={businessId} onChange={(event) => onBusinessChange(event.target.value)}>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              <span>Filial</span>
              <select value={branchId} onChange={(event) => onBranchChange(event.target.value)}>
                {selectedBusiness.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Terminal</span>
              <select
                disabled={terminals.length === 0}
                value={terminalId}
                onChange={(event) => onTerminalChange(event.target.value)}
              >
                {terminals.length === 0 ? <option value="">Sem terminal ativo</option> : null}
                {terminals.map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="pos-sale__tools">
          <label className="pos-sale__search">
            <Search aria-hidden="true" size={19} />
            <span className="sr-only">Pesquisar catálogo</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar produto, serviço ou SKU"
              type="search"
              value={query}
            />
          </label>
          <div className="pos-sale__filter-group">
            <div className="pos-sale__filters" role="group" aria-label="Filtrar catálogo">
              {([
                ["all", "Todos"],
                ["service", "Serviços"],
                ["product", "Produtos"]
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={filter === value}
                  className={filter === value ? "is-active" : ""}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <span aria-live="polite" className="pos-sale__result-count">
              {filteredCatalog.length} {filteredCatalog.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>

        {filteredCatalog.length > 0 ? (
          <div className="pos-sale__catalog-grid">
            {filteredCatalog.map((item) => {
              const quantity = cart.find(
                (cartItem) => cartItem.catalogItemId === item.id
              )?.quantity;

              return (
                <button
                  className={quantity ? "is-selected" : ""}
                  key={item.id}
                  onClick={() => updateQuantity(item.id, (quantity ?? 0) + 1)}
                  type="button"
                >
                  <span className="pos-sale__item-media">
                    {item.imageUrl ? (
                      <Image alt="" fill sizes="92px" src={item.imageUrl} unoptimized />
                    ) : item.kind === "product" ? (
                      <ShoppingBag aria-hidden="true" size={21} />
                    ) : (
                      <ReceiptText aria-hidden="true" size={21} />
                    )}
                  </span>
                  <span className="pos-sale__item-copy">
                    <strong>{item.name}</strong>
                    <small>{item.description || item.sku || "Item do catálogo"}</small>
                  </span>
                  {item.loyaltyDiscountPercent > 0 ? (
                    <span className="pos-sale__discount">
                      -{item.loyaltyDiscountPercent.toLocaleString("pt-MZ")}% VUYELA
                    </span>
                  ) : null}
                  <b>{formatMznCompact(item.priceMznMinor)}</b>
                  {quantity ? <i>{quantity}</i> : <Plus aria-hidden="true" size={18} />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pos-sale__empty">
            <PackageSearch aria-hidden="true" size={30} />
            <strong>Nenhum item encontrado</strong>
            <span>Ajuste a pesquisa ou escolha outra categoria.</span>
          </div>
        )}
      </section>

      {cartLines.length > 0 ? (
        <div className="pos-sale__mobile-cart-bar" role="status">
          <div>
            <span>Venda atual</span>
            <strong>
              {cartLines.reduce((total, line) => total + line.quantity, 0)} itens
            </strong>
            <small>{formatMznCompact(cartTotal)}</small>
          </div>
          <button
            onClick={() =>
              document.getElementById("pos-sale-cart")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              })
            }
            type="button"
          >
            Ver carrinho
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      ) : null}

      <aside className="pos-sale__cart" aria-labelledby="pos-cart-title" id="pos-sale-cart">
        <header>
          <div>
            <span>Venda atual</span>
            <h2 id="pos-cart-title">Carrinho</h2>
          </div>
          <div className="pos-sale__cart-heading-actions">
            <strong>{cart.reduce((total, item) => total + item.quantity, 0)} itens</strong>
            <button
              aria-label="Limpar carrinho"
              disabled={cart.length === 0}
              onClick={() => onCartChange([])}
              title="Limpar carrinho"
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} />
            </button>
          </div>
        </header>

        <div className="pos-sale__cart-lines">
          {cartLines.length === 0 ? (
            <div className="pos-sale__empty-cart">
              <ShoppingBag aria-hidden="true" size={28} />
              <strong>O carrinho está vazio</strong>
              <span>Selecione os itens no catálogo.</span>
            </div>
          ) : (
            cartLines.map(({ item, quantity }) => (
              <div className="pos-sale__cart-line" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{formatMznCompact(item.priceMznMinor)} cada</small>
                </div>
                <div className="pos-sale__quantity">
                  <button
                    aria-label={`Retirar uma unidade de ${item.name}`}
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    type="button"
                  >
                    {quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                  </button>
                  <span>{quantity}</span>
                  <button
                    aria-label={`Adicionar uma unidade de ${item.name}`}
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    type="button"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <b>{formatMznCompact(item.priceMznMinor * quantity)}</b>
              </div>
            ))
          )}
        </div>

        <footer>
          <div className="pos-sale__cart-total">
            <span>Total provisório</span>
            <strong>{formatMznCompact(cartTotal)}</strong>
          </div>
          <small className="pos-sale__cart-note">
            O registo só acontece depois da confirmação do pagamento.
          </small>
          <form action={formAction}>
            <PosContextFields
              branchId={branchId}
              businessId={businessId}
              cart={cart}
              idempotencyKey={idempotencyKey}
              terminalId={terminalId}
            />
            <input name="intent" type="hidden" value="quote" />
            <input name="pointsToRedeem" type="hidden" value="0" />
            <button
              className="pos-sale__primary"
              disabled={pending || cart.length === 0 || !terminalId}
              type="submit"
            >
              Rever e cobrar
              <ChevronRight aria-hidden="true" size={19} />
            </button>
          </form>
        </footer>
      </aside>
    </div>
  );
}

function BenefitsStep({
  state,
  channels,
  formContext,
  formAction,
  pending,
  onEdit,
  onContinue
}: {
  state: PosActionState & { quote: PosQuote };
  channels: PosPaymentChannelContext[];
  formContext: FormContext;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onEdit: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="pos-checkout">
      <section className="pos-checkout__main">
        <div className="pos-checkout__titlebar">
          <form action={formAction}>
            <input name="intent" type="hidden" value="edit_cart" />
            <button onClick={onEdit} type="submit">
              <ArrowLeft aria-hidden="true" size={18} />
              Carrinho
            </button>
          </form>
          <div>
            <span>Passo 2</span>
            <h1>Benefícios do cliente</h1>
          </div>
        </div>
        <p className="pos-checkout__helper">
          <BadgeCheck aria-hidden="true" size={17} /> O desconto VUYELA é aplicado no total final
          depois de rever a venda.
        </p>

        {state.card ? (
          <CustomerBenefits
            formAction={formAction}
            formContext={formContext}
            pending={pending}
            state={state}
          />
        ) : (
          <CustomerLookup
            formAction={formAction}
            formContext={formContext}
            pending={pending}
          />
        )}

        <div className="pos-checkout__continue">
          <div>
            <small>Métodos disponíveis</small>
            <span>{availablePaymentSummary(channels, state.quote)}</span>
          </div>
          <button className="pos-sale__primary" onClick={onContinue} type="button">
            Continuar para pagamento
            <ChevronRight aria-hidden="true" size={19} />
          </button>
        </div>
      </section>

      <OrderSummary quote={state.quote} cardName={state.card?.customerName ?? null} />
    </div>
  );
}

function CustomerLookup({
  formContext,
  formAction,
  pending
}: {
  formContext: FormContext;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [method, setMethod] = useState<PosLookupMethod>("qr");
  const [lookupValue, setLookupValue] = useState("");

  return (
    <section className="pos-customer" aria-labelledby="pos-customer-title">
      <header>
        <span className="pos-customer__icon">
          <WalletCards aria-hidden="true" size={22} />
        </span>
        <div>
          <h2 id="pos-customer-title">Aplicar cartão VUYELA</h2>
          <p>Opcional</p>
        </div>
      </header>

      <div className="pos-customer__methods" role="tablist" aria-label="Identificar cliente">
        {([
          ["qr", "QR Code", QrCode],
          ["card", "Número", CreditCard],
          ["phone", "Telefone", Smartphone]
        ] as const).map(([value, label, Icon]) => (
          <button
            aria-selected={method === value}
            className={method === value ? "is-active" : ""}
            key={value}
            onClick={() => {
              setMethod(value);
              setLookupValue("");
            }}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </button>
        ))}
      </div>

      {method === "qr" ? <PosQrScanner onDetected={setLookupValue} /> : null}

      <form action={formAction} className="pos-customer__form">
        <PosContextFields {...formContext} />
        <input name="intent" type="hidden" value="identify" />
        <input name="lookupMethod" type="hidden" value={method} />
        <input name="pointsToRedeem" type="hidden" value="0" />
        <label>
          <span>
            {method === "phone"
              ? "Telefone do cliente"
              : method === "card"
                ? "Número do cartão"
                : "Conteúdo do QR"}
          </span>
          <div>
            {method === "phone" ? (
              <Smartphone aria-hidden="true" size={18} />
            ) : method === "card" ? (
              <CreditCard aria-hidden="true" size={18} />
            ) : (
              <ScanLine aria-hidden="true" size={18} />
            )}
            <input
              autoComplete={method === "phone" ? "tel" : "off"}
              name="lookupValue"
              onChange={(event) => setLookupValue(event.target.value)}
              placeholder={
                method === "phone"
                  ? "+258 84 000 0000"
                  : method === "card"
                    ? "VY-0000-0000"
                    : "Leia o QR ou introduza o código"
              }
              required
              type={method === "phone" ? "tel" : "text"}
              value={lookupValue}
            />
          </div>
        </label>
        <button disabled={pending || !lookupValue.trim()} type="submit">
          <BadgeCheck aria-hidden="true" size={18} />
          Aplicar benefícios
        </button>
      </form>
    </section>
  );
}

function CustomerBenefits({
  state,
  formContext,
  formAction,
  pending
}: {
  state: PosActionState & { quote: PosQuote };
  formContext: FormContext;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [points, setPoints] = useState(state.quote.pointsToRedeem);
  const equivalent = points * (state.card?.pointValueMznMinor ?? 0);

  useEffect(() => setPoints(state.quote.pointsToRedeem), [state.quote.pointsToRedeem]);

  return (
    <section className="pos-customer pos-customer--identified">
      <header>
        <span className="pos-customer__avatar">
          <UserRound aria-hidden="true" size={21} />
        </span>
        <div>
          <h2>{state.card?.customerName}</h2>
          <p>{state.card?.cardNumber}</p>
        </div>
        <span className="pos-customer__verified">
          <CheckCircle2 aria-hidden="true" size={17} /> Ativo
        </span>
      </header>

      <div className="pos-customer__balance">
        <span>Saldo disponível</span>
        <strong>{state.quote.availableBalance.toLocaleString("pt-MZ")} YL</strong>
        <small>
          Até {state.quote.maximumRedeemablePoints.toLocaleString("pt-MZ")} YL nesta venda
        </small>
      </div>

      <form action={formAction} className="pos-customer__redemption">
        <PosContextFields {...formContext} />
        <input name="intent" type="hidden" value="quote" />
        <label htmlFor="pos-points-input">
          <span>YELAS a utilizar</span>
          <strong>{formatMznCompact(equivalent)} de desconto</strong>
        </label>
        <input
          aria-label="Selecionar YELAS a utilizar"
          max={state.quote.maximumRedeemablePoints}
          min="0"
          onChange={(event) => setPoints(Number(event.target.value))}
          step="1"
          type="range"
          value={points}
        />
        <div className="pos-customer__points-row">
          <input
            id="pos-points-input"
            max={state.quote.maximumRedeemablePoints}
            min="0"
            name="pointsToRedeem"
            onChange={(event) => setPoints(Number(event.target.value))}
            step="1"
            type="number"
            value={points}
          />
          <span>YL</span>
          <button disabled={pending || points === state.quote.pointsToRedeem} type="submit">
            Recalcular
          </button>
        </div>
      </form>

      <div className="pos-customer__earning">
        <BadgeCheck aria-hidden="true" size={19} />
        <span>
          Esta compra vai creditar <strong>{state.quote.pointsEarned} YL</strong> após o pagamento.
        </span>
      </div>

      <form action={formAction}>
        <PosContextFields {...formContext} />
        <input name="intent" type="hidden" value="remove_customer" />
        <input name="pointsToRedeem" type="hidden" value="0" />
        <button className="pos-customer__remove" disabled={pending} type="submit">
          <X aria-hidden="true" size={17} />
          Remover cartão desta venda
        </button>
      </form>
    </section>
  );
}

function PaymentStep({
  state,
  channels,
  formContext,
  paymentMethod,
  formAction,
  pending,
  onBack,
  onPaymentMethodChange
}: {
  state: PosActionState & { quote: PosQuote };
  channels: PosPaymentChannelContext[];
  formContext: FormContext;
  paymentMethod: PosPaymentMethod;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onBack: () => void;
  onPaymentMethodChange: (method: PosPaymentMethod) => void;
}) {
  const [authorized, setAuthorized] = useState(false);
  const availableMethods: PosPaymentMethod[] =
    state.quote.netAmountMznMinor === 0
      ? ["points"]
      : ["cash", "card", "mpesa", "emola", "mkesh"];

  return (
    <div className="pos-checkout">
      <section className="pos-checkout__main">
        <div className="pos-checkout__titlebar">
          <button onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={18} />
            Benefícios
          </button>
          <div>
            <span>Passo 3</span>
            <h1>Receber pagamento</h1>
          </div>
        </div>

        <div className="pos-payment-methods" role="radiogroup" aria-label="Método de pagamento">
          {availableMethods.map((method) => {
            const channel = channels.find((item) => item.method === method);
            const available = method === "points" || Boolean(channel?.status === "active");
            const Icon = paymentIcon(method);

            return (
              <button
                aria-checked={paymentMethod === method}
                className={paymentMethod === method ? "is-selected" : ""}
                disabled={!available}
                key={method}
                onClick={() => onPaymentMethodChange(method)}
                role="radio"
                type="button"
              >
                <span>
                  <Icon aria-hidden="true" size={22} />
                </span>
                <strong>{paymentLabel(method)}</strong>
                <small>{available ? paymentHint(method) : "A configurar"}</small>
                {paymentMethod === method ? <Check aria-hidden="true" size={17} /> : null}
              </button>
            );
          })}
        </div>

        <form action={formAction} className="pos-payment-confirm">
          <PosContextFields {...formContext} />
          <input name="intent" type="hidden" value="confirm" />
          <input name="paymentMethod" type="hidden" value={paymentMethod} />

          {paymentMethod === "card" ? (
            <label>
              <span>Referência do terminal bancário</span>
              <input name="paymentReference" placeholder="Ex.: TPA-458921" required />
            </label>
          ) : null}

          {state.quote.pointsToRedeem > 0 ? (
            <label className="pos-payment-confirm__authorization">
              <input
                checked={authorized}
                name="customerAuthorized"
                onChange={(event) => setAuthorized(event.target.checked)}
                type="checkbox"
              />
              <span>
                O cliente autorizou o débito de {state.quote.pointsToRedeem.toLocaleString("pt-MZ")} YL.
              </span>
            </label>
          ) : null}

          <div className="pos-payment-confirm__amount">
            <span>A cobrar agora</span>
            <strong>{formatMznCompact(state.quote.netAmountMznMinor)}</strong>
          </div>
          <button
            className="pos-sale__primary"
            disabled={pending || (state.quote.pointsToRedeem > 0 && !authorized)}
            type="submit"
          >
            {pending ? "A concluir..." : "Confirmar pagamento"}
            <CheckCircle2 aria-hidden="true" size={19} />
          </button>
        </form>
      </section>

      <OrderSummary quote={state.quote} cardName={state.card?.customerName ?? null} />
    </div>
  );
}

function OrderSummary({ quote, cardName }: { quote: PosQuote; cardName: string | null }) {
  const tax = splitVatInclusive(quote.netAmountMznMinor);

  return (
    <aside className="pos-order" aria-labelledby="pos-order-title">
      <header>
        <div>
          <span>Resumo</span>
          <h2 id="pos-order-title">Venda atual</h2>
        </div>
        <ReceiptText aria-hidden="true" size={22} />
      </header>
      <div className="pos-order__lines">
        {quote.lines.map((line) => (
          <div key={line.catalogItemId}>
            <span>
              <strong>{line.quantity}×</strong> {line.name}
              {line.discountAmountMznMinor > 0 ? (
                <small>-{line.loyaltyDiscountPercent.toLocaleString("pt-MZ")}% VUYELA</small>
              ) : null}
            </span>
            <b>{formatMznCompact(line.netAmountMznMinor)}</b>
          </div>
        ))}
      </div>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMznCompact(quote.grossAmountMznMinor)}</dd>
        </div>
        {quote.discountAmountMznMinor > 0 ? (
          <div className="is-saving">
            <dt>Descontos VUYELA</dt>
            <dd>-{formatMznCompact(quote.discountAmountMznMinor)}</dd>
          </div>
        ) : null}
        {quote.pointsRedeemedValueMznMinor > 0 ? (
          <div className="is-saving">
            <dt>{quote.pointsToRedeem.toLocaleString("pt-MZ")} YL utilizados</dt>
            <dd>-{formatMznCompact(quote.pointsRedeemedValueMznMinor)}</dd>
          </div>
        ) : null}
        <div>
          <dt>IVA incluído</dt>
          <dd>{formatMznCompact(tax.vatMznMinor)}</dd>
        </div>
      </dl>
      <div className="pos-order__total">
        <span>Total</span>
        <strong>{formatMznCompact(quote.netAmountMznMinor)}</strong>
      </div>
      {cardName ? (
        <p className="pos-order__loyalty">
          <BadgeCheck aria-hidden="true" size={18} />
          {cardName} ganha <strong>{quote.pointsEarned} YL</strong>
        </p>
      ) : (
        <p className="pos-order__guest">
          <UserRound aria-hidden="true" size={18} /> Venda sem cartão VUYELA
        </p>
      )}
    </aside>
  );
}

function SuccessStep({
  state,
  business,
  terminal,
  formAction,
  onReset
}: {
  state: PosActionState & { quote: PosQuote };
  business: PosBusinessContext;
  terminal: PosTerminalContext | null;
  formAction: (formData: FormData) => void;
  onReset: () => void;
}) {
  const receiptSettings = recordValue(terminal?.settings.configuration.general);
  const showLogo = receiptSettings.receiptLogoEnabled !== false;
  const thankYouMessage = stringValue(
    receiptSettings.thankYouMessage,
    "Obrigado pela preferência!"
  );
  const receiptFooter = stringValue(receiptSettings.receiptFooter, "Comprovativo VUYELA");

  return (
    <section className="pos-success">
      <span className="pos-success__icon">
        <Check aria-hidden="true" size={32} />
      </span>
      <span>Pagamento confirmado</span>
      <h1>Venda concluída</h1>
      <div className="pos-success__receipt-brand">
        {showLogo && business.logoUrl ? (
          <span>
            <Image alt={`Logótipo de ${business.name}`} fill sizes="64px" src={business.logoUrl} unoptimized />
          </span>
        ) : null}
        <div>
          <strong>{business.name}</strong>
          <small>{business.phone || business.email || "Comprovativo VUYELA"}</small>
        </div>
      </div>
      <strong>{formatMznCompact(state.quote.netAmountMznMinor)}</strong>
      <p>{state.receiptNumber ?? "Comprovativo VUYELA"}</p>
      <p className="pos-success__thank-you">{thankYouMessage}</p>

      <div className="pos-success__facts">
        <div>
          <span>Método</span>
          <strong>{paymentLabel(state.paymentMethod ?? "cash")}</strong>
        </div>
        <div>
          <span>YELAS creditadas</span>
          <strong>{state.quote.pointsEarned} YL</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>Reconciliado</strong>
        </div>
      </div>

      <div className="pos-success__actions">
        <button onClick={() => window.print()} type="button">
          <Printer aria-hidden="true" size={18} /> Imprimir comprovativo
        </button>
        <form action={formAction}>
          <input name="intent" type="hidden" value="reset" />
          <button className="pos-sale__primary" onClick={onReset} type="submit">
            <Plus aria-hidden="true" size={18} /> Nova venda
          </button>
        </form>
      </div>
      <small className="pos-success__footer">{receiptFooter}</small>
    </section>
  );
}

function PosProgress({ activeStep }: { activeStep: (typeof posSteps)[number]["id"] }) {
  const activeIndex = posSteps.findIndex((step) => step.id === activeStep);

  return (
    <ol className="pos-sale__progress" aria-label="Progresso da venda">
      {posSteps.map((step, index) => (
        <li
          aria-current={step.id === activeStep ? "step" : undefined}
          className={step.id === activeStep ? "is-active" : index < activeIndex ? "is-done" : ""}
          key={step.id}
        >
          <span>{index < activeIndex ? <Check size={14} /> : index + 1}</span>
          <strong>{step.label}</strong>
        </li>
      ))}
    </ol>
  );
}

type FormContext = {
  businessId: string;
  branchId: string;
  terminalId: string;
  cart: PosCartItemInput[];
  idempotencyKey: string;
};

function PosContextFields({
  businessId,
  branchId,
  terminalId,
  cart,
  idempotencyKey
}: FormContext) {
  return (
    <>
      <input name="businessId" type="hidden" value={businessId} />
      <input name="branchId" type="hidden" value={branchId} />
      <input name="terminalId" type="hidden" value={terminalId} />
      <input name="cartItems" type="hidden" value={JSON.stringify(cart)} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    </>
  );
}

function ActionMessage({ status, message }: Pick<PosActionState, "status" | "message">) {
  if (!message) return null;

  return (
    <p
      className={`pos-sale__message pos-sale__message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function resolveCartLines(cart: PosCartItemInput[], catalog: PosCatalogItemContext[]) {
  return cart.flatMap((cartItem) => {
    const item = catalog.find((candidate) => candidate.id === cartItem.catalogItemId);
    return item ? [{ item, quantity: cartItem.quantity }] : [];
  });
}

function initialCart(state: PosActionState): PosCartItemInput[] {
  if (state.cart.length > 0) return state.cart;
  return (
    state.quote?.lines.map((line) => ({
      catalogItemId: line.catalogItemId,
      quantity: line.quantity
    })) ?? []
  );
}

function paymentIcon(method: PosPaymentMethod) {
  if (method === "cash") return Banknote;
  if (method === "card") return CreditCard;
  if (method === "points") return WalletCards;
  return Smartphone;
}

function paymentLabel(method: PosPaymentMethod): string {
  return {
    cash: "Numerário",
    card: "Cartão bancário",
    mpesa: "M-Pesa",
    emola: "e-Mola",
    mkesh: "mKesh",
    points: "YELAS"
  }[method];
}

function paymentHint(method: PosPaymentMethod): string {
  return {
    cash: "Confirmar no caixa",
    card: "Referência do TPA",
    mpesa: "Pagamento móvel",
    emola: "Pagamento móvel",
    mkesh: "Pagamento móvel",
    points: "Saldo integral"
  }[method];
}

function availablePaymentSummary(channels: PosPaymentChannelContext[], quote: PosQuote): string {
  if (quote.netAmountMznMinor === 0) return "YELAS";
  const labels = channels
    .filter((channel) => channel.status === "active" && ["cash", "card"].includes(channel.method))
    .map((channel) => paymentLabel(channel.method));
  return labels.length > 0 ? labels.join(" · ") : "Nenhum canal ativo";
}

function createBrowserIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pos_${crypto.randomUUID().replaceAll("-", "")}`;
  }

  return `pos_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}
