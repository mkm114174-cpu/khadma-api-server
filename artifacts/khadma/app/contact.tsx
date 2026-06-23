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
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

export default function ContactScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const align = isRTL ? "right" : "left";

  const createMessage = useCreateMessage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      setError(t.contact.required);
      return;
    }
    setError(null);
    try {
      await createMessage.mutateAsync({
        data: {
          name: name.trim(),
          email: email.trim() ? email.trim() : undefined,
          subject: subject.trim() ? subject.trim() : undefined,
          message: message.trim(),
        },
      });
      setSent(true);
    } catch {
      setError(t.contact.error);
    }
  };

  if (sent) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: topInset }]}>
        <View style={styles.successIcon}>
          <Feather name="check-circle" size={48} color="#4CAF50" />
        </View>
        <Text style={styles.successTitle}>{t.contact.sent}</Text>
        <Text style={styles.successSub}>{t.contact.sentMsg}</Text>
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
        <Text style={styles.headerTitle}>{t.contact.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <Feather name="message-circle" size={28} color={Y} />
        </View>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>{t.contact.subtitle}</Text>

        <Field label={t.contact.nameLabel} align={align}>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            placeholder={t.contact.namePlaceholder}
            placeholderTextColor={C.mutedForeground}
            value={name}
            onChangeText={setName}
          />
        </Field>

        <Field label={t.contact.emailLabel} align={align}>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            placeholder={t.contact.emailPlaceholder}
            placeholderTextColor={C.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label={t.contact.subjectLabel} align={align}>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            placeholder={t.contact.subjectPlaceholder}
            placeholderTextColor={C.mutedForeground}
            value={subject}
            onChangeText={setSubject}
          />
        </Field>

        <Field label={t.contact.messageLabel} align={align}>
          <TextInput
            style={[styles.input, styles.textarea, { textAlign: align }]}
            placeholder={t.contact.messagePlaceholder}
            placeholderTextColor={C.mutedForeground}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
          />
        </Field>

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
              <Text style={styles.submitText}>{t.contact.submit}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, align, children }: { label: string; align: "left" | "right"; children: React.ReactNode }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={{ gap: 7 }}>
      <Text style={[styles.label, { textAlign: align }]}>{label}</Text>
      {children}
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

    content: { padding: 20, gap: 16 },
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
    subtitle: { fontSize: 14, color: C.mutedForeground, lineHeight: 20, marginBottom: 4 },
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
    },
    textarea: { minHeight: 110, textAlignVertical: "top" },
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
      backgroundColor: "#4CAF5015",
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
