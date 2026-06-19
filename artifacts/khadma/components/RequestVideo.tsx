import { useAuth as useClerkAuth } from "@clerk/expo";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { isPrivateStorageUrl, storageUrl } from "@/lib/storage";

/**
 * Plays a request video served by the authenticated `/api/storage/objects/*`
 * route. Resolves the Clerk session token and attaches it as a bearer header
 * when the resolved URL is a private object on the trusted API origin — never
 * for arbitrary absolute URLs, which could leak the token to an
 * attacker-controlled host (mirrors AuthedImage).
 */
export default function RequestVideo({
  objectPath,
  style,
}: {
  objectPath: string | null | undefined;
  style?: StyleProp<ViewStyle>;
}) {
  const { getToken } = useClerkAuth();
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    let active = true;
    const uri = storageUrl(objectPath);
    if (!uri) return;
    (async () => {
      let source: VideoSource = { uri };
      if (isPrivateStorageUrl(uri)) {
        const token = await getToken();
        source = {
          uri,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      }
      if (active) player.replace(source);
    })();
    return () => {
      active = false;
    };
  }, [objectPath, getToken, player]);

  if (!objectPath) return null;

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls
    />
  );
}
