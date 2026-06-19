import { useClerk, useSignIn, useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LogoIcon } from "@/components/LogoIcon";
import { WelcomeSplash } from "@/components/WelcomeSplash";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

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

function errorCode(error: unknown): string | undefined {
  const e = error as { errors?: { code?: string }[]; code?: string } | null;
  return e?.errors?.[0]?.code ?? e?.code;
}

function errorMessage(error: unknown): string | undefined {
  const e = error as
    | { errors?: { message?: string; longMessage?: string }[] }
    | null;
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message;
}

export default function EmailCodeScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { t, isRTL, setLang } = useLang();
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const clerk = useClerk() as any;
  const setActive = clerk?.setActive;

  const [phase, setPhase] = useState<Phase>("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const codeValid = code.trim().length >= 6;

  const sendCode = async () => {
    if (!emailValid || busy) return;
    setBusy(true);
    setError(null);
    const addr = email.trim().toLowerCase();
    try {
      // Existing customers: send a sign-in code straight away.
      const { error: signInError } = await signIn.emailCode.sendCode({
        emailAddress: addr,
      });

      if (!signInError) {
        setMode("signIn");
        setPhase("code");
        return;
      }

      // No account yet → create one and send a verification code instead.
      if (errorCode(signInError) === "form_identifier_not_found") {
        const { error: createError } = await signUp.create({ emailAddress: addr });
        if (createError) {
          setError(errorMessage(createError) ?? t.auth.signupFailed);
          return;
        }
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setError(errorMessage(sendError) ?? t.auth.serverError);
          return;
        }
        setMode("signUp");
        setPhase("code");
        return;
      }

      setError(errorMessage(signInError) ?? t.auth.serverError);
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
    try {
      if (mode === "signIn") {
        await signIn.emailCode.sendCode({ emailAddress: email.trim().toLowerCase() });
      } else {
        await signUp.verifications.sendEmailCode();
      }
    } catch (err) {
      console.error("resend failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!codeValid || busy) return;
    setBusy(true);
    setError(null);
    const value = code.trim();
    try {
      if (mode === "signIn") {
        const { error: verifyError } = await signIn.emailCode.verifyCode({ code: value });
        if (verifyError) {
          setError(t.auth.invalidCode);
          return;
        }
        if (signIn.status !== "complete") {
          setError(t.auth.loginFailed);
          return;
        }
      } else {
        const { error: verifyError } = await signUp.verifications.verifyEmailCode({
          code: value,
        });
        if (verifyError) {
          setError(t.auth.invalidCode);
          return;
        }
        if (signUp.status !== "complete") {
          setError(t.auth.signupFailed);
          return;
        }
      }

      // Code accepted — show language selection before welcome splash
      setPhase("language");
    } catch (err) {
      console.error("verify failed:", err);
      setError(t.auth.verifyFailed);
    } finally {
      setBusy(false);
    }
  };

  const enterApp = useCallback(async () => {
    console.log("[enterApp] mode=", mode, "signUp.status=", signUp?.status, "signUp.createdSessionId=", signUp?.createdSessionId, "signIn.status=", signIn?.status, "signIn.createdSessionId=", signIn?.createdSessionId);
    try {
      if (mode === "signUp" && signUp.status === "complete" && signUp.createdSessionId) {
        console.log("[enterApp] calling setActive for signUp");
        await setActive({ session: signUp.createdSessionId });
        console.log("[enterApp] setActive done");
      } else if (mode === "signIn" && signIn.status === "complete" && signIn.createdSessionId) {
        console.log("[enterApp] calling setActive for signIn");
        await setActive({ session: signIn.createdSessionId });
        console.log("[enterApp] setActive done");
      } else {
        console.log("[enterApp] no active session, trying finalize");
        if (mode === "signUp" && signUp.finalize) {
          await signUp.finalize({
            navigate: () => {
              console.log("[enterApp] finalize navigate called");
            },
          });
        } else if (mode === "signIn" && signIn.finalize) {
          await signIn.finalize({
            navigate: () => {
              console.log("[enterApp] finalize navigate called");
            },
          });
        }
      }
    } catch (err) {
      console.error("[enterApp] failed:", err);
      setError(t.auth.finalizeFailed);
      setPhase("code");
    }
  }, [mode, signUp, signIn, setActive, t.auth.finalizeFailed]);

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
                    {lang.id === "ar" ? t.langPicker.arabic : lang.id === "he" ? t.langPicker.hebrew : t.langPicker.english}
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
            <Feather name="user" size={13} color={Y} />
            <Text style={styles.roleText}>{t.auth.customer}</Text>
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
              <Text style={styles.btnText}>{busy ? t.auth.sending : t.auth.sendCode}</Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>{t.auth.back}</Text>
            </Pressable>

            {/* Required for sign-up — Clerk bot protection is enabled by default */}
            <View nativeID="clerk-captcha" />
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
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ""))}
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
              <Text style={styles.btnText}>{busy ? t.auth.verifying : t.auth.verify}</Text>
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
    scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, gap: 24 },
    logoWrap: { alignItems: "center", gap: 8 },
    appName: { fontSize: 28, fontWeight: "700", color: C.foreground, letterSpacing: 1 },
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
    heading: { fontSize: 22, fontWeight: "700", color: C.foreground, textAlign: "right" },
    subheading: { fontSize: 14, color: C.mutedForeground, textAlign: "right", lineHeight: 21 },
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
    codeInput: { fontSize: 28, letterSpacing: 8, fontWeight: "700", paddingVertical: 16 },
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
    resend: { color: C.primary, fontSize: 14, textAlign: "center", fontWeight: "600" },
    backLink: { color: C.mutedForeground, fontSize: 14, textAlign: "center" },
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
  langDir: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
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
