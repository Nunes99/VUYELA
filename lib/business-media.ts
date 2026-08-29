import "server-only";

import { randomUUID } from "node:crypto";

import { businessMediaMaxBytes } from "@/lib/business-media-config";
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
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

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
  const value = formData.get(fieldName);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function validateBusinessMediaFile(file: File | null): Promise<void> {
  if (!file) return;

  const declaredType = allowedTypes.has(file.type);
  const detectedType = detectImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));

  if (!declaredType || detectedType !== file.type || file.size > businessMediaMaxBytes) {
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
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new BusinessMediaError("invalid-file", "O formato da imagem não é suportado.");
  }

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

function detectImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}
