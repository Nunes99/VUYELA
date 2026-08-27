import type { Metadata } from "next";

import { BusinessInvitationView } from "@/features/business-operations/invitation-view";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ativar acesso ao POS",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AcceptPosInvitationPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";
  const invalid = params.estado === "invalido" || !/^[0-9a-f]{48}$/.test(token);
  const authContext = await getAuthContext();

  return (
    <BusinessInvitationView
      destination="pos"
      invalid={invalid}
      principal={authContext.principal}
      token={token}
    />
  );
}
