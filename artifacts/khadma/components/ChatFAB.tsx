import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useCreateMessage } from "@workspace/api-client-react";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const Y = "#C8A574";
const BG = "#0D0D0D";
const CARD = "#161616";
const BORDER = "#2A2A2A";
const { height: SCREEN_H } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  from: "user" | "support";
  time: string;
}

/* Acknowledgement shown after a message is successfully delivered to the admin. */
const ACK_REPLY: Record<string, string> = {
  ar: "تم استلام رسالتك ووصلت إلى فريق الدعم. سنرد عليك في أقرب وقت. 🙏",
  en: "Your message has reached our support team. We'll get back to you soon. 🙏",
  he: "ההודעה שלך הגיעה לצוות התמיכה. נחזור אליך בהקדם. 🙏",
};

/* Shown when delivery to the admin fails. */
const FAIL_REPLY: Record<string, string> = {
  ar: "تعذّر إرسال رسالتك حالياً. تحقق من الاتصال وحاول مرة أخرى.",
  en: "Couldn't send your message right now. Check your connection and try again.",
  he: "לא ניתן לשלוח את ההודעה כעת. בדוק את החיבור ונסה שוב.",
};

function now() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChatFAB({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLang();
  const { name } = useAuth();
  const createMessage = useCreateMessage();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      from: "support",
      text: lang === "ar" ? "أهلاً! كيف يمكنني مساعدتك اليوم؟ 👋"
           : lang === "he" ? "שלום! איך אפשר לעזור היום? 👋"
           : "Hello! How can we help you today? 👋",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabGlow  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  /* Pulse the FAB */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabGlow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(fabGlow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (open) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [open]);

  const pressFAB = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true, tension: 200 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    setOpen(true);
  };

  const sendMessage = async () => {
    const txt = input.trim();
    if (!txt || createMessage.isPending) return;
    const userMsg: Message = { id: Date.now().toString(), from: "user", text: txt, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const senderName = name?.trim() && name !== "Guest" ? name.trim() : "مستخدم التطبيق";
    const subject =
      lang === "he" ? "צ'אט תמיכה (אפליקציה)" : lang === "en" ? "Support chat (app)" : "محادثة الدعم (التطبيق)";

    let ok = true;
    try {
      await createMessage.mutateAsync({
        data: { name: senderName, subject, message: txt },
      });
    } catch {
      ok = false;
    }

    const reply: Message = {
      id: (Date.now() + 1).toString(),
      from: "support",
      text: ok ? ACK_REPLY[lang] ?? ACK_REPLY.ar : FAIL_REPLY[lang] ?? FAIL_REPLY.ar,
      time: now(),
    };
    setMessages((prev) => [...prev, reply]);
    setTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const glowOpacity = fabGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  const glowScale   = fabGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });

  const fabBottom = bottomOffset + insets.bottom + 12;

  return (
    <>
      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { bottom: fabBottom, transform: [{ scale: fabScale }] }]}>
        {/* Glow ring */}
        <Animated.View style={[styles.fabGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        <TouchableOpacity style={styles.fab} onPress={pressFAB} activeOpacity={0.9}>
          <Feather name="message-circle" size={24} color="#000" />
        </TouchableOpacity>
        {/* Online dot */}
        <View style={styles.onlineDot} />
      </Animated.View>

      {/* Chat modal */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 12 }]}>
            {/* Header */}
            <View style={[styles.chatHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <View style={styles.supportAvatar}>
                <Feather name="headphones" size={18} color="#000" />
              </View>
              <View style={[styles.headerInfo, { alignItems: isRTL ? "flex-start" : "flex-end" }]}>
                <Text style={styles.headerTitle}>
                  {lang === "ar" ? "دعم خدمة" : lang === "he" ? "תמיכת Khadma" : "Khadma Support"}
                </Text>
                <View style={[styles.onlineRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                  <View style={styles.onlineDotSmall} />
                  <Text style={styles.onlineText}>
                    {lang === "ar" ? "متاح الآن" : lang === "he" ? "זמין עכשיו" : "Online now"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <Feather name="x" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.headerDivider} />

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.msgList}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.map((msg) => {
                const isUser = msg.from === "user";
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgRow,
                      isUser
                        ? { alignSelf: "flex-end", alignItems: "flex-end" }
                        : { alignSelf: "flex-start", alignItems: "flex-start" },
                    ]}
                  >
                    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleSupport]}>
                      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{msg.time}</Text>
                  </View>
                );
              })}
              {typing && (
                <View style={[styles.msgRow, { alignSelf: "flex-start" }]}>
                  <View style={[styles.bubble, styles.bubbleSupport, styles.typingBubble]}>
                    <Text style={styles.typingDots}>●  ●  ●</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <TextInput
                style={[styles.textInput, { textAlign: isRTL ? "right" : "left" }]}
                placeholder={lang === "ar" ? "اكتب رسالتك..." : lang === "he" ? "כתוב הודעה..." : "Type a message..."}
                placeholderTextColor="#555"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!input.trim()}
              >
                <Feather name="send" size={16} color={input.trim() ? "#000" : "#555"} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: "absolute",
    left: 20,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  fabGlow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Y,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Y,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Y,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  onlineDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: BG,
  },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },

  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: BORDER,
    maxHeight: SCREEN_H * 0.72,
    overflow: "hidden",
  },

  chatHeader: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  supportAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Y,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 3 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  onlineRow: { alignItems: "center", gap: 5 },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  onlineText: { fontSize: 12, color: "#4ADE80", fontWeight: "500" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff10",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDivider: { height: 1, backgroundColor: BORDER },

  msgList: { flex: 1, minHeight: 180 },

  msgRow: { maxWidth: "80%", gap: 4 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSupport: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Y,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: "#ddd", lineHeight: 20 },
  bubbleTextUser: { color: "#000", fontWeight: "600" },
  timeText: { fontSize: 10, color: "#444", paddingHorizontal: 4 },

  typingBubble: { paddingVertical: 12 },
  typingDots: { fontSize: 10, color: "#666", letterSpacing: 2 },

  inputRow: {
    margin: 12,
    marginTop: 8,
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    overflow: "hidden",
    gap: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Y,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  sendBtnDisabled: { backgroundColor: "#1E1E1E" },
});
