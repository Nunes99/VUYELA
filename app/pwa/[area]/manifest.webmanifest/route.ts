import { getPwaManifest, isPwaArea, pwaAreas } from "@/features/pwa/apps";

export function generateStaticParams() {
  return pwaAreas.map((area) => ({ area }));
}

export async function GET(_request: Request, context: { params: Promise<{ area: string }> }) {
  const { area } = await context.params;

  if (!isPwaArea(area)) {
    return new Response("Manifesto não encontrado.", { status: 404 });
  }

  return new Response(JSON.stringify(getPwaManifest(area)), {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/manifest+json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
