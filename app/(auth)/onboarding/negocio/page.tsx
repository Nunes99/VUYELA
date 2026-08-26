import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Registar negócio",
  description: "Registe um negócio para validação na VUYELA.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  redirect("/cadastrar/negocio");
}
