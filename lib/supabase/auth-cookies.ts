const supabaseAuthCookiePattern = /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/i;

export function isSupabaseAuthCookieName(name: string): boolean {
  return supabaseAuthCookiePattern.test(name);
}
