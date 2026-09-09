import { randomUUID } from "node:crypto";

export const IMAGE_TYPES = [
  "plan-cover",
  "hotel",
  "restaurant",
  "touring-spot",
  "memory",
] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isImageType(value: unknown): value is ImageType {
  return (
    typeof value === "string" &&
    (IMAGE_TYPES as readonly string[]).includes(value)
  );
}

export function imageExtension(contentType: unknown): string | undefined {
  return typeof contentType === "string"
    ? imageExtensions[contentType]
    : undefined;
}

export function createImageKey(
  cognitoSub: string,
  imageType: ImageType,
  extension: string,
): string {
  return `images/${cognitoSub}/${imageType}/${randomUUID()}.${extension}`;
}

export function createImageUrl(
  bucket: string,
  region: string,
  imageKey: string,
): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${imageKey}`;
}

export function imageKeyFromUrl(
  imageUrl: string,
  bucket: string,
  region: string,
): string | undefined {
  let url: URL;

  try {
    url = new URL(imageUrl);
  } catch {
    return undefined;
  }

  const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== expectedHost ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return undefined;
  }

  const imageKey = url.pathname.slice(1);
  return imageKey && !imageKey.includes("%") ? imageKey : undefined;
}
