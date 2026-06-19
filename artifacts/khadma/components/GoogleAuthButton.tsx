import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
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
import { authClient } from "@/lib/neonAuth";

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton({ label }: { label?: string }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);

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
      const callbackURL = Linking.createURL("/");
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (error) {
        console.error("Google sign-in failed:", error);
        return;
      }
      await refreshSession();
    } catch (err) {
      console.error("Google SSO failed:", err);
    } finally {
      setLoading(false);
    }
  }, [refreshSession]);

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
  });
