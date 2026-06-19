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

import {
  ChatConversation,
  getListChatConversationsQueryKey,
  useListChatConversations,
} from "@workspace/api-client-react";

import { serviceNameByType } from "@/constants/serviceTranslations";
import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const Y = "#C8A574";

function timeAgo(iso: string, isRTL: boolean) {
  return new Date(iso).toLocaleString(isRTL ? "ar" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL, lang } = useLang();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isRefetching } = useListChatConversations({
    query: {
      queryKey: getListChatConversationsQueryKey(),
      refetchInterval: 6000,
    },
  });
  const conversations = data ?? [];

  const open = (c: ChatConversation) => {
    router.push({
      pathname: "/chat/[requestId]",
      params: { requestId: String(c.requestId), providerId: String(c.providerId) },
    });
  };

  const renderItem = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity
      style={[styles.card, item.unreadCount > 0 && styles.cardUnread]}
      onPress={() => open(item)}
      activeOpacity={0.85}
    >
      <View style={[styles.cardRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={styles.avatar}>
          <Feather name="user" size={18} color={Y} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={[styles.titleRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
            <Text style={[styles.name, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
              {item.otherPartyName}
            </Text>
            {!!item.lastMessageAt && (
              <Text style={styles.time}>{timeAgo(item.lastMessageAt, isRTL)}</Text>
            )}
          </View>
          <Text style={[styles.sub, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
            {t.chat.requestLabel} {item.requestNumber} · {item.skillName ?? t.req.request}
          </Text>
          {!!item.lastMessage && (
            <Text style={[styles.preview, { textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 8, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.chat.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Y} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => `${c.requestId}:${c.providerId}`}
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
                  name={isError ? "alert-triangle" : "message-circle"}
                  size={36}
                  color={C.mutedForeground}
                />
              </View>
              <Text style={styles.emptyTitle}>{isError ? t.chat.error : t.chat.empty}</Text>
              {!isError && <Text style={styles.emptySub}>{t.chat.emptySub}</Text>}
              {isError && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
                  <Feather name="refresh-cw" size={14} color={Y} />
                  <Text style={styles.retryText}>{t.chat.retry}</Text>
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

    list: { padding: 16 },
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
    },
    cardUnread: { borderColor: Y + "40", backgroundColor: Y + "08" },
    cardRow: { alignItems: "center", gap: 12 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Y + "1A",
      alignItems: "center",
      justifyContent: "center",
    },
    titleRow: { alignItems: "center", justifyContent: "space-between", gap: 8 },
    name: { flex: 1, fontSize: 15, fontWeight: "700", color: C.foreground },
    time: { fontSize: 11, color: C.mutedForeground },
    sub: { fontSize: 12, color: C.mutedForeground },
    preview: { fontSize: 13, color: C.foreground, opacity: 0.85 },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: Y,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { fontSize: 12, fontWeight: "800", color: "#000" },

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
