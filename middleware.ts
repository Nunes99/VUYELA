import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseAuthCookieName } from "@/lib/supabase/auth-cookies";

interface CookieToSet {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
}

function getSafeMfaNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

const publicPortalPaths = [
  "/cliente/entrar",
  "/negocio/entrar",
  "/negocio/convite",
  "/pos/entrar",
  "/pos/convite",
  "/admin/entrar"
];

function isPublicPortalPath(pathname: string): boolean {
  return publicPortalPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function getRequestedPath(request: NextRequest): string {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/mfa" || pathname === "/admin/mfa") {
    return getSafeMfaNextPath(request.nextUrl.searchParams.get("next"));
  }

  return `${pathname}${search}`;
}

function getSignInPath(pathname: string, nextPath: string): string {
  if (pathname.startsWith("/admin") || nextPath.startsWith("/admin")) {
    return "/admin/entrar";
  }
  if (pathname.startsWith("/pos")) {
    return "/pos/entrar";
  }
  if (pathname.startsWith("/negocio")) {
    return "/negocio/entrar";
  }
  if (pathname.startsWith("/cliente")) {
    return "/cliente/entrar";
  }

  return "/entrar";
}

function expireResponseAuthCookies(response: NextResponse, cookieNames: string[]) {
  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/"
    });
  }
}

function clearStaleRequestSession(request: NextRequest) {
  const cookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter(isSupabaseAuthCookieName);

  for (const name of cookieNames) {
    request.cookies.set(name, "");
  }

  const response = NextResponse.next({ request });
  expireResponseAuthCookies(response, cookieNames);
  return { cookieNames, response };
}

function protectResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function middleware(request: NextRequest) {
  if (isPublicPortalPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  const nextPath = getRequestedPath(request);
  const signInUrl = new URL(getSignInPath(request.nextUrl.pathname, nextPath), request.url);
  signInUrl.searchParams.set("next", nextPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub || error) {
    const clearedSession = clearStaleRequestSession(request);

    if (request.nextUrl.pathname === "/mfa" || request.nextUrl.pathname === "/admin/mfa") {
      const redirectResponse = NextResponse.redirect(signInUrl);
      expireResponseAuthCookies(redirectResponse, clearedSession.cookieNames);
      return protectResponse(redirectResponse);
    }

    return protectResponse(clearedSession.response);
  }

  return protectResponse(response);
}

export const config = {
  matcher: [
    "/mfa",
    "/cliente/:path*",
    "/negocio/:path*",
    "/pos/:path*",
    "/admin/:path*"
  ]
};
