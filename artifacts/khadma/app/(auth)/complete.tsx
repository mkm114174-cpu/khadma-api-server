import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProviderOnboarding from "@/components/provider/ProviderOnboarding";
import { LogoIcon } from "@/components/LogoIcon";
import { useColors } from "@/hooks/useColors";
import { ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { authClient } from "@/lib/neonAuth";

export default function CompleteProfileScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, lang, isRTL } = useLang();
  const { provision, logout } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resolve the intended role BEFORE rendering the form, so a provider-intent
    // user is taken straight to the merged provider registration screen.
    AsyncStorage.getItem("khadma:intendedRole")
      .then((stored) => {
        if (stored === "provider" || stored === "customer") setRole(stored);
      })
      .finally(() => setRoleLoaded(true));
    void authClient.getSession().then(({ data }) => {
      const neonUser = data?.user;
      if (neonUser?.name) setName(neonUser.name);
      if (neonUser?.email) setEmail(neonUser.email);
    });
  }, []);

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      setError(t.auth.nameError);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await provision({ name: name.trim(), role, email, language: lang });
      await AsyncStorage.removeItem("khadma:intendedRole");
      // AuthGate redirects automatically once the profile is created.
    } catch (err) {
      console.error("Provision failed:", err);
      if (err instanceof ApiError && err.status === 401) {
        setError(t.auth.finalizeFailed);
        return;
      }
      setError(t.auth.provisionError);
    } finally {
      setSubmitting(false);
    }
  };

  // Wait for the intended role before deciding which experience to show.
  if (!roleLoaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  // Providers complete everything (name + details + agreements) on one screen.
  if (role === "provider") {
    return <ProviderOnboarding />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <LogoIcon size={80} />
          <Text style={styles.appName}>{t.auth.appName}</Text>
          <Text style={styles.tagline}>{t.auth.completeProfile}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>{t.auth.howToUse}</Text>

          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleOption, role === "customer" && styles.roleActive]}
              onPress={() => {
                setRole("customer");
                void AsyncStorage.setItem("khadma:intendedRole", "customer");
                setError(null);
              }}
            >
              <Text style={styles.roleIcon}>👤</Text>
              <Text style={[styles.roleLabel, role === "customer" && styles.roleLabelActive]}>
                {t.auth.customer}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleOption, role === "provider" && styles.roleActive]}
              onPress={() => {
                setRole("provider");
                void AsyncStorage.setItem("khadma:intendedRole", "provider");
                setError(null);
              }}
            >
              <Text style={styles.roleIcon}>🔧</Text>
              <Text style={[styles.roleLabel, role === "provider" && styles.roleLabelActive]}>
                {t.auth.provider}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t.auth.fullName}</Text>
          <TextInput
            style={styles.input}
            value={name}
            placeholder={t.auth.namePlaceholder}
            placeholderTextColor={C.mutedForeground}
            onChangeText={setName}
            textAlign={isRTL ? "right" : "left"}
            selectionColor={C.primary}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.btnText}>{submitting ? t.auth.saving : t.auth.continue}</Text>
          </Pressable>

          <Pressable onPress={() => logout()}>
            <Text style={styles.logoutLink}>{t.auth.logout}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: { alignItems: "center", justifyContent: "center" },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, gap: 24 },
  logoWrap: { alignItems: "center", gap: 8 },
  appName: { fontSize: 32, fontWeight: "800", color: C.foreground, letterSpacing: 1 },
  tagline: { fontSize: 16, color: C.mutedForeground, marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 28,
    gap: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heading: { fontSize: 22, fontWeight: "800", color: C.foreground, textAlign: "right" },
  roleRow: { flexDirection: "row", gap: 16, marginVertical: 8 },
  roleOption: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
    borderRadius: 20,
    backgroundColor: C.input,
    borderWidth: 2,
    borderColor: C.border,
  },
  roleActive: { borderColor: C.primary, backgroundColor: C.primary + "15" },
  roleIcon: { fontSize: 32 },
  roleLabel: { fontSize: 15, fontWeight: "700", color: C.mutedForeground },
  roleLabelActive: { color: C.foreground },
  label: { fontSize: 14, color: C.mutedForeground, textAlign: "right", marginTop: 8, fontWeight: "600" },
  input: {
    fontSize: 16,
    color: C.foreground,
    backgroundColor: C.input,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  error: { color: C.destructive, fontSize: 13, textAlign: "right", marginTop: 4 },
  btn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 18, fontWeight: "800", color: "#000" },
  logoutLink: { color: C.mutedForeground, fontSize: 14, textAlign: "center", marginTop: 8, fontWeight: "600" },
});
