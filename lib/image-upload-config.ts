export const supportedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageUploadAccept = supportedImageMimeTypes.join(",");
export const imageUploadMaxBytes = 5 * 1024 * 1024;

