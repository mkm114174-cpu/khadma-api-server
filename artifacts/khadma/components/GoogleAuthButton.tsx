import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import type { AuthSessionPayload } from "@/lib/authSession";
import {
  authClient,
  OAUTH_TIMEOUT_MS,
  withAuthTimeout,
} from "@/lib/neonAuth";

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton({ label }: { label?: string }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { completeAuthLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const onPress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const callbackURL = Linking.createURL("/(auth)/complete");
      const { data, error: authError } = await withAuthTimeout(
        authClient.signIn.social({
          provider: "google",
          callbackURL,
        }),
        OAUTH_TIMEOUT_MS,
      );
      if (authError) {
        console.error("Google sign-in failed:", authError);
        setError(t.auth.loginFailed);
        return;
      }
      const ok = await completeAuthLogin((data ?? {}) as AuthSessionPayload);
      if (!ok) {
        setError(t.auth.finalizeFailed);
        return;
      }
      router.replace("/(auth)/complete");
    } catch (err) {
      console.error("Google SSO failed:", err);
      setError(t.auth.serverError);
    } finally {
      setLoading(false);
    }
  }, [completeAuthLogin, router, t.auth.finalizeFailed, t.auth.loginFailed, t.auth.serverError]);

  return (
    <>
      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={C.foreground} />
        ) : (
          <>
            <Text style={styles.icon}>G</Text>
            <Text style={styles.text}>{label ?? t.auth.signInGoogle}</Text>
          </>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: C.card,
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    btnDisabled: { opacity: 0.5 },
    icon: { fontSize: 18, fontWeight: "700", color: C.foreground },
    text: { fontSize: 15, fontWeight: "600", color: C.foreground },
    error: {
      color: "#ff6b6b",
      fontSize: 13,
      textAlign: "center",
      marginTop: 4,
    },
  });
