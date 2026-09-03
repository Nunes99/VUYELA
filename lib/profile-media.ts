import "server-only";

import { randomUUID } from "node:crypto";

import {
  ImageUploadError,
  imageFile,
  imageFileExtension,
  validateImageFile
} from "@/lib/image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const storageBucket = "profile-media";
const signedUrlLifetimeSeconds = 60 * 60;

export class ProfileMediaError extends Error {
  constructor(
    public readonly code: "invalid-file" | "upload-failed",
    message: string
  ) {
    super(message);
    this.name = "ProfileMediaError";
  }
}

export function profileMediaFile(formData: FormData, fieldName: string): File | null {
  return imageFile(formData, fieldName);
}

export async function uploadProfileAvatar(
  supabase: SupabaseServerClient,
  profileId: string,
  file: File
): Promise<string> {
  try {
    await validateImageFile(file);
  } catch (error) {
    if (!(error instanceof ImageUploadError)) throw error;
    throw new ProfileMediaError("invalid-file", error.message);
  }

  const extension = imageFileExtension(file);
  const objectPath = `${profileId}/avatar/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(storageBucket).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });

  if (error) {
    throw new ProfileMediaError("upload-failed", "Não foi possível carregar a fotografia.");
  }

  return objectPath;
}

export async function removeProfileAvatar(
  supabase: SupabaseServerClient,
  profileId: string,
  objectPath: string | null | undefined
): Promise<void> {
  if (!isOwnedProfileAvatarPath(profileId, objectPath)) return;
  await supabase.storage.from(storageBucket).remove([objectPath]);
}

export async function createProfileAvatarUrl(
  supabase: SupabaseServerClient,
  profileId: string,
  objectPath: string | null | undefined
): Promise<string | null> {
  if (!isOwnedProfileAvatarPath(profileId, objectPath)) return null;

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(objectPath, signedUrlLifetimeSeconds);

  return error ? null : data.signedUrl;
}

export async function getOwnProfileAvatarUrl(profileId: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", profileId)
      .maybeSingle();

    if (error) return null;
    const row = data as { avatar_path: string | null } | null;
    return createProfileAvatarUrl(supabase, profileId, row?.avatar_path);
  } catch {
    return null;
  }
}

export function isOwnedProfileAvatarPath(
  profileId: string,
  objectPath: string | null | undefined
): objectPath is string {
  if (!objectPath) return false;
  return new RegExp(`^${escapeRegExp(profileId)}/avatar/[0-9a-f-]{36}\\.(?:jpg|png|webp)$`).test(
    objectPath
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
