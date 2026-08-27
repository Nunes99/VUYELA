import type { Metadata } from "next";

import MfaPage from "@/app/(auth)/mfa/page";

export const metadata: Metadata = {
  title: "Verificação administrativa",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default MfaPage;
