import { getAccessToken } from "@/lib/neonAuth";
import { Image, type ImageStyle } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleProp } from "react-native";

import { isPrivateStorageUrl, storageUrl } from "@/lib/storage";

/**
 * Renders an image served by the authenticated `/api/storage/objects/*` route.
 * Resolves the Clerk session token and attaches it as a bearer header so the
 * private object can be fetched. The token is attached ONLY when the resolved
 * URL is a private object on the trusted API origin — never for arbitrary
 * absolute URLs, which could leak the token to an attacker-controlled host.
 */
export default function AuthedImage({
  objectPath,
  style,
  contentFit = "cover",
}: {
  objectPath: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain";
}) {
  const [token, setToken] = useState<string | null>(null);

  const uri = storageUrl(objectPath);
  const isPrivate = isPrivateStorageUrl(uri);

  useEffect(() => {
    let active = true;
    if (uri && isPrivate) {
      getAccessToken().then((t) => {
        if (active) setToken(t ?? null);
      });
    }
    return () => {
      active = false;
    };
  }, [uri, isPrivate]);

  if (!uri) return null;
  if (!isPrivate) {
    return <Image source={{ uri }} style={style} contentFit={contentFit} transition={150} />;
  }
  if (!token) return null;

  return (
    <Image
      source={{ uri, headers: { Authorization: `Bearer ${token}` } }}
      style={style}
      contentFit={contentFit}
      transition={150}
    />
  );
}
