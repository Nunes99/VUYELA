import { processPendingNotifications } from "@/features/notifications/worker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return Response.json({ error: "Notification worker is not configured." }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await processPendingNotifications(50);

    return Response.json({ ok: true, summary });
  } catch {
    return Response.json({ error: "Notification processing failed." }, { status: 500 });
  }
}
