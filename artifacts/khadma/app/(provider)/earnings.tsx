import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import {
  getGetMyCommissionQueryKey,
  getGetMyProviderQueryKey,
  useGetMyCommission,
  useGetMyProvider,
  useListRequests,
  useListSkills,
  type ServiceRequest,
  type Skill,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { categories, services } from "@/constants/services";

const Y = "#C8A574";

// Platform commission deducted from each completed job's gross amount.
const COMMISSION_RATE = 0.1;

function skillName(skillId: number, skills: Skill[]) {
  return skills.find((s) => s.id === skillId)?.name ?? "Request";
}

function svcMeta(skillId: number, skills: Skill[]) {
  const skill = skills.find((s) => s.id === skillId);
  if (skill) {
    return { icon: (skill.icon as keyof typeof Feather.glyphMap) ?? "briefcase", color: skill.color ?? Y };
  }
  const svc = services.find((s) => s.id === String(skillId));
  const cat = svc ? categories.find((c) => c.id === svc.categoryId) : undefined;
  return { icon: (svc?.icon ?? "briefcase") as keyof typeof Feather.glyphMap, color: cat?.color ?? Y };
}

function jobAmount(r: ServiceRequest) {
  return r.priceMax ?? r.priceMin ?? 0;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar", { day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

export default function EarningsScreen() {
  const C = useColors();
  const { t, isRTL } = useLang();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const providerQ = useGetMyProvider({ query: { queryKey: getGetMyProviderQueryKey() } });
  const provider = providerQ.data;

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: ["allSkills"], enabled: true } });
  const allSkills = skillsQ.data ?? [];

  const jobsQ = useListRequests(
    { providerId: provider?.id },
    { query: { enabled: !!provider, queryKey: ["myJobs", provider?.id] } },
  );

  const commissionQ = useGetMyCommission({
    query: {
      enabled: !!provider,
      queryKey: getGetMyCommissionQueryKey(),
    },
  });
  const commission = commissionQ.data;

  const completed = (jobsQ.data ?? [])
    .filter((r) => r.status === "completed")
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  // Per-job net is the canonical unit; summary totals are derived by summing
  // the same per-job values so the breakdown can never contradict the rows.
  const netAmount = (r: ServiceRequest) =>
    Math.round(jobAmount(r) * (1 - COMMISSION_RATE));
  const gross = completed.reduce((s, r) => s + jobAmount(r), 0);
  const net = completed.reduce((s, r) => s + netAmount(r), 0);
  const fee = gross - net;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={jobsQ.isRefetching || commissionQ.isRefetching}
          onRefresh={() => {
            jobsQ.refetch();
            commissionQ.refetch();
          }}
          tintColor={Y}
        />
      }
    >
      <Text style={styles.title}>{t.providerEarnings.title}</Text>

      {/* Hero total (net earnings after commission) */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroLabel}>{t.providerEarnings.netLabel}</Text>
        <Text style={styles.heroAmount}>{net.toLocaleString()} {t.providerEarnings.currency}</Text>
        <View style={styles.heroRow}>
          <Feather name="check-circle" size={14} color="#4ADE80" />
          <Text style={styles.heroTrend}>{completed.length} {t.providerEarnings.servicesDone}</Text>
        </View>
      </View>

      {/* Commission breakdown */}
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownValue}>{gross.toLocaleString()} {t.providerEarnings.currency}</Text>
          <Text style={styles.breakdownLabel}>{t.providerEarnings.grossIncome}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownValue, { color: "#F87171" }]}>
            -{fee.toLocaleString()} {t.providerEarnings.currency}
          </Text>
          <Text style={styles.breakdownLabel}>{t.providerEarnings.platformFee}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownValue, { color: "#4ADE80" }]}>
            {net.toLocaleString()} {t.providerEarnings.currency}
          </Text>
          <Text style={[styles.breakdownLabel, { color: C.foreground, fontWeight: "700" }]}>
            {t.providerEarnings.netEarnings}
          </Text>
        </View>
      </View>

      {/* Commission owed to the platform (wallet) */}
      {commission && (
        <View
          style={[
            styles.walletCard,
            commission.blocked && { borderColor: "#F87171" + "55" },
          ]}
        >
          <View style={styles.walletHeader}>
            <View
              style={[
                styles.walletIcon,
                {
                  backgroundColor: commission.blocked
                    ? "#F87171" + "18"
                    : Y + "14",
                },
              ]}
            >
              <Feather
                name="credit-card"
                size={16}
                color={commission.blocked ? "#F87171" : Y}
              />
            </View>
            <Text style={styles.walletTitle}>{t.providerEarnings.commissionOwed}</Text>
          </View>
          <Text
            style={[
              styles.walletAmount,
              { color: commission.owed > 0 ? "#F87171" : "#4ADE80" },
            ]}
          >
            {commission.owed.toLocaleString()} {t.providerEarnings.currency}
          </Text>
          <Text style={styles.walletHint}>
            {commission.owed > 0
              ? t.providerEarnings.commissionBreakdown.replace("{total}", commission.totalCommission.toLocaleString()).replace("{settled}", commission.totalSettled.toLocaleString())
              : t.providerEarnings.noCommission}
          </Text>
          <View style={styles.walletProgressTrack}>
            <View
              style={[
                styles.walletProgressFill,
                {
                  width: `${Math.min(100, commission.threshold > 0 ? (commission.owed / commission.threshold) * 100 : 0)}%`,
                  backgroundColor: commission.blocked ? "#F87171" : Y,
                },
              ]}
            />
          </View>
          <Text style={styles.walletThreshold}>
            {t.providerEarnings.threshold.replace("{threshold}", commission.threshold.toLocaleString())}
          </Text>
          {commission.blocked && (
            <View style={styles.walletWarning}>
              <Feather name="alert-triangle" size={14} color="#F87171" />
              <Text style={styles.walletWarningText}>
                {t.providerEarnings.commissionWarning}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.providerEarnings.history}</Text>
        {jobsQ.isLoading ? (
          <ActivityIndicator color={Y} style={{ marginVertical: 30 }} />
        ) : completed.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="dollar-sign" size={30} color={C.mutedForeground} />
            <Text style={styles.emptyText}>{t.providerEarnings.noEarnings}</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {completed.map((r, i) => {
              const meta = svcMeta(r.skillId, allSkills);
              return (
                <View key={r.id} style={[styles.histRow, i === completed.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.histIcon, { backgroundColor: meta.color + "18" }]}>
                    <Feather name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={styles.histInfo}>
                    <Text style={styles.histService}>{skillName(r.skillId, allSkills)}</Text>
                    <Text style={styles.histMeta}>{formatDate(r.updatedAt)} · {t.providerEarnings.request} {r.requestNumber}</Text>
                  </View>
                  <View style={{ alignItems: "flex-start" }}>
                    <Text style={styles.histAmount}>+{netAmount(r)} {t.providerEarnings.currency}</Text>
                    <Text style={styles.histGross}>{t.providerEarnings.from} {jobAmount(r)} {t.providerEarnings.currency}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 16, gap: 16 },
  title: { fontSize: 30, fontWeight: "700", color: C.foreground, letterSpacing: -0.5, textAlign: "right", paddingVertical: 8 },

  heroCard: {
    backgroundColor: "#100D00", borderRadius: 22, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: Y + "30", overflow: "hidden", gap: 8,
  },
  heroGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: Y, opacity: 0.06, top: -60 },
  heroLabel: { fontSize: 13, color: C.mutedForeground, fontWeight: "500" },
  heroAmount: { fontSize: 40, fontWeight: "700", color: Y, letterSpacing: -1 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroTrend: { fontSize: 13, color: "#4ADE80", fontWeight: "500" },

  breakdownCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  breakdownLabel: { fontSize: 13, color: C.mutedForeground, fontWeight: "500" },
  breakdownValue: { fontSize: 15, fontWeight: "700", color: C.foreground },
  breakdownDivider: { height: 1, backgroundColor: C.border },

  walletCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 18, gap: 10,
  },
  walletHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  walletIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  walletTitle: { fontSize: 14, fontWeight: "700", color: C.foreground, textAlign: "right", flex: 1 },
  walletAmount: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5, textAlign: "right" },
  walletHint: { fontSize: 12, color: C.mutedForeground, textAlign: "right" },
  walletProgressTrack: { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: "hidden" },
  walletProgressFill: { height: 6, borderRadius: 3 },
  walletThreshold: { fontSize: 11, color: C.mutedForeground, textAlign: "right" },
  walletWarning: {
    flexDirection: "row-reverse", alignItems: "flex-start", gap: 8,
    backgroundColor: "#F87171" + "12", borderRadius: 12, padding: 12, marginTop: 2,
  },
  walletWarningText: { flex: 1, fontSize: 12, color: "#F87171", textAlign: "right", lineHeight: 18 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.foreground, textAlign: "right" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 36 },
  emptyText: { fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingHorizontal: 20 },

  historyList: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  histRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  histIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  histInfo: { flex: 1 },
  histService: { fontSize: 14, fontWeight: "600", color: C.foreground, textAlign: "right" },
  histMeta: { fontSize: 11, color: C.mutedForeground, textAlign: "right", marginTop: 2 },
  histAmount: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },
  histGross: { fontSize: 10, color: C.mutedForeground, marginTop: 1 },
});
