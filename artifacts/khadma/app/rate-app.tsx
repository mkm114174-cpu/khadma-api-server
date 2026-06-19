import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreateMessage } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

export default function RateAppScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { phone } = useAuth();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const align = isRTL ? "right" : "left";

  const createMessage = useCreateMessage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      setError(t.rate.selectStars);
      return;
    }
    setError(null);
    const body = `★ ${rating}/5${comment.trim() ? `\n\n${comment.trim()}` : ""}`;
    try {
      await createMessage.mutateAsync({
        data: {
          name: phone ? `+972 ${phone}` : t.profile.name,
          subject: `${t.rate.appRatingSubject} — ${rating}/5`,
          message: body,
        },
      });
      setSent(true);
    } catch {
      setError(t.rate.error);
    }
  };

  if (sent) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: topInset }]}>
        <View style={styles.successIcon}>
          <Feather name="heart" size={48} color={Y} />
        </View>
        <Text style={styles.successTitle}>{t.rate.sent}</Text>
        <Text style={styles.successSub}>{t.rate.sentMsg}</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t.profile.cancel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 8, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.rate.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <Feather name="star" size={28} color={Y} />
        </View>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>{t.rate.subtitle}</Text>

        <Text style={[styles.tapToRate, { textAlign: "center" }]}>{t.rate.tapToRate}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7} hitSlop={6}>
              <Feather name="star" size={44} color={i <= rating ? Y : C.border} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { textAlign: align }]}>{t.rate.commentLabel}</Text>
        <TextInput
          style={[styles.input, { textAlign: align }]}
          placeholder={t.rate.commentPlaceholder}
          placeholderTextColor={C.mutedForeground}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />

        {!!error && <Text style={[styles.error, { textAlign: align }]}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, createMessage.isPending && { opacity: 0.6 }]}
          onPress={submit}
          disabled={createMessage.isPending}
          activeOpacity={0.85}
        >
          {createMessage.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Feather name="send" size={16} color="#000" />
              <Text style={styles.submitText}>{t.rate.submit}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    center: { alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
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

    content: { padding: 20, gap: 14 },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: Y + "15",
      borderWidth: 1,
      borderColor: Y + "30",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    subtitle: { fontSize: 14, color: C.mutedForeground, lineHeight: 20 },
    tapToRate: { fontSize: 13, color: C.mutedForeground, marginTop: 4 },
    starsRow: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      paddingVertical: 8,
      marginBottom: 4,
    },
    label: { fontSize: 13, fontWeight: "600", color: C.foreground },
    input: {
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: C.foreground,
      minHeight: 100,
      textAlignVertical: "top",
    },
    error: { fontSize: 13, color: "#FF6B6B" },
    submitBtn: {
      height: 52,
      backgroundColor: Y,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
    },
    submitText: { fontSize: 16, fontWeight: "700", color: "#000" },

    successIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: Y + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    successTitle: { fontSize: 22, fontWeight: "700", color: C.foreground },
    successSub: { fontSize: 14, color: C.mutedForeground, textAlign: "center", lineHeight: 21 },
    doneBtn: {
      backgroundColor: Y,
      paddingHorizontal: 28,
      paddingVertical: 13,
      borderRadius: 14,
      marginTop: 12,
    },
    doneBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },
  });
