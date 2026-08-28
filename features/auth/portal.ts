export const authPortals = ["customer", "business", "pos", "admin"] as const;

export type AuthPortal = (typeof authPortals)[number];

const portalDefaults: Record<
  AuthPortal,
  { destination: string; loginPath: string; pathPrefix: string }
> = {
  customer: { destination: "/cliente", loginPath: "/cliente/entrar", pathPrefix: "/cliente" },
  business: { destination: "/negocio", loginPath: "/negocio/entrar", pathPrefix: "/negocio" },
  pos: { destination: "/pos", loginPath: "/pos/entrar", pathPrefix: "/pos" },
  admin: { destination: "/admin", loginPath: "/admin/entrar", pathPrefix: "/admin" }
};

export function parseAuthPortal(value: string | string[] | null | undefined): AuthPortal {
  return typeof value === "string" && authPortals.includes(value as AuthPortal)
    ? (value as AuthPortal)
    : "customer";
}

export function getPortalDestination(portal: AuthPortal): string {
  return portalDefaults[portal].destination;
}

export function getPortalLoginPath(portal: AuthPortal): string {
  return portalDefaults[portal].loginPath;
}

export function getPortalNextPath(
  portal: AuthPortal,
  value: string | string[] | null | undefined
): string {
  const fallback = getPortalDestination(portal);
  const pathPrefix = portalDefaults[portal].pathPrefix;

  if (typeof value !== "string" || !isPortalPath(value, pathPrefix) || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function isPortalPath(value: string, pathPrefix: string): boolean {
  return (
    value === pathPrefix ||
    value.startsWith(`${pathPrefix}/`) ||
    value.startsWith(`${pathPrefix}?`) ||
    value.startsWith(`${pathPrefix}#`)
  );
}

export function getPasswordRecoveryPath(portal: AuthPortal, nextPath?: string): string {
  const params = new URLSearchParams({ portal });
  params.set("next", getPortalNextPath(portal, nextPath));
  return `/recuperar-acesso?${params.toString()}`;
}

export function getDefinePasswordPath(portal: AuthPortal, nextPath?: string): string {
  const params = new URLSearchParams({ portal });
  params.set("next", getPortalNextPath(portal, nextPath));
  return `/definir-senha?${params.toString()}`;
}
