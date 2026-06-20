import React from "react";
import { StyleSheet, Text, View } from "react-native";

const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const neonAuth = process.env.EXPO_PUBLIC_NEON_AUTH_URL ?? "";

function isBrokenReleaseBuild() {
  if (__DEV__) return false;
  const host = domain.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return (
    !host ||
    host === "localhost" ||
    host.startsWith("127.") ||
    !neonAuth ||
    !neonAuth.includes("neonauth")
  );
}

/**
 * Shown when a release APK was built without production API/Auth URLs
 * (e.g. CI defaulted to localhost). Prevents a silent broken app.
 */
export function ConfigGuard({ children }: { children: React.ReactNode }) {
  if (!isBrokenReleaseBuild()) {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>إعداد التطبيق غير مكتمل</Text>
      <Text style={styles.body}>
        هذا الإصدار مُثبّت بدون عنوان الخادم الصحيح ولا يمكنه الاتصال بالخدمة.
        {"\n\n"}
        يرجى حذف هذا الإصدار وتثبيت نسخة مُبنية بإعدادات الإنتاج الصحيحة (v1.0.2
        أو أحدث).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    color: "#F5C518",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  body: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
});
