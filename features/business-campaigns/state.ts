export interface CampaignActionState {
  status: "idle" | "error" | "success";
  message: string;
  campaignId: string | null;
}

export const initialCampaignActionState: CampaignActionState = {
  status: "idle",
  message: "",
  campaignId: null
};
