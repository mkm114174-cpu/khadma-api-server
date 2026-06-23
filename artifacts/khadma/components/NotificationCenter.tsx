import { Feather } from "@expo/vector-icons";
import {
  useListNotifications,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { playNotificationSound } from "@/lib/notificationSound";

type Toast = {
  id: number;
  title: string;
  body: string | null;
  type: string | null;
  data: unknown;
};

const ICON_FOR_TYPE: Record<string, keyof typeof Feather.glyphMap> = {
  request_new: "file-plus",
  offer: "tag",
  offer_accepted: "check-circle",
  offer_rejected: "x-circle",
  request_started: "play-circle",
  request_completed: "check-circle",
  request_cancelled: "slash",
  request_update: "refresh-cw",
  chat_message: "message-circle",
};

/**
 * Pull a (requestId, providerId) pair out of a notification's `data` payload so
 * a chat_message banner can deep-link straight into the thread.
 */
function chatTarget(
  data: unknown,
): { requestId: number; providerId: number } | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  const requestId = Number(d.requestId);
  const providerId = Number(d.providerId);
  if (!Number.isFinite(requestId) || !Number.isFinite(providerId)) return null;
  return { requestId, providerId };
}

/**
 * Global real-time notification listener. Polls the notifications endpoint and,
 * when a brand-new unread notification arrives, plays a chime, fires a haptic,
 * and shows a tappable in-app banner. Mounted once the user is authenticated.
 */
export function NotificationCenter() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = React.useMemo(() => makeStyles(C), [C]);

  const { data } = useListNotifications({
    query: {
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
      queryKey: getListNotificationsQueryKey(),
    },
  });

  // The highest notification id we have already accounted for. Initialised on
  // the first load so existing/past notifications never trigger the chime.
  const seenRef = useRef<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const translateY = useRef(new Animated.Value(-160)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = React.useCallback(() => {
    Animated.timing(translateY, {
      toValue: -160,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const present = React.useCallback(
    (next: Toast) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(next);
      translateY.setValue(-160);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
        speed: 14,
      }).start();
      hideTimer.current = setTimeout(dismiss, 4500);
    },
    [translateY, dismiss],
  );

  useEffect(() => {
    if (!data) return;
    const maxId = data.reduce((m, n) => Math.max(m, n.id), 0);
    if (seenRef.current === null) {
      seenRef.current = maxId;
      return;
    }
    if (maxId <= seenRef.current) return;
    const fresh = data
      .filter((n) => n.id > (seenRef.current ?? 0) && !n.isRead)
      .sort((a, b) => a.id - b.id);
    seenRef.current = maxId;
    if (fresh.length === 0) return;
    const latest = fresh[fresh.length - 1];
    playNotificationSound();
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    present({
      id: latest.id,
      title: latest.title,
      body: latest.body ?? null,
      type: latest.type ?? null,
      data: latest.data ?? null,
    });
  }, [data, present]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!toast) return null;

  const icon = (toast.type && ICON_FOR_TYPE[toast.type]) || "bell";

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: insets.top + 8, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        style={styles.card}
        onPress={() => {
          dismiss();
          const target =
            toast.type === "chat_message" ? chatTarget(toast.data) : null;
          if (target) {
            router.push({
              pathname: "/chat/[requestId]",
              params: {
                requestId: String(target.requestId),
                providerId: String(target.providerId),
              },
            });
          } else {
            router.push("/notifications");
          }
        }}
      >
        <View style={styles.iconWrap}>
          <Feather name={icon} size={20} color="#0D0D0D" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {!!toast.body && (
            <Text style={styles.body} numberOfLines={2}>
              {toast.body}
            </Text>
          )}
        </View>
        <Pressable
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={18} color={C.mutedForeground} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 14,
      zIndex: 1000,
    },
    card: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.primary + "55",
      paddingVertical: 12,
      paddingHorizontal: 14,
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: C.text,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      textAlign: "right",
    },
    body: {
      color: C.mutedForeground,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "right",
      marginTop: 2,
    },
  });
