import { requestUploadUrl } from "@workspace/api-client-react";
import type { ImagePickerAsset } from "expo-image-picker";

/**
 * A picked file descriptor that can come from either expo-image-picker or
 * expo-document-picker (or a plain web File converted to a URI).
 */
export interface UploadDescriptor {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}

/**
 * Upload a picked file to object storage and return the normalized object path
 * to persist on a resource (e.g. a request `imageUrl` or a provider document).
 *
 * Flow: ask the API for a presigned PUT URL, then upload the raw bytes directly
 * to that URL. The presigned URL is single-use and short-lived.
 */
export async function uploadAsset(file: UploadDescriptor): Promise<string> {
  const res = await fetch(file.uri);
  const blob = await res.blob();

  const contentType = file.mimeType ?? blob.type ?? "application/octet-stream";
  const size = file.size ?? blob.size ?? 0;
  const name = file.name ?? `upload-${Date.now()}`;

  const { uploadURL, objectPath } = await requestUploadUrl({
    name,
    size: size > 0 ? size : 1,
    contentType,
  });

  const put = await fetch(uploadURL, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status})`);
  }

  return objectPath;
}

/** Convenience wrapper for images picked via expo-image-picker. */
export async function uploadImageAsset(asset: ImagePickerAsset): Promise<string> {
  return uploadAsset({
    uri: asset.uri,
    name: asset.fileName ?? `upload-${Date.now()}.jpg`,
    mimeType: asset.mimeType,
    size: asset.fileSize,
  });
}
