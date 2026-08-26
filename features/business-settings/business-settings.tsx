import Link from "next/link";
import { Building2, Gift, MapPin, Save, Store } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select, Textarea } from "../../vuyela-design-system/src/components/Field";
import { BusinessProfileHeader } from "@/features/business-dashboard/dashboard";
import { updateBusinessSettingsAction } from "./actions";
import type { BusinessSettingsState } from "./data";

export function BusinessSettingsView({
  state,
  saveStatus
}: {
  state: BusinessSettingsState;
  saveStatus?: string;
}) {
  if (state.status !== "ready") {
    return (
      <section className="business-settings-notice" role="status">
        <h2>Definições indisponíveis</h2>
        <p>{state.message}</p>
        <Link href="/negocio">Voltar ao painel</Link>
      </section>
    );
  }

  const { settings } = state;

  return (
    <div className="business-settings">
      <BusinessProfileHeader
        activeTab="definicoes"
        business={{
          id: settings.business.id,
          name: settings.business.name,
          status: "active"
        }}
        scopeLabel="Perfil público e configuração operacional"
      />
      <header className="business-settings__header">
        <div>
          <span className="business-dashboard-eyebrow">Gestão do conteúdo</span>
          <h2>Definições do negócio</h2>
          <p>Atualize o perfil público, as regras de YELAS e os dados da filial principal.</p>
        </div>
        <Link href={`/negocio?businessId=${encodeURIComponent(settings.business.id)}`}>
          Voltar ao painel
        </Link>
      </header>

      {settings.businesses.length > 1 ? (
        <nav className="business-settings__switcher" aria-label="Selecionar negócio">
          {settings.businesses.map((business) => (
            <Link
              aria-current={business.id === settings.business.id ? "page" : undefined}
              className={business.id === settings.business.id ? "is-active" : undefined}
              href={`/negocio/definicoes?businessId=${encodeURIComponent(business.id)}`}
              key={business.id}
            >
              {business.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {saveStatus === "guardado" ? (
        <p className="business-settings__message business-settings__message--success" role="status">
          Definições guardadas e páginas públicas atualizadas.
        </p>
      ) : null}
      {saveStatus === "erro" ? (
        <p className="business-settings__message business-settings__message--error" role="alert">
          Não foi possível guardar. Reveja os campos obrigatórios e tente novamente.
        </p>
      ) : null}

      <form action={updateBusinessSettingsAction} className="business-settings__form">
        <input name="businessId" type="hidden" value={settings.business.id} />
        <input name="branchId" type="hidden" value={settings.branch?.id ?? ""} />

        <section aria-labelledby="business-profile-title" className="business-settings__section">
          <SectionHeading
            body="Informação usada na página do estabelecimento e na descoberta pública."
            icon={<Building2 aria-hidden="true" size={21} />}
            id="business-profile-title"
            title="Perfil público"
          />
          <div className="business-settings__grid">
            <Input
              defaultValue={settings.business.name}
              label="Nome comercial"
              maxLength={120}
              name="name"
              required
              requiredMark
            />
            <Select
              defaultValue={settings.business.categoryId}
              label="Categoria"
              name="categoryId"
              required
              requiredMark
            >
              <option disabled value="">
                Selecione uma categoria
              </option>
              {settings.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Textarea
              className="business-settings__wide"
              defaultValue={settings.business.description}
              hint="Mínimo recomendado: 30 caracteres. Explique claramente o que o negócio oferece."
              label="Descrição"
              maxLength={1200}
              minLength={30}
              name="description"
              required
              requiredMark
              rows={5}
            />
            <Input
              autoComplete="tel"
              defaultValue={settings.business.phone}
              inputMode="tel"
              label="Telefone público"
              name="phone"
              placeholder="+258 84 000 0000"
            />
            <Input
              autoComplete="email"
              defaultValue={settings.business.email}
              label="E-mail público"
              name="email"
              type="email"
            />
            <Input
              className="business-settings__wide"
              defaultValue={settings.business.websiteUrl}
              label="Website"
              name="websiteUrl"
              placeholder="https://"
              type="url"
            />
          </div>
        </section>

        <section aria-labelledby="loyalty-program-title" className="business-settings__section">
          <SectionHeading
            body="Estas regras são aplicadas pelo POS e apresentadas ao cliente antes da utilização."
            icon={<Gift aria-hidden="true" size={21} />}
            id="loyalty-program-title"
            title="Programa de fidelização"
          />
          <div className="business-settings__grid business-settings__grid--three">
            <Input
              defaultValue={settings.program.name}
              label="Nome do programa"
              name="programName"
              required
              requiredMark
            />
            <Input
              defaultValue={settings.program.earnPercent}
              label="Recompensa por compra (%)"
              max={100}
              min={0}
              name="earnPercent"
              required
              requiredMark
              step="0.01"
              type="number"
            />
            <Input
              defaultValue={settings.program.pointValueMzn}
              label="Valor de 1 YELA (MZN)"
              min={0.01}
              name="pointValueMzn"
              required
              requiredMark
              step="0.01"
              type="number"
            />
            <Input
              defaultValue={settings.program.maximumRedemptionPercent}
              label="Máximo da compra em YELAS (%)"
              max={100}
              min={0}
              name="maximumRedemptionPercent"
              required
              requiredMark
              step="0.01"
              type="number"
            />
            <Input
              defaultValue={settings.program.pointsExpireAfterDays ?? ""}
              hint="Deixe vazio para não expirar."
              label="Validade das YELAS (dias)"
              min={1}
              name="pointsExpireAfterDays"
              type="number"
            />
            <Textarea
              className="business-settings__wide"
              defaultValue={settings.program.terms}
              label="Termos do programa"
              maxLength={1600}
              name="programTerms"
              required
              requiredMark
              rows={4}
            />
          </div>
        </section>

        <section aria-labelledby="branch-profile-title" className="business-settings__section">
          <SectionHeading
            body="Localização e contactos usados na página pública e no contexto do POS."
            icon={<MapPin aria-hidden="true" size={21} />}
            id="branch-profile-title"
            title="Filial principal"
          />
          {settings.branch ? (
            <div className="business-settings__grid">
              <Input
                defaultValue={settings.branch.name}
                label="Nome da filial"
                name="branchName"
                required
                requiredMark
              />
              <Input
                defaultValue={settings.branch.city}
                label="Cidade"
                name="branchCity"
                required
                requiredMark
              />
              <Input
                className="business-settings__wide"
                defaultValue={settings.branch.addressLine}
                label="Endereço"
                name="branchAddressLine"
                required
                requiredMark
              />
              <Input
                defaultValue={settings.branch.province}
                label="Província"
                name="branchProvince"
              />
              <Input
                defaultValue={settings.branch.phone}
                inputMode="tel"
                label="Telefone da filial"
                name="branchPhone"
              />
              <Input
                defaultValue={settings.branch.email}
                label="E-mail da filial"
                name="branchEmail"
                type="email"
              />
            </div>
          ) : (
            <div className="business-settings__empty">
              <Store aria-hidden="true" size={22} />
              <p>Crie uma filial antes de configurar a localização pública.</p>
            </div>
          )}
        </section>

        <div className="business-settings__save">
          <p>As alterações ficam registadas no histórico de auditoria do negócio.</p>
          <Button
            leadingIcon={<Save aria-hidden="true" size={19} />}
            size="lg"
            type="submit"
            variant="primary"
          >
            Guardar definições
          </Button>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({
  icon,
  id,
  title,
  body
}: {
  icon: ReactNode;
  id: string;
  title: string;
  body: string;
}) {
  return (
    <header className="business-settings__section-heading">
      <span>{icon}</span>
      <div>
        <h3 id={id}>{title}</h3>
        <p>{body}</p>
      </div>
    </header>
  );
}
