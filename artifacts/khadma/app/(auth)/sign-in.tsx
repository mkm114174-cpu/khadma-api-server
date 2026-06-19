import { useClerk, useSignIn } from "@clerk/expo";
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
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

export default function SignInScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { signIn, errors, fetchStatus } = useSignIn();
  const clerk = useClerk() as any;
  const setActive = clerk?.setActive;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const busy = fetchStatus === "fetching";

  const handleSubmit = async () => {
    setFormError("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) {
      console.error("Sign-in error:", JSON.stringify(error, null, 2));
      setFormError(t.auth.loginFailed);
      return;
    }
    // The created session must be activated for isSignedIn to flip to true.
    // Without this, AuthGate never redirects and the screen appears to loop
    // back to sign-in on every attempt (mirrors the email-code flow).
    try {
      if (signIn.status === "complete" && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId });
      } else if (signIn.finalize) {
        await signIn.finalize({ navigate: () => {} });
      } else {
        // Sign-in needs an extra step we don't handle here (e.g. 2FA) —
        // surface a recoverable error instead of silently looping.
        setFormError(t.auth.finalizeFailed);
      }
    } catch (err) {
      console.error("Sign-in finalize failed:", err);
      setFormError(t.auth.finalizeFailed);
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
            value={email}
            placeholder={t.auth.email}
            placeholderTextColor={C.mutedForeground}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign={isRTL ? "right" : "left"}
            selectionColor={C.primary}
          />
          {errors.fields.identifier && (
            <Text style={styles.error}>{errors.fields.identifier.message}</Text>
          )}

          <TextInput
            style={styles.input}
            value={password}
            placeholder={t.auth.password}
            placeholderTextColor={C.mutedForeground}
            onChangeText={setPassword}
            secureTextEntry
            textAlign={isRTL ? "right" : "left"}
            selectionColor={C.primary}
          />
          {errors.fields.password && (
            <Text style={styles.error}>{errors.fields.password.message}</Text>
          )}

          {!!formError && <Text style={styles.error}>{formError}</Text>}

          <Pressable
            style={[styles.btn, (!email || !password || busy) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!email || !password || busy}
          >
            <Text style={styles.btnText}>{t.auth.enter}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t.auth.or}</Text>
            <View style={styles.line} />
          </View>

          <GoogleAuthButton label={t.auth.signInGoogle} />

          <View style={styles.linkRow}>
            <Link href="/(auth)/sign-up">
              <Text style={styles.link}>{t.auth.registerLink}</Text>
            </Link>
            <Text style={styles.linkMuted}>{t.auth.noAccount} </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
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
  heading: { fontSize: 26, fontWeight: "800", color: C.foreground, textAlign: "right" },
  subheading: { fontSize: 15, color: C.mutedForeground, textAlign: "right", marginBottom: 8 },
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
  error: { color: C.destructive, fontSize: 13, textAlign: "right", marginTop: -8 },
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
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontSize: 13, color: C.mutedForeground },
  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  link: { color: C.primary, fontSize: 14, fontWeight: "600" },
  linkMuted: { color: C.mutedForeground, fontSize: 14 },
});
