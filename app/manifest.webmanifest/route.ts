import { getPwaManifest } from "@/features/pwa/apps";

export function GET() {
  return new Response(JSON.stringify(getPwaManifest("cliente")), {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/manifest+json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
