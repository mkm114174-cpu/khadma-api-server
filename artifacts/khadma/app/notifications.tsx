import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  getListNotificationsQueryKey,
  Notification,
  useListNotifications,
  useUpdateNotification,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

function typeMeta(type?: string | null): { icon: keyof typeof Feather.glyphMap; color: string } {
  switch (type) {
    case "offer":
      return { icon: "tag", color: "#2196F3" };
    case "offer_accepted":
      return { icon: "check-circle", color: "#4CAF50" };
    case "request_update":
      return { icon: "refresh-cw", color: Y };
    case "review":
      return { icon: "star", color: Y };
    case "chat_message":
      return { icon: "message-circle", color: "#2196F3" };
    default:
      return { icon: "bell", color: Y };
  }
}

function timeAgo(iso: string, isRTL: boolean) {
  return new Date(iso).toLocaleString(isRTL ? "ar" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const queryClient = useQueryClient();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isRefetching } = useListNotifications();
  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.isRead);

  const updateNotification = useUpdateNotification();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  const markRead = async (n: Notification) => {
    if (n.isRead) return;
    try {
      await updateNotification.mutateAsync({ id: n.id, data: { isRead: true } });
      await invalidate();
    } catch {
      /* swallow — non-critical */
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(
        unread.map((n) => updateNotification.mutateAsync({ id: n.id, data: { isRead: true } })),
      );
      await invalidate();
    } catch {
      /* swallow */
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const meta = typeMeta(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => markRead(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.cardRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <View style={[styles.iconWrap, { backgroundColor: meta.color + "22" }]}>
            <Feather name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={[styles.title, { textAlign: isRTL ? "right" : "left" }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {!!item.body && (
              <Text style={[styles.body, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={3}>
                {item.body}
              </Text>
            )}
            <Text style={[styles.time, { textAlign: isRTL ? "right" : "left" }]}>
              {timeAgo(item.createdAt, isRTL)}
            </Text>
          </View>
          {!item.isRead && <View style={styles.dot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.notif.title}</Text>
        {unread.length > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>{t.notif.markAllRead}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Y} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Y} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather
                  name={isError ? "alert-triangle" : "bell-off"}
                  size={36}
                  color={C.mutedForeground}
                />
              </View>
              <Text style={styles.emptyTitle}>{isError ? t.notif.error : t.notif.empty}</Text>
              {!isError && <Text style={styles.emptySub}>{t.notif.emptySub}</Text>}
              {isError && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
                  <Feather name="refresh-cw" size={14} color={Y} />
                  <Text style={styles.retryText}>{t.notif.retry}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: C.foreground, textAlign: "center" },
    markAll: { fontSize: 12, fontWeight: "700", color: Y },

    list: { padding: 16 },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
    },
    cardUnread: { borderColor: Y + "40", backgroundColor: Y + "08" },
    cardRow: { alignItems: "flex-start", gap: 12 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 15, fontWeight: "700", color: C.foreground },
    body: { fontSize: 13, color: C.mutedForeground, lineHeight: 19 },
    time: { fontSize: 11, color: C.mutedForeground, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Y, marginTop: 6 },

    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: C.foreground },
    emptySub: { fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingHorizontal: 40 },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Y + "40",
      backgroundColor: Y + "12",
      marginTop: 4,
    },
    retryText: { fontSize: 13, fontWeight: "700", color: Y },
  });
