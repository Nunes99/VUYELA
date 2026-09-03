import "server-only";

import { revalidatePath } from "next/cache";

const publicMarketplacePages = [
  "/",
  "/clientes",
  "/estabelecimentos",
  "/categorias",
  "/locais",
  "/ofertas"
] as const;

const publicMarketplaceDynamicPages = [
  "/estabelecimentos/[slug]",
  "/categorias/[slug]",
  "/locais/[cidade]",
  "/locais/[cidade]/[categoria]",
  "/ofertas/[slug]"
] as const;

export function revalidatePublicMarketplacePaths(): void {
  for (const path of publicMarketplacePages) {
    revalidatePath(path);
  }

  for (const path of publicMarketplaceDynamicPages) {
    revalidatePath(path, "page");
  }
}
