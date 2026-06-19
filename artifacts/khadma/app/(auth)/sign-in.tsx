import { Link } from "expo-router";
import React, { useState } from "react";
import {
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

import { LogoIcon } from "@/components/LogoIcon";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { authClient } from "@/lib/neonAuth";

export default function SignInScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setFormError("");
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        console.error("Sign-in error:", error);
        setFormError(t.auth.loginFailed);
        return;
      }
      await refreshSession();
    } catch (err) {
      console.error("Sign-in failed:", err);
      setFormError(t.auth.loginFailed);
    } finally {
      setBusy(false);
    }
  };

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
          <Text style={styles.tagline}>{t.auth.welcomeBack}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>{t.auth.signIn}</Text>
          <Text style={styles.subheading}>{t.auth.signInSub}</Text>

          <TextInput
            style={styles.input}
            placeholder={t.auth.email}
            placeholderTextColor={C.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            textAlign={isRTL ? "right" : "left"}
            selectionColor={C.primary}
          />
          <TextInput
            style={styles.input}
            placeholder={t.auth.password}
            placeholderTextColor={C.mutedForeground}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            textAlign={isRTL ? "right" : "left"}
            selectionColor={C.primary}
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Pressable
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={busy}
          >
            <Text style={styles.btnText}>{t.auth.signIn}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t.auth.or}</Text>
            <View style={styles.line} />
          </View>

          <GoogleAuthButton />

          <View style={styles.linkRow}>
            <Text style={styles.linkMuted}>{t.auth.noAccount} </Text>
            <Link href="/(auth)/sign-up">
              <Text style={styles.link}>{t.auth.signUp}</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 24,
    },
    logoWrap: { alignItems: "center", gap: 8 },
    appName: {
      fontSize: 32,
      fontWeight: "800",
      color: C.foreground,
      letterSpacing: 1,
    },
    tagline: { fontSize: 16, color: C.mutedForeground, marginTop: 4 },
    card: {
      backgroundColor: C.card,
      borderRadius: 24,
      padding: 28,
      gap: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    heading: {
      fontSize: 26,
      fontWeight: "800",
      color: C.foreground,
      textAlign: "right",
    },
    subheading: {
      fontSize: 15,
      color: C.mutedForeground,
      textAlign: "right",
      marginBottom: 8,
    },
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
    error: { color: C.destructive, fontSize: 13, textAlign: "right" },
    btn: {
      backgroundColor: C.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: 18, fontWeight: "800", color: "#000" },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
    },
    line: { flex: 1, height: 1, backgroundColor: C.border },
    orText: { fontSize: 13, color: C.mutedForeground },
    linkRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    link: { color: C.primary, fontSize: 14, fontWeight: "600" },
    linkMuted: { color: C.mutedForeground, fontSize: 14 },
  });
