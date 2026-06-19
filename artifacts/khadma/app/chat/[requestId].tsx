import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  ChatMessage,
  getListChatConversationsQueryKey,
  getListChatMessagesQueryKey,
  getListNotificationsQueryKey,
  useListChatConversations,
  useListChatMessages,
  useMarkChatRead,
  useSendChatMessage,
} from "@workspace/api-client-react";

import { serviceNameByType } from "@/constants/serviceTranslations";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const Y = "#C8A574";

function timeLabel(iso: string, isRTL: boolean) {
  return new Date(iso).toLocaleTimeString(isRTL ? "ar" : "en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatThreadScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL, lang } = useLang();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ requestId: string; providerId: string }>();
  const requestId = Number(params.requestId);
  const providerId = Number(params.providerId);
  const valid = Number.isFinite(requestId) && Number.isFinite(providerId);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState("");

  const queryParams = useMemo(() => ({ requestId, providerId }), [requestId, providerId]);

  const messagesQ = useListChatMessages(queryParams, {
    query: {
      enabled: valid,
      queryKey: getListChatMessagesQueryKey(queryParams),
      refetchInterval: 4000,
    },
  });
  const messages = messagesQ.data ?? [];

  // Header context (other party name + request number) comes from the
  // conversations list so deep links from a notification still show a title.
  const conversationsQ = useListChatConversations({
    query: { enabled: valid, queryKey: getListChatConversationsQueryKey() },
  });
  const conversation = (conversationsQ.data ?? []).find(
    (c) => c.requestId === requestId && c.providerId === providerId,
  );
  const headerName = conversation?.otherPartyName ?? t.chat.title;
  const headerSub = conversation
    ? `${t.chat.requestLabel} ${conversation.requestNumber} · ${conversation.skillName ?? t.chat.requestFallback}`
    : "";

  const sendChat = useSendChatMessage();
  const markRead = useMarkChatRead();

  const invalidateLists = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: getListChatConversationsQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getListNotificationsQueryKey(),
    });
  }, [queryClient]);

  // Mark incoming messages as read whenever the thread shows unread items.
  const hasUnreadIncoming = messages.some(
    (m) => user != null && m.senderId !== user.id && !m.isRead,
  );
  useEffect(() => {
    if (!valid || !hasUnreadIncoming) return;
    markRead
      .mutateAsync({ data: { requestId, providerId } })
      .then(() => invalidateLists())
      .catch(() => {
        /* non-critical */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, hasUnreadIncoming, requestId, providerId]);

  const onSend = async () => {
    const body = input.trim();
    if (!body || !valid) return;
    setInput("");
    try {
      await sendChat.mutateAsync({ data: { requestId, providerId, body } });
      await queryClient.invalidateQueries({
        queryKey: getListChatMessagesQueryKey(queryParams),
      });
      invalidateLists();
    } catch {
      setInput(body);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = user != null && item.senderId === user.id;
    return (
      <View
        style={[
          styles.msgRow,
          mine
            ? { alignSelf: "flex-end", alignItems: "flex-end" }
            : { alignSelf: "flex-start", alignItems: "flex-start" },
        ]}
      >
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
        </View>
        <Text style={styles.timeText}>{timeLabel(item.createdAt, isRTL)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={[styles.headerInfo, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerName}
          </Text>
          {!!headerSub && (
            <Text style={styles.headerSub} numberOfLines={1}>
              {headerSub}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
      </View>

      {messagesQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Y} />
        </View>
      ) : messagesQ.isError ? (
        <View style={styles.center}>
          <Feather name="alert-triangle" size={36} color={C.mutedForeground} />
          <Text style={styles.emptyTitle}>{t.chat.threadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => messagesQ.refetch()} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={14} color={Y} />
            <Text style={styles.retryText}>{t.chat.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="message-circle" size={32} color={C.mutedForeground} />
              </View>
              <Text style={styles.emptySub}>{t.chat.startConversation}</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <TextInput
          style={[styles.textInput, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.chat.inputPlaceholder}
          placeholderTextColor={C.mutedForeground}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={onSend}
          returnKeyType="send"
          editable={valid}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sendChat.isPending) && styles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!input.trim() || sendChat.isPending}
        >
          {sendChat.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="send" size={16} color={input.trim() ? "#000" : C.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
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
    headerInfo: { flex: 1, gap: 2 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: C.foreground },
    headerSub: { fontSize: 12, color: C.mutedForeground },

    list: { padding: 16, gap: 10, flexGrow: 1 },
    msgRow: { maxWidth: "82%", gap: 4 },
    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleOther: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderBottomLeftRadius: 4,
    },
    bubbleMine: { backgroundColor: Y, borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 14, color: C.foreground, lineHeight: 20 },
    bubbleTextMine: { color: "#000", fontWeight: "600" },
    timeText: { fontSize: 10, color: C.mutedForeground, paddingHorizontal: 4 },

    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: C.foreground },
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
    },
    retryText: { fontSize: 13, fontWeight: "700", color: Y },

    inputBar: {
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.background,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: C.foreground,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: Y,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  });
