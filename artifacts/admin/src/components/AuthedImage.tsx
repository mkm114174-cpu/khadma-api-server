import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/neonAuth";

/**
 * Renders an image served by the authenticated `/api/storage/objects/*` route.
 * Fetches the bytes with the Neon Auth bearer token and exposes them via an object
 * URL, since a plain <img src> cannot attach an Authorization header.
 */
export function AuthedImage({
  objectPath,
  className,
  alt = "",
}: {
  objectPath: string | null | undefined;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!objectPath) {
      setSrc(null);
      return;
    }

    (async () => {
      try {
        const token = await getAccessToken();
        const path = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
        const res = await fetch(`/api/storage${path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setSrc(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        // ignore — nothing renders
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectPath]);

  if (!src) return null;
  return <img src={src} className={className} alt={alt} />;
}
