import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { isSupabaseAuthCookieName } from "@/lib/supabase/auth-cookies";

type CookieToSet = {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Server Actions and Route Handlers can.
        }
      }
    }
  });
}

export async function clearSupabaseAuthCookies() {
  const cookieStore = await cookies();

  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      cookieStore.set(cookie.name, "", {
        expires: new Date(0),
        maxAge: 0,
        path: "/"
      });
    }
  }
}
