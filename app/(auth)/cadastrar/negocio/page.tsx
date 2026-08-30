import type { Metadata } from "next";
import { BusinessRegistrationView } from "@/features/auth/business-registration-view";

export const metadata: Metadata = {
  title: "Criar conta de negócio",
  description: "Crie credenciais exclusivas e registe o seu negócio na VUYELA.",
  robots: { index: false, follow: false }
};

export default function BusinessSignUpPage() {
  return <BusinessRegistrationView />;
}
