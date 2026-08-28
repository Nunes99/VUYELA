"use server";

import { revalidatePath } from "next/cache";

import { requireRouteAccess } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !uuidPattern.test(notificationId)) {
    return;
  }

  await requireRouteAccess("/cliente", "/cliente");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId
  });

  if (!error) {
    revalidatePath("/cliente");
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await requireRouteAccess("/cliente", "/cliente?vista=notificacoes");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("channel", "in_app")
    .in("status", ["sent", "delivered"])
    .is("read_at", null);

  if (!error) {
    revalidatePath("/cliente");
  }
}
