import {
  Archive,
  Ban,
  Boxes,
  Building2,
  CheckCircle2,
  CirclePause,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRoundCog
} from "lucide-react";

import { formatMznMinor } from "@/features/business-dashboard/model";

import {
  manageBusinessBranchAction,
  manageBusinessCatalogItemAction,
  manageBusinessMemberAction,
  manageCustomerCardAction,
  revokeBusinessInvitationAction
} from "./actions";
import type { BusinessOperationsState } from "./data";
import {
  getBusinessMemberRoleLabel,
  getMembershipStatusLabel,
  type BusinessCatalogItem,
  type BusinessOperationBranch,
  type BusinessOperationCard,
  type BusinessOperationMember
} from "./model";
import { TeamInviteForm } from "./team-invite-form";

export function BusinessOperationResult({ result }: { result?: string | undefined }) {
  if (!result) return null;
  const messages: Record<string, string> = {
    guardado: "Alteração guardada e registada na auditoria.",
    "convite-aceite": "Convite aceite. A área do negócio já está disponível.",
    "dados-invalidos": "Existem dados inválidos ou incompletos.",
    "limite-atingido": "O limite definido pelo plano atual foi atingido.",
    "operacao-bloqueada": "Esta operação está bloqueada porque existem registos associados.",
    erro: "Não foi possível concluir a operação. Confirme as permissões e tente novamente."
  };
  const isError = result !== "guardado" && result !== "convite-aceite";

  return (
    <div
      className={`business-operation-feedback business-operation-feedback--${isError ? "error" : "success"}`}
      role="status"
    >
      <p>{messages[result] ?? messages.erro}</p>
    </div>
  );
}

export function BusinessBranchesManagementView({
  state,
  businessId
}: {
  state: BusinessOperationsState;
  businessId: string;
}) {
  if (state.status !== "ready") return <OperationsNotice state={state} />;
  const activeCount = state.operations.branches.filter((branch) => branch.isActive).length;

  return (
    <div className="business-operation-stack">
      <div className="business-operation-summary">
        <OperationMetric label="Filiais" value={String(state.operations.branches.length)} />
        <OperationMetric label="Ativas" value={String(activeCount)} tone="teal" />
        <OperationMetric
          label="Equipa associada"
          value={String(
            state.operations.branches.reduce((sum, branch) => sum + branch.memberCount, 0)
          )}
        />
      </div>

      <details className="business-operation-editor business-operation-editor--create">
        <summary>
          <Plus aria-hidden="true" size={18} />
          Adicionar filial
        </summary>
        <BranchForm businessId={businessId} operation="create" />
      </details>

      <section className="business-operation-grid" aria-label="Gestão de filiais">
        {state.operations.branches.map((branch) => (
          <article className="business-operation-card" key={branch.id}>
            <header>
              <span className="business-operation-card__icon">
                <Building2 aria-hidden="true" size={19} />
              </span>
              <div>
                <h3>{branch.name}</h3>
                <p>
                  {branch.addressLine ||
                    `${branch.city}${branch.province ? `, ${branch.province}` : ""}`}
                </p>
              </div>
              <OperationStatus
                active={branch.isActive}
                label={branch.isPrimary ? "Sede" : undefined}
              />
            </header>
            <dl className="business-operation-facts">
              <Fact label="Transações" value={branch.transactionCount.toLocaleString("pt-MZ")} />
              <Fact label="Receita" value={formatMznMinor(branch.revenueMznMinor)} />
              <Fact label="Equipa" value={branch.memberCount.toLocaleString("pt-MZ")} />
              <Fact label="Contacto" value={branch.phone || branch.email || "Não definido"} />
            </dl>
            <details className="business-operation-editor">
              <summary>
                <Pencil aria-hidden="true" size={15} /> Editar dados
              </summary>
              <BranchForm branch={branch} businessId={businessId} operation="update" />
            </details>
            <div className="business-operation-actions">
              <OperationForm
                action={manageBusinessBranchAction}
                businessId={businessId}
                fields={{
                  branchId: branch.id,
                  operation: branch.isActive ? "suspend" : "activate"
                }}
                icon={branch.isActive ? <CirclePause size={15} /> : <CheckCircle2 size={15} />}
                label={branch.isActive ? "Suspender" : "Reativar"}
                disabled={branch.isPrimary && branch.isActive}
              />
              {!branch.isActive && !branch.isPrimary ? (
                <OperationForm
                  action={manageBusinessBranchAction}
                  businessId={businessId}
                  fields={{ branchId: branch.id, operation: "delete" }}
                  icon={<Trash2 size={15} />}
                  label="Eliminar"
                  tone="danger"
                />
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function BusinessTeamManagementView({
  state,
  businessId
}: {
  state: BusinessOperationsState;
  businessId: string;
}) {
  if (state.status !== "ready") return <OperationsNotice state={state} />;
  const pendingInvitations = state.operations.invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  return (
    <div className="business-operation-stack">
      <div className="business-operation-summary">
        <OperationMetric label="Membros" value={String(state.operations.members.length)} />
        <OperationMetric
          label="Acessos ativos"
          value={String(
            state.operations.members.filter((member) => member.status === "active").length
          )}
          tone="teal"
        />
        <OperationMetric label="Convites pendentes" value={String(pendingInvitations.length)} />
      </div>

      <section className="business-panel">
        <header>
          <h3>Convidar para a equipa</h3>
          <span>Ligação privada válida por 7 dias</span>
        </header>
        <TeamInviteForm businessId={businessId} branches={state.operations.branches} />
      </section>

      <section className="business-panel">
        <header>
          <h3>Equipa do negócio</h3>
          <span>{state.operations.members.length} membros</span>
        </header>
        <div className="business-operation-list">
          {state.operations.members.map((member) => (
            <MemberRow
              branches={state.operations.branches}
              businessId={businessId}
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </section>

      {state.operations.invitations.length ? (
        <section className="business-panel">
          <header>
            <h3>Histórico de convites</h3>
            <span>Sem exposição do token</span>
          </header>
          <div className="business-operation-list">
            {state.operations.invitations.map((invitation) => (
              <article className="business-operation-list__row" key={invitation.id}>
                <div>
                  <strong>{invitation.email || invitation.phone}</strong>
                  <span>
                    {getBusinessMemberRoleLabel(invitation.role)} ·{" "}
                    {invitation.branchName || "Todo o negócio"}
                  </span>
                </div>
                <span>{getMembershipStatusLabel(invitation.status)}</span>
                <small>Expira em {formatDate(invitation.expiresAt)}</small>
                {invitation.status === "pending" ? (
                  <OperationForm
                    action={revokeBusinessInvitationAction}
                    businessId={businessId}
                    fields={{ invitationId: invitation.id }}
                    icon={<Ban size={15} />}
                    label="Revogar"
                    tone="danger"
                  />
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function BusinessCatalogManagementView({
  state,
  businessId
}: {
  state: BusinessOperationsState;
  businessId: string;
}) {
  if (state.status !== "ready") return <OperationsNotice state={state} />;
  const availableCount = state.operations.catalogItems.filter((item) => item.isAvailable).length;

  return (
    <div className="business-operation-stack">
      <div className="business-operation-summary">
        <OperationMetric label="Itens" value={String(state.operations.catalogItems.length)} />
        <OperationMetric label="Disponíveis no POS" value={String(availableCount)} tone="teal" />
        <OperationMetric
          label="Produtos"
          value={String(
            state.operations.catalogItems.filter((item) => item.kind === "product").length
          )}
        />
      </div>

      <details className="business-operation-editor business-operation-editor--create">
        <summary>
          <PackagePlus aria-hidden="true" size={18} /> Adicionar produto ou serviço
        </summary>
        <CatalogItemForm
          branches={state.operations.branches}
          businessId={businessId}
          operation="create"
        />
      </details>

      {state.operations.catalogItems.length === 0 ? (
        <EmptyOperation
          title="Catálogo vazio"
          body="Adicione os itens que os operadores podem selecionar no POS."
        />
      ) : (
        <section className="business-operation-grid" aria-label="Catálogo do negócio">
          {state.operations.catalogItems.map((item) => (
            <article className="business-operation-card" key={item.id}>
              <header>
                <span className="business-operation-card__icon">
                  <Boxes aria-hidden="true" size={19} />
                </span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description || "Sem descrição"}</p>
                </div>
                <OperationStatus active={item.isAvailable} />
              </header>
              <dl className="business-operation-facts">
                <Fact label="Preço" value={formatMznMinor(item.priceMznMinor)} />
                <Fact label="Tipo" value={item.kind === "product" ? "Produto" : "Serviço"} />
                <Fact label="Filial" value={item.branchName || "Todas"} />
                <Fact label="SKU" value={item.sku || "Automático"} />
              </dl>
              <details className="business-operation-editor">
                <summary>
                  <Pencil aria-hidden="true" size={15} /> Editar item
                </summary>
                <CatalogItemForm
                  branches={state.operations.branches}
                  businessId={businessId}
                  item={item}
                  operation="update"
                />
              </details>
              <div className="business-operation-actions">
                <CatalogStatusForm businessId={businessId} item={item} />
                <CatalogStatusForm businessId={businessId} item={item} operation="delete" />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function BusinessCardsCustomersManagementView({
  state,
  businessId,
  mode
}: {
  state: BusinessOperationsState;
  businessId: string;
  mode: "cards" | "customers";
}) {
  if (state.status !== "ready") return <OperationsNotice state={state} />;
  const cards = state.operations.cards;
  const activeCount = cards.filter((card) => card.status === "active").length;

  return (
    <div className="business-operation-stack">
      <div className="business-operation-summary">
        <OperationMetric
          label={mode === "cards" ? "Cartões" : "Clientes"}
          value={String(cards.length)}
        />
        <OperationMetric label="Ativos" value={String(activeCount)} tone="teal" />
        <OperationMetric
          label="Valor em circulação"
          value={formatMznMinor(cards.reduce((sum, card) => sum + card.liabilityMznMinor, 0))}
        />
      </div>

      <section className="business-panel">
        <header>
          <h3>{mode === "cards" ? "Controlo de cartões digitais" : "Clientes do programa"}</h3>
          <span>Detalhe operacional e estado auditável</span>
        </header>
        {cards.length === 0 ? (
          <EmptyOperation
            title="Sem registos"
            body="Os clientes aparecem depois da adesão ao programa."
          />
        ) : (
          <div className="business-operation-list">
            {cards.map((card) => (
              <CustomerCardRow businessId={businessId} card={card} key={card.id} mode={mode} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BranchForm({
  businessId,
  operation,
  branch
}: {
  businessId: string;
  operation: "create" | "update";
  branch?: BusinessOperationBranch | undefined;
}) {
  return (
    <form action={manageBusinessBranchAction} className="business-operation-form">
      <input name="businessId" type="hidden" value={businessId} />
      <input name="branchId" type="hidden" value={branch?.id ?? ""} />
      <input name="operation" type="hidden" value={operation} />
      <label>
        <span>Nome</span>
        <input defaultValue={branch?.name} name="name" required />
      </label>
      <label>
        <span>Identificador</span>
        <input defaultValue={branch?.slug} name="slug" placeholder="gerado-pelo-nome" />
      </label>
      <label>
        <span>Cidade</span>
        <input defaultValue={branch?.city} name="city" required />
      </label>
      <label>
        <span>Província</span>
        <input defaultValue={branch?.province ?? ""} name="province" />
      </label>
      <label className="business-operation-form__wide">
        <span>Endereço</span>
        <input defaultValue={branch?.addressLine ?? ""} name="addressLine" />
      </label>
      <label>
        <span>Telefone</span>
        <input defaultValue={branch?.phone ?? ""} name="phone" type="tel" />
      </label>
      <label>
        <span>E-mail</span>
        <input defaultValue={branch?.email ?? ""} name="email" type="email" />
      </label>
      <label className="business-operation-checkbox">
        <input defaultChecked={branch?.isPrimary} name="isPrimary" type="checkbox" />
        <span>Definir como filial principal</span>
      </label>
      <button className="business-button business-button--primary" type="submit">
        <Save aria-hidden="true" size={16} /> Guardar filial
      </button>
    </form>
  );
}

function MemberRow({
  member,
  businessId,
  branches
}: {
  member: BusinessOperationMember;
  businessId: string;
  branches: BusinessOperationBranch[];
}) {
  const isOwner = member.role === "business_owner";
  return (
    <article className="business-operation-list__row business-operation-list__row--member">
      <span className="business-operation-avatar" aria-hidden="true">
        {initials(member.displayName)}
      </span>
      <div>
        <strong>{member.displayName}</strong>
        <span>{member.email || member.phone || "Contacto privado"}</span>
      </div>
      <span>{getBusinessMemberRoleLabel(member.role)}</span>
      <span>{member.branchName || "Todo o negócio"}</span>
      <OperationStatus
        active={member.status === "active"}
        label={getMembershipStatusLabel(member.status)}
      />
      {!isOwner ? (
        <details className="business-operation-editor business-operation-editor--inline">
          <summary>
            <UserRoundCog aria-hidden="true" size={15} /> Gerir
          </summary>
          <form action={manageBusinessMemberAction} className="business-operation-form">
            <input name="businessId" type="hidden" value={businessId} />
            <input name="memberId" type="hidden" value={member.id} />
            <label>
              <span>Função</span>
              <select defaultValue={member.role} name="role">
                <option value="cashier">Operador de caixa</option>
                <option value="branch_manager">Gestor de filial</option>
                <option value="business_admin">Administrador</option>
              </select>
            </label>
            <label>
              <span>Filial</span>
              <select defaultValue={member.branchId ?? ""} name="branchId">
                <option value="">Todo o negócio</option>
                {branches
                  .filter((branch) => branch.isActive)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="business-operation-actions">
              <button
                className="business-button business-button--primary"
                name="operation"
                type="submit"
                value="update"
              >
                Guardar
              </button>
              <button
                className="business-button"
                name="operation"
                type="submit"
                value={member.status === "active" ? "suspend" : "activate"}
              >
                {member.status === "active" ? "Suspender" : "Reativar"}
              </button>
              <button
                className="business-button business-button--danger"
                name="operation"
                type="submit"
                value="remove"
              >
                Remover
              </button>
            </div>
          </form>
        </details>
      ) : (
        <ShieldCheck aria-label="Proprietário protegido" size={18} />
      )}
    </article>
  );
}

function CatalogItemForm({
  branches,
  businessId,
  operation,
  item
}: {
  branches: BusinessOperationBranch[];
  businessId: string;
  operation: "create" | "update";
  item?: BusinessCatalogItem | undefined;
}) {
  return (
    <form action={manageBusinessCatalogItemAction} className="business-operation-form">
      <input name="businessId" type="hidden" value={businessId} />
      <input name="itemId" type="hidden" value={item?.id ?? ""} />
      <input name="operation" type="hidden" value={operation} />
      <label>
        <span>Nome</span>
        <input defaultValue={item?.name} name="name" required />
      </label>
      <label>
        <span>Tipo</span>
        <select defaultValue={item?.kind ?? "service"} name="kind">
          <option value="service">Serviço</option>
          <option value="product">Produto</option>
        </select>
      </label>
      <label>
        <span>Preço em MZN</span>
        <input
          defaultValue={item ? (item.priceMznMinor / 100).toFixed(2) : "0.00"}
          min="0"
          name="priceMzn"
          step="0.01"
          type="number"
        />
      </label>
      <label>
        <span>SKU</span>
        <input defaultValue={item?.sku ?? ""} name="sku" />
      </label>
      <label>
        <span>Filial</span>
        <select defaultValue={item?.branchId ?? ""} name="branchId">
          <option value="">Todas as filiais</option>
          {branches
            .filter((branch) => branch.isActive)
            .map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        <span>Ordem</span>
        <input defaultValue={item?.sortOrder ?? 100} min="0" name="sortOrder" type="number" />
      </label>
      <label className="business-operation-form__wide">
        <span>Descrição</span>
        <textarea defaultValue={item?.description ?? ""} name="description" rows={3} />
      </label>
      <button className="business-button business-button--primary" type="submit">
        <Save aria-hidden="true" size={16} /> Guardar item
      </button>
    </form>
  );
}

function CatalogStatusForm({
  businessId,
  item,
  operation
}: {
  businessId: string;
  item: BusinessCatalogItem;
  operation?: "delete" | undefined;
}) {
  const action = operation ?? (item.isAvailable ? "suspend" : "activate");
  return (
    <form action={manageBusinessCatalogItemAction}>
      {Object.entries({
        businessId,
        itemId: item.id,
        operation: action,
        branchId: item.branchId ?? "",
        kind: item.kind,
        sku: item.sku ?? "",
        name: item.name,
        description: item.description ?? "",
        priceMzn: (item.priceMznMinor / 100).toFixed(2),
        sortOrder: String(item.sortOrder)
      }).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={`business-button${operation === "delete" ? " business-button--danger" : ""}`}
        type="submit"
      >
        {operation === "delete" ? (
          <Trash2 size={15} />
        ) : item.isAvailable ? (
          <CirclePause size={15} />
        ) : (
          <CheckCircle2 size={15} />
        )}
        {operation === "delete" ? "Eliminar" : item.isAvailable ? "Suspender" : "Disponibilizar"}
      </button>
    </form>
  );
}

function CustomerCardRow({
  card,
  businessId,
  mode
}: {
  card: BusinessOperationCard;
  businessId: string;
  mode: "cards" | "customers";
}) {
  return (
    <article className="business-operation-list__row business-operation-list__row--customer">
      <span className="business-operation-avatar" aria-hidden="true">
        {initials(card.customerName)}
      </span>
      <div>
        <strong>{mode === "cards" ? card.cardNumber : card.customerName}</strong>
        <span>{mode === "cards" ? card.customerName : card.cardNumber}</span>
      </div>
      <strong>{card.availablePoints.toLocaleString("pt-MZ")} YL</strong>
      <span>{formatMznMinor(card.totalSpentMznMinor)}</span>
      <OperationStatus active={card.status === "active"} label={cardStatusLabel(card.status)} />
      <details className="business-operation-editor business-operation-editor--inline">
        <summary>
          <Pencil aria-hidden="true" size={15} /> Detalhes
        </summary>
        <dl className="business-operation-facts business-operation-facts--detail">
          <Fact label="Cliente" value={card.customerName} />
          <Fact label="E-mail" value={card.email || "Não definido"} />
          <Fact label="Telefone" value={card.phone || "Não definido"} />
          <Fact label="Adesão" value={formatDate(card.joinedAt)} />
          <Fact label="Transações" value={String(card.transactionCount)} />
          <Fact
            label="Última compra"
            value={card.lastTransactionAt ? formatDate(card.lastTransactionAt) : "Sem compras"}
          />
          <Fact label="YELAS ganhas" value={`${card.lifetimeEarned.toLocaleString("pt-MZ")} YL`} />
          <Fact
            label="YELAS utilizadas"
            value={`${card.lifetimeRedeemed.toLocaleString("pt-MZ")} YL`}
          />
        </dl>
        <form
          action={manageCustomerCardAction}
          className="business-operation-form business-operation-form--card-action"
        >
          <input name="businessId" type="hidden" value={businessId} />
          <input name="cardId" type="hidden" value={card.id} />
          <input
            name="returnView"
            type="hidden"
            value={mode === "cards" ? "cartoes" : "clientes"}
          />
          <label className="business-operation-form__wide">
            <span>Motivo da alteração</span>
            <input name="reason" placeholder="Obrigatório para bloquear ou arquivar" />
          </label>
          <div className="business-operation-actions">
            {card.status === "active" ? (
              <button className="business-button" name="operation" type="submit" value="block">
                <Ban size={15} /> Bloquear
              </button>
            ) : (
              <button
                className="business-button business-button--primary"
                name="operation"
                type="submit"
                value="activate"
              >
                <CheckCircle2 size={15} /> Reativar
              </button>
            )}
            {card.status !== "archived" ? (
              <button
                className="business-button business-button--danger"
                name="operation"
                type="submit"
                value="archive"
              >
                <Archive size={15} /> Arquivar
              </button>
            ) : null}
          </div>
        </form>
      </details>
    </article>
  );
}

function OperationForm({
  action,
  businessId,
  fields,
  icon,
  label,
  tone,
  disabled
}: {
  action: (formData: FormData) => Promise<void>;
  businessId: string;
  fields: Record<string, string>;
  icon: React.ReactNode;
  label: string;
  tone?: "danger" | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <form action={action}>
      <input name="businessId" type="hidden" value={businessId} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <button
        className={`business-button${tone === "danger" ? " business-button--danger" : ""}`}
        disabled={disabled}
        type="submit"
      >
        {icon}
        {label}
      </button>
    </form>
  );
}

function OperationsNotice({
  state
}: {
  state: Exclude<BusinessOperationsState, { status: "ready" }>;
}) {
  return (
    <section className="business-portal-notice">
      <h2>Gestão indisponível</h2>
      <p>{state.message}</p>
    </section>
  );
}

function EmptyOperation({ title, body }: { title: string; body: string }) {
  return (
    <div className="business-operation-empty">
      <Boxes aria-hidden="true" size={22} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function OperationMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "teal" | undefined;
}) {
  return (
    <article
      className={`business-operation-metric${tone ? " business-operation-metric--teal" : ""}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function OperationStatus({ active, label }: { active: boolean; label?: string | undefined }) {
  return (
    <span
      className={`business-operation-status business-operation-status--${active ? "active" : "inactive"}`}
    >
      {label ?? (active ? "Ativo" : "Inativo")}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function initials(value: string): string {
  const parts = value.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "V"}${parts[1]?.[0] ?? parts[0]?.[1] ?? "Y"}`.toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium" }).format(new Date(value));
}

function cardStatusLabel(value: string): string {
  return value === "blocked" ? "Bloqueado" : value === "archived" ? "Arquivado" : "Ativo";
}
