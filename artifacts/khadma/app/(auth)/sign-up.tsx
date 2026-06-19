import { useAuth as useClerkAuth, useSignUp } from "@clerk/expo";
import { Link, useLocalSearchParams } from "expo-router";
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

const Y = "#C8A574";

export default function SignUpScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useClerkAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");

  const busy = fetchStatus === "fetching";
  const isProvider = role === "provider";

  const handleSubmit = async () => {
    setFormError("");
    try {
      const { error } = await signUp.password({ emailAddress: email, password });
      if (error) {
        console.error("Sign-up error:", JSON.stringify(error, null, 2));
        setFormError(t.auth.signupFailed);
        return;
      }
      await signUp.verifications.sendEmailCode();
    } catch (err) {
      console.error("Sign-up exception:", err);
      setFormError(t.auth.signupFailed);
    }
  };

  const handleVerify = async () => {
    setFormError("");
    try {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === "complete") {
        // AuthGate redirects once the Clerk session becomes active.
        await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) console.log(session.currentTask);
          },
        });
      } else {
        console.error("Sign-up not complete:", signUp.status);
        setFormError(t.auth.verifyFailed);
      }
    } catch (err) {
      console.error("Verify exception:", err);
      setFormError(t.auth.verifyFailed);
    }
  };

  if (signUp.status === "complete" || isSignedIn) return null;

  const verifying =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

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
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {isProvider ? "🔧 " + t.auth.provider : "👤 " + t.auth.customer}
            </Text>
          </View>
        </View>

        {verifying ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{t.auth.verifyEmail}</Text>
            <Text style={styles.subheading}>{t.auth.verifySub}</Text>
            <TextInput
              style={styles.input}
              value={code}
              placeholder={t.auth.code}
              placeholderTextColor={C.mutedForeground}
              onChangeText={setCode}
              keyboardType="number-pad"
              textAlign="center"
              selectionColor={C.primary}
            />
            {errors.fields.code && (
              <Text style={styles.error}>{errors.fields.code.message}</Text>
            )}
            {!!formError && <Text style={styles.error}>{formError}</Text>}
            <Pressable
              style={[styles.btn, busy && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={busy}
            >
              <Text style={styles.btnText}>{t.auth.verify}</Text>
            </Pressable>
            <Pressable onPress={() => signUp.verifications.sendEmailCode()}>
              <Text style={styles.resend}>{t.auth.resend}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.heading}>{t.auth.signUp}</Text>
            <Text style={styles.subheading}>{t.auth.signUpSub}</Text>

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
            {errors.fields.emailAddress && (
              <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
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
              <Text style={styles.btnText}>{t.auth.create}</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>{t.auth.or}</Text>
              <View style={styles.line} />
            </View>

            <GoogleAuthButton label={t.auth.signUpGoogle} />

            <View style={styles.linkRow}>
              <Link href="/(auth)/sign-in">
                <Text style={styles.link}>{t.auth.loginLink}</Text>
              </Link>
              <Text style={styles.linkMuted}>{t.auth.hasAccount} </Text>
            </View>

            {/* Required for sign-up — Clerk bot protection is enabled by default */}
            <View nativeID="clerk-captcha" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, gap: 24 },
  logoWrap: { alignItems: "center", gap: 8 },
  appName: { fontSize: 32, fontWeight: "800", color: C.foreground, letterSpacing: 1 },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.primary + "15",
    borderWidth: 1,
    borderColor: C.primary + "35",
    marginTop: 8,
  },
  roleText: { fontSize: 14, color: C.primary, fontWeight: "700" },
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
  resend: { color: C.primary, fontSize: 14, textAlign: "center", fontWeight: "700", marginTop: 8 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontSize: 13, color: C.mutedForeground },
  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  link: { color: C.primary, fontSize: 14, fontWeight: "600" },
  linkMuted: { color: C.mutedForeground, fontSize: 14 },
});
