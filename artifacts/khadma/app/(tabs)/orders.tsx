import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Provider, ServiceRequest, useListProviders, useListRequests, useListSkills, type Skill } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { services } from "@/constants/services";
import { categories } from "@/constants/services";
import { serviceNameByType } from "@/constants/serviceTranslations";
import { useLang } from "@/context/LanguageContext";

type Status = ServiceRequest["status"];

const STATUS_META: Record<Status, { color: string; icon: string; bg: string }> = {
  pending: { color: "#C8A574", icon: "clock", bg: "#C8A57415" },
  active: { color: "#3B82F6", icon: "activity", bg: "#3B82F615" },
  in_progress: { color: "#8B5CF6", icon: "play", bg: "#8B5CF615" },
  completed: { color: "#10B981", icon: "check-circle", bg: "#10B98115" },
  cancelled: { color: "#EF4444", icon: "x-circle", bg: "#EF444415" },
};

function skillName(skillId: number, skills: Skill[]) {
  return skills.find((s) => s.id === skillId)?.name ?? "Request";
}

function serviceMeta(skillId: number, skills: Skill[]) {
  const skill = skills.find((s) => s.id === skillId);
  if (skill) {
    return { icon: skill.icon ?? "briefcase", color: skill.color ?? "#C8A574" };
  }
  const svc = services.find((s) => s.id === String(skillId));
  const cat = svc ? categories.find((c) => c.id === svc.categoryId) : undefined;
  return { icon: svc?.icon ?? "briefcase", color: cat?.color ?? "#C8A574" };
}

function fmtDateTime(iso: string, isRTL: boolean) {
  return new Date(iso).toLocaleString(isRTL ? "ar" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequestCard({ request, provider, skills }: { request: ServiceRequest; provider?: Provider; skills: Skill[] }) {
  const colors = useColors();
  const { t, isRTL, lang } = useLang();
  const meta = STATUS_META[request.status];
  const svc = serviceMeta(request.skillId, skills);

  const statusLabel =
    request.status === "pending"
      ? t.req.statusPending
      : request.status === "active"
        ? t.req.statusActive
        : request.status === "in_progress"
          ? t.req.statusInProgress
          : request.status === "completed"
            ? t.req.statusCompleted
            : t.req.statusCancelled;

  const date = new Date(request.createdAt).toLocaleDateString(
    isRTL ? "ar" : "en",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const priceText =
    request.priceMin != null && request.priceMax != null
      ? `${request.priceMin}–${request.priceMax} ${t.req.currency}`
      : request.priceMin != null
        ? `${request.priceMin}+ ${t.req.currency}`
        : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        },
      ]}
      onPress={() => router.push(`/request/${request.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.cardHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.orderId, { color: colors.mutedForeground }]}>
          #{request.requestNumber}
        </Text>
      </View>

      <View style={[styles.body, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={[styles.serviceIcon, { backgroundColor: svc.color + "15" }]}>
          <Feather name={svc.icon as any} size={22} color={svc.color} />
        </View>
        <View style={[styles.bodyText, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Text
            style={[
              styles.serviceName,
              { color: colors.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {skillName(request.skillId, skills)}
          </Text>
          {!!request.description && (
            <Text
              style={[
                styles.desc,
                { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
              ]}
              numberOfLines={2}
            >
              {request.description}
            </Text>
          )}
        </View>
        <View style={styles.chevronContainer}>
          <Feather
            name={isRTL ? "chevron-left" : "chevron-right"}
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      </View>

      {(provider || request.scheduledTime) && (
        <View style={[styles.infoRow, { borderTopColor: colors.border + "50", borderTopWidth: 1 }]}>
          {provider && (
            <View style={[styles.infoItem, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="user" size={12} color={colors.primary} />
              </View>
              <Text style={[styles.infoText, { color: colors.foreground }]} numberOfLines={1}>
                {t.req.chosenProvider}: {serviceNameByType(provider.serviceType ?? "", lang)}
              </Text>
            </View>
          )}
          {request.scheduledTime && (
            <View style={[styles.infoItem, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
              <View style={[styles.infoIconBg, { backgroundColor: colors.muted + "50" }]}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {fmtDateTime(request.scheduledTime, isRTL)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.cardFooter,
          {
            backgroundColor: colors.muted + "20",
            flexDirection: isRTL ? "row" : "row-reverse",
          },
        ]}
      >
        <Text style={[styles.footerDate, { color: colors.mutedForeground }]}>{date}</Text>
        {priceText && (
          <Text style={[styles.footerPrice, { color: colors.primary }]}>{priceText}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MyRequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isRefetching } = useListRequests({ mine: true });
  const requests = data ?? [];

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: ["allSkills"], enabled: true } });
  const skills = skillsQ.data ?? [];

  const providersQ = useListProviders();
  const providerMap = useMemo(() => {
    const m = new Map<number, Provider>();
    (providersQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [providersQ.data]);

  const current = requests.filter((r) => r.status === "pending" || r.status === "active");
  const past = requests.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 16,
            backgroundColor: colors.background,
            flexDirection: isRTL ? "row" : "row-reverse",
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.req.myTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" }]}>
            {requests.length} {t.req.myTitle.toLowerCase()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.refreshBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[] as never[]}
          keyExtractor={(_, i) => String(i)}
          scrollEnabled
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {isError && (
                <View style={styles.empty}>
                  <View style={[styles.emptyIconBg, { backgroundColor: colors.card }]}>
                    <Feather name="alert-triangle" size={36} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.req.error}</Text>
                  <TouchableOpacity
                    style={[styles.newBtn, { backgroundColor: colors.primary }]}
                    onPress={() => refetch()}
                  >
                    <Text style={styles.newBtnText}>{t.req.ok}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isError && current.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                    <View style={[styles.sectionDot, { backgroundColor: "#2196F3" }]} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.req.current}</Text>
                  </View>
                  {current.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      provider={r.providerId != null ? providerMap.get(r.providerId) : undefined}
                      skills={skills}
                    />
                  ))}
                </>
              )}

              {!isError && past.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                    <View style={[styles.sectionDot, { backgroundColor: colors.mutedForeground }]} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.req.past}</Text>
                  </View>
                  {past.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      provider={r.providerId != null ? providerMap.get(r.providerId) : undefined}
                      skills={skills}
                    />
                  ))}
                </>
              )}

              {!isError && requests.length === 0 && (
                <View style={styles.empty}>
                  <View style={[styles.emptyIconBg, { backgroundColor: colors.card }]}>
                    <Feather name="package" size={40} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.req.empty}</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                    {t.req.emptySub}
                  </Text>
                  <TouchableOpacity
                    style={[styles.newBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push("/(tabs)/request")}
                  >
                    <Feather name="plus" size={16} color="#000" />
                    <Text style={styles.newBtnText}>{t.req.newRequest}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeader: {
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    marginTop: 12,
  },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 13, fontWeight: "700" },
  orderId: { fontSize: 13, fontWeight: "600", opacity: 0.7 },
  body: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyText: { flex: 1, gap: 4 },
  serviceName: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  desc: { fontSize: 13, lineHeight: 18 },
  chevronContainer: {
    opacity: 0.3,
  },
  infoRow: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  infoItem: { alignItems: "center", gap: 10 },
  infoIconBg: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  cardFooter: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerDate: { fontSize: 12, fontWeight: "500" },
  footerPrice: { fontSize: 16, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 70, gap: 16, paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  emptySubtitle: { fontSize: 16, textAlign: "center", lineHeight: 22, opacity: 0.7 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  newBtnText: { fontSize: 16, fontWeight: "800", color: "#000" },
});
