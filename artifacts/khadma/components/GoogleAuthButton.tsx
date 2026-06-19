import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { useColors } from "@/hooks/useColors";

// Handle any pending authentication sessions.
WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton({ label }: { label?: string }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  // Preloads the browser for Android to reduce authentication load time.
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
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google SSO failed:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  return (
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
          <Text style={styles.text}>{label ?? "المتابعة عبر Google"}</Text>
        </>
      )}
    </Pressable>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
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
});
