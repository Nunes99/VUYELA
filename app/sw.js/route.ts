import { buildServiceWorkerSource } from "@/features/pwa/service-worker";

export const dynamic = "force-dynamic";

export function GET() {
  const deploymentVersion =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    "local";

  return new Response(buildServiceWorkerSource(deploymentVersion), {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
