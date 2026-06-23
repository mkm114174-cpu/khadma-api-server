/**
 * Build a fully-qualified URL for an object-storage path returned by the API
 * (e.g. `/objects/uploads/<uuid>`). Private objects are served by the authed
 * `/api/storage/objects/*` route, so callers must attach a bearer token (see
 * AuthedImage).
 */
function trustedBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN?.replace(/^https?:\/\//, "");
  return domain ? `https://${domain}` : "";
}

export function storageUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  if (objectPath.startsWith("http://") || objectPath.startsWith("https://")) {
    // Absolute URL — returned as-is and ALWAYS treated as untrusted/public.
    // A bearer token is never attached to these (see isPrivateStorageUrl).
    return objectPath;
  }
  const base = trustedBase();
  const path = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
  return `${base}/api/storage${path}`;
}

/**
 * True ONLY for private object URLs on the trusted API origin. A Clerk bearer
 * token may be attached exclusively for these — never for arbitrary absolute
 * URLs, which could point at an attacker-controlled origin (e.g.
 * `https://attacker.tld/api/storage/objects/x`) and leak the session token.
 *
 * When no domain is configured (web, relative URLs), only same-origin relative
 * paths under `/api/storage/objects/` are considered private.
 */
export function isPrivateStorageUrl(uri: string | null | undefined): boolean {
  if (!uri) return false;
  const base = trustedBase();
  if (base) return uri.startsWith(`${base}/api/storage/objects/`);
  return uri.startsWith("/api/storage/objects/");
}
