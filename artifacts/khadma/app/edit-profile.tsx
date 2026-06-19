import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { updateCurrentUser } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

export default function EditProfileScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { name, phone, refresh } = useAuth();

  const [nameInput, setNameInput] = useState(name ?? "");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = nameInput.trim() !== (name ?? "").trim() || phoneInput.trim() !== (phone ?? "").trim();
  const canSave = dirty && !saving;

  const notify = (msg: string) => {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("", msg);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: { name?: string; phone?: string } = {
        phone: phoneInput.trim(),
      };
      const trimmedName = nameInput.trim();
      if (trimmedName.length > 0) payload.name = trimmedName;
      await updateCurrentUser(payload);
      await refresh();
      notify(t.profile.updated);
      router.back();
    } catch (_e) {
      notify(t.profile.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8} activeOpacity={0.8}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.editProfile}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text style={[styles.label, { textAlign: isRTL ? "right" : "left" }]}>{t.profile.nameLabel}</Text>
        <View style={styles.inputWrap}>
          <Feather name="user" size={16} color={C.mutedForeground} />
          <TextInput
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={t.profile.nameLabel}
            placeholderTextColor={C.mutedForeground}
          />
        </View>
        <Text style={[styles.hint, { textAlign: isRTL ? "right" : "left" }]}>{t.profile.nameHint}</Text>

        {/* Phone */}
        <Text style={[styles.label, { textAlign: isRTL ? "right" : "left", marginTop: 20 }]}>{t.profile.phoneLabel}</Text>
        <View style={[styles.inputWrap, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="phone" size={16} color={C.mutedForeground} />
          <Text style={styles.prefix}>+972</Text>
          <TextInput
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            value={phoneInput}
            onChangeText={(v) => setPhoneInput(v.replace(/[^0-9]/g, ""))}
            placeholder="5X XXX XXXX"
            placeholderTextColor={C.mutedForeground}
            keyboardType="phone-pad"
            maxLength={12}
          />
        </View>
        <Text style={[styles.hint, { textAlign: isRTL ? "right" : "left" }]}>{t.profile.phoneHint}</Text>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>{t.profile.save}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{t.profile.cancel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: {
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.foreground },
    content: { padding: 20, paddingBottom: 60 },
    label: { fontSize: 13, fontWeight: "600", color: C.mutedForeground, marginBottom: 8 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: C.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 14 : 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    prefix: { fontSize: 15, fontWeight: "600", color: C.foreground },
    input: { flex: 1, fontSize: 15, color: C.foreground },
    hint: { fontSize: 11, color: C.mutedForeground, marginTop: 6, paddingHorizontal: 4 },
    saveBtn: {
      marginTop: 32,
      backgroundColor: Y,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveText: { fontSize: 16, fontWeight: "700", color: "#000" },
    cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: "center" },
    cancelText: { fontSize: 14, fontWeight: "600", color: C.mutedForeground },
  });
