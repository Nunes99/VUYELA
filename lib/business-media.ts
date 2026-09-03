import "server-only";

import { randomUUID } from "node:crypto";

import { businessMediaMaxBytes } from "@/lib/business-media-config";
import {
  ImageUploadError,
  imageFile,
  imageFileExtension,
  validateImageFile
} from "@/lib/image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BusinessMediaEntity =
  | "catalog"
  | "offer"
  | "business_logo"
  | "business_cover";

type BusinessMediaFolder = "catalog" | "offers" | "profile" | "logo";
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const storageBucket = "business-media";
const publicObjectMarker = `/storage/v1/object/public/${storageBucket}/`;
export class BusinessMediaError extends Error {
  constructor(
    public readonly code: "invalid-file" | "upload-failed" | "save-failed",
    message: string
  ) {
    super(message);
    this.name = "BusinessMediaError";
  }
}

export function mediaFile(formData: FormData, fieldName: string): File | null {
  return imageFile(formData, fieldName);
}

export async function validateBusinessMediaFile(file: File | null): Promise<void> {
  try {
    await validateImageFile(file, businessMediaMaxBytes);
  } catch (error) {
    if (!(error instanceof ImageUploadError)) throw error;
    throw new BusinessMediaError(
      "invalid-file",
      "A imagem deve ser JPEG, PNG ou WebP e ter no máximo 5 MB."
    );
  }
}

export async function removeBusinessMediaObject(
  supabase: SupabaseServerClient,
  publicUrl: string | null | undefined
): Promise<void> {
  await removeStoredObject(supabase, publicUrl);
}

export async function updateBusinessMedia({
  supabase,
  businessId,
  entityType,
  entityId,
  file,
  previousUrl,
  remove
}: {
  supabase: SupabaseServerClient;
  businessId: string;
  entityType: BusinessMediaEntity;
  entityId: string;
  file: File | null;
  previousUrl?: string | null | undefined;
  remove: boolean;
}): Promise<void> {
  if (!file && !remove) return;

  if (!file) {
    await saveMediaUrl(supabase, businessId, entityType, entityId, null);
    await removeStoredObject(supabase, previousUrl);
    return;
  }

  await validateBusinessMediaFile(file);
  const extension = imageFileExtension(file);

  const folder = mediaFolder(entityType);
  const objectPath = `${businessId}/${folder}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(objectPath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    throw new BusinessMediaError("upload-failed", "Não foi possível carregar a imagem.");
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath);

  try {
    await saveMediaUrl(supabase, businessId, entityType, entityId, data.publicUrl);
  } catch (error) {
    await supabase.storage.from(storageBucket).remove([objectPath]);
    throw error;
  }

  if (previousUrl !== data.publicUrl) {
    await removeStoredObject(supabase, previousUrl);
  }
}

async function saveMediaUrl(
  supabase: SupabaseServerClient,
  businessId: string,
  entityType: BusinessMediaEntity,
  entityId: string,
  mediaUrl: string | null
): Promise<void> {
  const { error } = await supabase.rpc("set_business_media_url", {
    p_business_id: businessId,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_media_url: mediaUrl
  });

  if (error) {
    throw new BusinessMediaError("save-failed", "Não foi possível associar a imagem ao registo.");
  }
}

async function removeStoredObject(
  supabase: SupabaseServerClient,
  publicUrl: string | null | undefined
): Promise<void> {
  const objectPath = storageObjectPath(publicUrl);
  if (!objectPath) return;

  await supabase.storage.from(storageBucket).remove([objectPath]);
}

function storageObjectPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const markerIndex = url.pathname.indexOf(publicObjectMarker);
    if (markerIndex < 0) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + publicObjectMarker.length));
  } catch {
    return null;
  }
}

function mediaFolder(entityType: BusinessMediaEntity): BusinessMediaFolder {
  if (entityType === "catalog") return "catalog";
  if (entityType === "offer") return "offers";
  if (entityType === "business_logo") return "logo";
  return "profile";
}
