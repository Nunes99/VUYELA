export interface ReferralActionState {
  status: "idle" | "error" | "success";
  message: string;
  referralCode: string | null;
}

export interface ReferralProgramActionState {
  status: "idle" | "error" | "success";
  message: string;
}

export const initialReferralActionState: ReferralActionState = {
  status: "idle",
  message: "",
  referralCode: null
};

export const initialReferralProgramActionState: ReferralProgramActionState = {
  status: "idle",
  message: ""
};
