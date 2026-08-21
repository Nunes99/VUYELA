"use client";

import { useActionState } from "react";
import { Megaphone, Save } from "lucide-react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input, Select, Textarea } from "../../vuyela-design-system/src/components/Field";
import { submitCampaignAction } from "./actions";
import { campaignTypes, getCampaignTypeLabel } from "./model";
import { initialCampaignActionState } from "./state";
import type { BusinessCampaignBusinessOption } from "./data";

export function CampaignCreationForm({
  businesses,
  selectedBusinessId,
  emailDeliveryConfigured
}: {
  businesses: BusinessCampaignBusinessOption[];
  selectedBusinessId: string;
  emailDeliveryConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitCampaignAction,
    initialCampaignActionState
  );

  return (
    <form action={formAction} className="business-campaign-form">
      <div className="business-campaign-form-grid">
        <Select
          label="Negócio"
          name="businessId"
          defaultValue={selectedBusinessId}
          requiredMark
          required
        >
          {businesses.map((business) => (
            <option value={business.id} key={business.id}>
              {business.name}
            </option>
          ))}
        </Select>

        <Input label="Nome" name="name" maxLength={80} requiredMark required />

        <Select
          label="Tipo"
          name="campaignType"
          defaultValue="inactive_customer"
          requiredMark
          required
        >
          {campaignTypes.map((type) => (
            <option value={type} key={type}>
              {getCampaignTypeLabel(type)}
            </option>
          ))}
        </Select>

        <Select
          label="Canal planeado"
          name="plannedChannel"
          defaultValue="in_app"
          requiredMark
          required
        >
          <option value="in_app">In-app</option>
          <option value="email" disabled={!emailDeliveryConfigured}>
            {emailDeliveryConfigured ? "E-mail" : "E-mail (por configurar)"}
          </option>
          <option value="sms" disabled>
            SMS (brevemente)
          </option>
          <option value="whatsapp" disabled>
            WhatsApp (brevemente)
          </option>
          <option value="push" disabled>
            Push (brevemente)
          </option>
        </Select>

        <Input label="Início" name="startsAt" type="datetime-local" />
        <Input label="Fim" name="endsAt" type="datetime-local" />
      </div>

      <div className="business-campaign-form-section">
        <span className="business-dashboard-eyebrow">Notificação</span>
        <div className="business-campaign-form-grid">
          <Input label="Assunto" name="notificationSubject" maxLength={120} requiredMark required />
          <Textarea
            className="business-campaign-message-field"
            label="Mensagem"
            name="notificationBody"
            minLength={10}
            maxLength={2000}
            rows={4}
            requiredMark
            required
          />
        </div>
      </div>

      <div className="business-campaign-form-section">
        <span className="business-dashboard-eyebrow">Benefício</span>
        <div className="business-campaign-form-grid">
          <Select
            label="Regra"
            name="rewardType"
            defaultValue="points_multiplier"
            requiredMark
            required
          >
            <option value="points_multiplier">Multiplicador de pontos</option>
            <option value="bonus_points">Pontos bonus</option>
            <option value="discount_percent">Desconto percentual</option>
            <option value="message_only">Mensagem</option>
          </Select>
          <Input
            label="Multiplicador"
            name="pointsMultiplier"
            inputMode="decimal"
            placeholder="2"
          />
          <Input label="Pontos bonus" name="bonusPoints" inputMode="numeric" />
          <Input label="Desconto (%)" name="discountPercent" inputMode="decimal" />
        </div>
      </div>

      <div className="business-campaign-form-section">
        <span className="business-dashboard-eyebrow">Segmento</span>
        <div className="business-campaign-form-grid">
          <Input label="Cidade" name="city" placeholder="Maputo" />
          <Input label="Tier" name="tierName" placeholder="VIP" />
          <Input label="Compras mínimas" name="minPurchaseCount" inputMode="numeric" />
          <Input label="Compras máximas" name="maxPurchaseCount" inputMode="numeric" />
          <Input label="Gasto mínimo (MZN)" name="minTotalSpentMzn" inputMode="decimal" />
          <Input label="Dias inativo" name="lastPurchaseBeforeDays" inputMode="numeric" />
          <Input label="Pontos mínimos" name="minPointsBalance" inputMode="numeric" />
        </div>
        <label className="business-campaign-check">
          <input name="requiresMarketingConsent" type="checkbox" defaultChecked />
          <span>Exigir consentimento de marketing</span>
        </label>
      </div>

      <div className="business-campaign-actions">
        <Button
          type="submit"
          name="intent"
          value="publish"
          variant="primary"
          loading={pending}
          leadingIcon={<Megaphone size={18} />}
        >
          Criar campanha
        </Button>
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          loading={pending}
          leadingIcon={<Save size={18} />}
        >
          Guardar rascunho
        </Button>
      </div>

      {state.message ? (
        <p
          className={`business-campaign-message business-campaign-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
