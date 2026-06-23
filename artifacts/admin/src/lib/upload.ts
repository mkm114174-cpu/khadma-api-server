import { requestUploadUrl } from "@workspace/api-client-react";

/**
 * Upload a browser File to object storage and return the normalized object path
 * to persist on a resource (e.g. a skill `image`).
 *
 * Flow: ask the API for a presigned PUT URL, then upload the raw bytes directly
 * to that URL. The presigned URL is single-use and short-lived.
 */
export async function uploadFile(file: File): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  const size = file.size || 0;
  const name = file.name || `upload-${Date.now()}`;

  const { uploadURL, objectPath } = await requestUploadUrl({
    name,
    size: size > 0 ? size : 1,
    contentType,
  });

  const put = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status})`);
  }

  return objectPath;
}
