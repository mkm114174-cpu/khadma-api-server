import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";

import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { LogoIcon } from "@/components/LogoIcon";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import type { AuthSessionPayload } from "@/lib/authSession";
import { authClient, hasActiveSession, withAuthTimeout } from "@/lib/neonAuth";

const { width } = Dimensions.get("window");
const STATIC_LANGUAGES = [
  { id: "ar" as const, dir: "rtl" as const },
  { id: "en" as const, dir: "ltr" as const },
  { id: "he" as const, dir: "rtl" as const },
];

const Y = "#C8A574";

type Phase = "email" | "code" | "language" | "welcome";
type Mode = "signIn" | "signUp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIGNUP_PWD_KEY = "khadma:signUpPassword";

function errorMessage(error: unknown): string | undefined {
  const e = error as { message?: string } | null;
  return e?.message;
}

function isUserNotFoundError(error: unknown): boolean {
  const e = error as { message?: string; code?: string; status?: number } | null;
  if (e?.status === 404) return true;
  const msg = (e?.message ?? "").toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("no user") ||
    e?.code === "USER_NOT_FOUND"
  );
}

export default function EmailCodeScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL, setLang } = useLang();
  const router = useRouter();
  const { completeAuthLogin, refreshSession } = useAuth();

  const [phase, setPhase] = useState<Phase>("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [intendedRole, setIntendedRole] = useState<"customer" | "provider">(
    "customer",
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signUpPassword, setSignUpPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("khadma:intendedRole").then((stored) => {
      if (stored === "provider" || stored === "customer") {
        setIntendedRole(stored);
      }
    });
    AsyncStorage.getItem(SIGNUP_PWD_KEY).then((stored) => {
      if (stored) setSignUpPassword(stored);
    });
  }, []);

  const emailValid = EMAIL_RE.test(email.trim());
  const codeValid = code.trim().length >= 6;
  const isProvider = intendedRole === "provider";

  const sendCode = async () => {
    if (!emailValid || busy) return;
    setBusy(true);
    setError(null);
    const addr = email.trim().toLowerCase();
    try {
      const { error: signInError } = await withAuthTimeout(
        authClient.emailOtp.sendVerificationOtp({
          email: addr,
          type: "sign-in",
        }),
      );

      if (!signInError) {
        setSignUpPassword(null);
        await AsyncStorage.removeItem(SIGNUP_PWD_KEY);
        setMode("signIn");
        setPhase("code");
        return;
      }

      if (!isUserNotFoundError(signInError)) {
        setError(errorMessage(signInError) ?? t.auth.serverError);
        return;
      }

      const tempPassword = Crypto.randomUUID();
      setSignUpPassword(tempPassword);
      await AsyncStorage.setItem(SIGNUP_PWD_KEY, tempPassword);
      const { error: signUpError } = await withAuthTimeout(
        authClient.signUp.email({
          email: addr,
          password: tempPassword,
          name: addr.split("@")[0] ?? "User",
        }),
      );
      if (signUpError) {
        setSignUpPassword(null);
        await AsyncStorage.removeItem(SIGNUP_PWD_KEY);
        setError(errorMessage(signUpError) ?? t.auth.signupFailed);
        return;
      }

      const { error: verifySendError } = await withAuthTimeout(
        authClient.emailOtp.sendVerificationOtp({
          email: addr,
          type: "email-verification",
        }),
      );
      if (verifySendError) {
        setError(errorMessage(verifySendError) ?? t.auth.serverError);
        return;
      }

      setMode("signUp");
      setPhase("code");
    } catch (err) {
      console.error("sendCode failed:", err);
      setError(t.auth.serverError);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const addr = email.trim().toLowerCase();
    try {
      await withAuthTimeout(
        authClient.emailOtp.sendVerificationOtp({
          email: addr,
          type: mode === "signIn" ? "sign-in" : "email-verification",
        }),
      );
    } catch (err) {
      console.error("resend failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const finishLogin = async (payload: AuthSessionPayload | null | undefined) => {
    const ok = await completeAuthLogin(payload ?? {});
    if (!ok) {
      setError(t.auth.finalizeFailed);
      return false;
    }
    await AsyncStorage.removeItem(SIGNUP_PWD_KEY);
    const lang = await AsyncStorage.getItem("khadma.lang");
    if (lang === "ar" || lang === "en" || lang === "he") {
      setPhase("welcome");
    } else {
      setPhase("language");
    }
    return true;
  };

  const verify = async () => {
    if (!codeValid || busy) return;
    setBusy(true);
    setError(null);
    const addr = email.trim().toLowerCase();
    const value = code.trim();
    try {
      if (mode === "signIn") {
        const { data, error: verifyError } = await withAuthTimeout(
          authClient.signIn.emailOtp({
            email: addr,
            otp: value,
          }),
        );
        if (verifyError) {
          setError(t.auth.invalidCode);
          return;
        }
        // Don't block UI on API profile fetch — session is enough to advance.
        const sessionOk = await completeAuthLogin(data as AuthSessionPayload);
        if (!sessionOk) {
          setError(t.auth.finalizeFailed);
          return;
        }
        await AsyncStorage.removeItem(SIGNUP_PWD_KEY);
        const lang = await AsyncStorage.getItem("khadma.lang");
        setPhase(
          lang === "ar" || lang === "en" || lang === "he" ? "welcome" : "language",
        );
        return;
      }

      const { error: verifyError } = await withAuthTimeout(
        authClient.emailOtp.verifyEmail({
          email: addr,
          otp: value,
        }),
      );
      if (verifyError) {
        setError(t.auth.invalidCode);
        return;
      }

      const { data, error: signInError } = await withAuthTimeout(
        authClient.signIn.email({
          email: addr,
          password:
            signUpPassword ??
            (await AsyncStorage.getItem(SIGNUP_PWD_KEY)) ??
            "",
        }),
      );
      if (signInError) {
        setError(t.auth.loginFailed);
        return;
      }
      await finishLogin(data as AuthSessionPayload);
    } catch (err) {
      console.error("verify failed:", err);
      setError(t.auth.verifyFailed);
    } finally {
      setBusy(false);
    }
  };

  const enterApp = useCallback(async () => {
    try {
      const active = await hasActiveSession();
      if (!active) {
        setError(t.auth.finalizeFailed);
        setPhase("code");
        return;
      }
      await refreshSession();
      router.replace("/(auth)/complete");
    } catch (err) {
      console.error("[enterApp] failed:", err);
      setError(t.auth.finalizeFailed);
      setPhase("code");
    }
  }, [refreshSession, router, t.auth.finalizeFailed]);

  if (phase === "language") {
    return (
      <View style={[stylesLang.root, { paddingTop: insets.top }]}>
        <View style={stylesLang.content}>
          <View style={stylesLang.header}>
            <View style={stylesLang.iconContainer}>
              <Feather name="globe" size={40} color={Y} />
            </View>
            <Text style={stylesLang.title}>{t.langPicker.title}</Text>
            <Text style={stylesLang.subtitle}>{t.langPicker.subtitle}</Text>
          </View>
          <View style={stylesLang.languages}>
            {STATIC_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={stylesLang.langCard}
                onPress={async () => {
                  await AsyncStorage.setItem("khadma.lang", lang.id);
                  setLang(lang.id);
                  setPhase("welcome");
                }}
                activeOpacity={0.8}
              >
                <View style={stylesLang.langInfo}>
                  <Text style={stylesLang.langLabel}>
                    {lang.id === "ar"
                      ? t.langPicker.arabic
                      : lang.id === "he"
                        ? t.langPicker.hebrew
                        : t.langPicker.english}
                  </Text>
                </View>
                <View style={stylesLang.chevron}>
                  <Feather name="chevron-left" size={20} color={Y} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (phase === "welcome") {
    return <WelcomeSplash onDone={enterApp} />;
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
          <View style={styles.roleBadge}>
            <Feather
              name={isProvider ? "tool" : "user"}
              size={13}
              color={Y}
            />
            <Text style={styles.roleText}>
              {isProvider ? t.auth.provider : t.auth.customer}
            </Text>
          </View>
        </View>

        {phase === "email" ? (
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
              autoComplete="email"
              keyboardType="email-address"
              textAlign={isRTL ? "right" : "left"}
              selectionColor={C.primary}
              onSubmitEditing={sendCode}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.btn, (!emailValid || busy) && styles.btnDisabled]}
              onPress={sendCode}
              disabled={!emailValid || busy}
            >
              <Text style={styles.btnText}>
                {busy ? t.auth.sending : t.auth.sendCode}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>{t.auth.or}</Text>
              <View style={styles.line} />
            </View>

            <GoogleAuthButton
              label={
                isProvider ? t.auth.signUpGoogle : t.auth.signInGoogle
              }
            />

            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>{t.auth.back}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.heading}>{t.auth.verifyEmail}</Text>
            <Text style={styles.subheading}>
              {t.auth.verifySub} {email.trim().toLowerCase()}
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              placeholder="------"
              placeholderTextColor={C.mutedForeground}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              textAlign="center"
              maxLength={6}
              selectionColor={C.primary}
              autoFocus
              onSubmitEditing={verify}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.btn, (!codeValid || busy) && styles.btnDisabled]}
              onPress={verify}
              disabled={!codeValid || busy}
            >
              <Text style={styles.btnText}>
                {busy ? t.auth.verifying : t.auth.verify}
              </Text>
            </Pressable>

            <Pressable onPress={resend} disabled={busy}>
              <Text style={styles.resend}>{t.auth.resend}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setPhase("email");
                setCode("");
                setError(null);
              }}
            >
              <Text style={styles.backLink}>{t.auth.changeEmail}</Text>
            </Pressable>
          </View>
        )}
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
      fontSize: 28,
      fontWeight: "700",
      color: C.foreground,
      letterSpacing: 1,
    },
    roleBadge: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: Y + "15",
      borderWidth: 1,
      borderColor: Y + "35",
    },
    roleText: { fontSize: 13, color: Y, fontWeight: "600" },
    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 24,
      gap: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    heading: {
      fontSize: 22,
      fontWeight: "700",
      color: C.foreground,
      textAlign: "right",
    },
    subheading: {
      fontSize: 14,
      color: C.mutedForeground,
      textAlign: "right",
      lineHeight: 21,
    },
    input: {
      fontSize: 16,
      color: C.foreground,
      backgroundColor: C.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    codeInput: {
      fontSize: 28,
      letterSpacing: 8,
      fontWeight: "700",
      paddingVertical: 16,
    },
    error: { color: "#ff6b6b", fontSize: 13, textAlign: "right" },
    btn: {
      backgroundColor: C.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: 17, fontWeight: "700", color: "#000" },
    resend: {
      color: C.primary,
      fontSize: 14,
      textAlign: "center",
      fontWeight: "600",
    },
    backLink: { color: C.mutedForeground, fontSize: 14, textAlign: "center" },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
    },
    line: { flex: 1, height: 1, backgroundColor: C.border },
    orText: { fontSize: 13, color: C.mutedForeground },
  });

const stylesLang = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200, 165, 116, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(200, 165, 116, 0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Y,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    textAlign: "center",
  },
  languages: {
    gap: 12,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  langInfo: {
    flex: 1,
    alignItems: "center",
  },
  langLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200, 165, 116, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
