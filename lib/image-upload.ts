import "server-only";

import {
  imageUploadMaxBytes,
  supportedImageMimeTypes
} from "@/lib/image-upload-config";

const extensions = new Map<(typeof supportedImageMimeTypes)[number], "jpg" | "png" | "webp">([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

export class ImageUploadError extends Error {
  constructor(message = "A imagem deve ser JPEG, PNG ou WebP e ter no máximo 5 MB.") {
    super(message);
    this.name = "ImageUploadError";
  }
}

export function imageFile(formData: FormData, fieldName: string): File | null {
  const value = formData.get(fieldName);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function validateImageFile(
  file: File | null,
  maxBytes = imageUploadMaxBytes
): Promise<void> {
  if (!file) return;

  const declaredType = extensions.has(file.type as (typeof supportedImageMimeTypes)[number]);
  const detectedType = detectImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));

  if (!declaredType || detectedType !== file.type || file.size > maxBytes) {
    throw new ImageUploadError();
  }
}

export function imageFileExtension(file: File): "jpg" | "png" | "webp" {
  const extension = extensions.get(file.type as (typeof supportedImageMimeTypes)[number]);
  if (!extension) {
    throw new ImageUploadError("O formato da imagem não é suportado.");
  }
  return extension;
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
