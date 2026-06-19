import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import type { ProviderStatus } from "@workspace/api-client-react";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const Y = "#C8A574";

type GateStatus = Exclude<ProviderStatus, "approved">;

const CONFIG: Record<
  GateStatus,
  { icon: keyof typeof Feather.glyphMap; color: string; title: string; body: string }
> = {
  pending: {
    icon: "clock",
    color: Y,
    title: "طلبك قيد الانتظار",
    body: "تم استلام طلب تسجيلك بنجاح. سيتم مراجعته من قِبل الإدارة قريباً.",
  },
  under_review: {
    icon: "search",
    color: "#60A5FA",
    title: "جارٍ مراجعة طلبك",
    body: "نقوم حالياً بالتحقق من بياناتك. سيصلك إشعار عند اكتمال المراجعة.",
  },
  needs_info: {
    icon: "alert-circle",
    color: Y,
    title: "مطلوب معلومات إضافية",
    body: "طلبت الإدارة بعض المعلومات أو المستندات الإضافية لإكمال مراجعتك.",
  },
  rejected: {
    icon: "x-circle",
    color: "#F87171",
    title: "تم رفض الطلب",
    body: "للأسف لم تتم الموافقة على طلب تسجيلك. تواصل مع الدعم لمزيد من التفاصيل.",
  },
};

export default function ProviderStatusScreen({
  status,
  onRefresh,
}: {
  status: GateStatus;
  onRefresh: () => void;
}) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const topInset = Platform.OS === "web" ? 40 : insets.top;
  const cfg = CONFIG[status];

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + "15", borderColor: cfg.color + "35" }]}>
          <Feather name={cfg.icon} size={40} color={cfg.color} />
        </View>
        <Text style={styles.title}>{cfg.title}</Text>
        <Text style={styles.text}>{cfg.body}</Text>

        {status !== "rejected" && (
          <View style={styles.steps}>
            <Step label="استلام الطلب" done />
            <Step label="المراجعة" done={status === "under_review"} active={status === "pending"} />
            <Step label="الموافقة" />
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Feather name="refresh-cw" size={15} color="#000" />
          <Text style={styles.refreshText}>تحديث الحالة</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logout, { marginBottom: insets.bottom + 16 }]} onPress={logout}>
        <Feather name="log-out" size={15} color={C.mutedForeground} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const color = done ? "#4ADE80" : active ? Y : C.mutedForeground;
  return (
    <View style={styles.step}>
      <View style={[styles.stepDot, { borderColor: color, backgroundColor: done ? color : "transparent" }]}>
        {done && <Feather name="check" size={11} color="#000" />}
      </View>
      <Text style={[styles.stepLabel, { color }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, justifyContent: "space-between" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 14 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 30, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "700", color: C.foreground, textAlign: "center" },
  text: { fontSize: 14, color: C.mutedForeground, textAlign: "center", lineHeight: 22 },

  steps: { width: "100%", gap: 14, marginTop: 18, paddingHorizontal: 12 },
  step: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  stepLabel: { fontSize: 14, fontWeight: "600" },

  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Y, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, marginTop: 24,
  },
  refreshText: { fontSize: 14, fontWeight: "700", color: "#000" },

  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12,
  },
  logoutText: { fontSize: 13, fontWeight: "600", color: C.mutedForeground },
});
