"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "../../vuyela-design-system/src/components/Button";
import { Input } from "../../vuyela-design-system/src/components/Field";

import { configureReferralProgramAction } from "./actions";
import { initialReferralProgramActionState } from "./state";
import type { ReferralProgramRules } from "./model";

export function ReferralProgramForm({
  businessId,
  rules
}: {
  businessId: string;
  rules: ReferralProgramRules;
}) {
  const [state, formAction, pending] = useActionState(
    configureReferralProgramAction,
    initialReferralProgramActionState
  );

  return (
    <form action={formAction} className="referral-program-form">
      <input type="hidden" name="businessId" value={businessId} />
      <label className="referral-toggle">
        <input name="isActive" type="checkbox" defaultChecked={rules.isActive} />
        <span>Programa ativo</span>
      </label>

      <div className="referral-program-form-grid">
        <Input
          label="Compra mínima (MZN)"
          name="minimumPurchaseMzn"
          inputMode="decimal"
          defaultValue={(rules.qualifyingPurchaseMinimumMznMinor / 100).toFixed(2)}
          requiredMark
          required
        />
        <Input
          label="Prémio do indicador"
          name="referrerRewardPoints"
          inputMode="numeric"
          min={1}
          max={1000000}
          defaultValue={rules.referrerRewardPoints}
          requiredMark
          required
        />
        <Input
          label="Prémio do convidado"
          name="referredRewardPoints"
          inputMode="numeric"
          min={0}
          max={1000000}
          defaultValue={rules.referredRewardPoints}
          requiredMark
          required
        />
        <Input
          label="Validade do convite (dias)"
          name="inviteValidDays"
          inputMode="numeric"
          min={1}
          max={90}
          defaultValue={rules.inviteValidDays}
          requiredMark
          required
        />
        <Input
          label="Convites abertos por cliente"
          name="maxOpenInvites"
          inputMode="numeric"
          min={1}
          max={100}
          defaultValue={rules.maxOpenInvitesPerReferrer}
          requiredMark
          required
        />
        <Input
          label="Prémios por período"
          name="rewardLimitCount"
          inputMode="numeric"
          min={1}
          max={1000}
          defaultValue={rules.rewardLimitCount}
          requiredMark
          required
        />
        <Input
          label="Período do limite (dias)"
          name="rewardLimitPeriodDays"
          inputMode="numeric"
          min={1}
          max={365}
          defaultValue={rules.rewardLimitPeriodDays}
          requiredMark
          required
        />
      </div>

      <Button type="submit" loading={pending} leadingIcon={<Save size={18} />}>
        Guardar regras
      </Button>

      {state.message ? (
        <p
          className={`referral-message referral-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
