import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import {
  getGetMyProviderQueryKey,
  getListProviderSkillsQueryKey,
  useGetMyProvider,
  useListRequests,
  useUpdateProvider,
  useListProviderSkills,
  useListSkills,
  type ServiceRequest,
  type ProviderSkill,
  type Skill,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { services } from "@/constants/services";
import { DEFAULT_RADIUS_KM, isProviderAvailableNow } from "@/lib/availability";
import ProviderMap, { type CustomerRequest } from "@/components/ProviderMap";

const Y = "#C8A574";

/* Shefa-Amr, Israel */
const DEFAULT_REGION = {
  latitude: 32.8028,
  longitude: 35.1703,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function skillName(skillId: number, skills: Skill[]) {
  return skills.find((s) => s.id === skillId)?.name ?? "Request";
}

function svcMeta(skillId: number, skills: ProviderSkill[], allSkills: Skill[]) {
  const skill = skills.find((s) => s.skillId === skillId);
  if (skill?.skill?.icon) {
    return { icon: (skill.skill.icon as keyof typeof Feather.glyphMap) ?? "briefcase", color: skill.skill.color ?? Y };
  }
  const allSkill = allSkills.find((s) => s.id === skillId);
  if (allSkill) {
    return { icon: (allSkill.icon as keyof typeof Feather.glyphMap) ?? "briefcase", color: allSkill.color ?? Y };
  }
  const svc = services.find((s) => s.id === String(skillId));
  return { icon: (svc?.icon ?? "briefcase") as keyof typeof Feather.glyphMap, color: Y };
}

function jobAmount(r: ServiceRequest) {
  return r.priceMax ?? r.priceMin ?? 0;
}

export default function ProviderDashboard() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { name } = useAuth();
  const { t, isRTL } = useLang();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabBarH = Platform.OS === "web" ? 84 : 60 + insets.bottom;
  const align = isRTL ? "right" : "left";

  const providerQ = useGetMyProvider({ query: { queryKey: getGetMyProviderQueryKey() } });
  const provider = providerQ.data;

  const myJobsQ = useListRequests(
    { providerId: provider?.id },
    { query: { enabled: !!provider, queryKey: ["myJobs", provider?.id] } },
  );
  const availableNow = provider ? isProviderAvailableNow(provider) : false;
  const nearParams =
    provider?.lat != null && provider?.lng != null
      ? { lat: provider.lat, lng: provider.lng, radiusKm: DEFAULT_RADIUS_KM }
      : {};

  const openReqQ = useListRequests(
    { status: "pending", ...nearParams },
    { query: { enabled: availableNow, queryKey: ["openRequests"] } },
  );

  const providerSkillsQ = useListProviderSkills(
    { query: { enabled: !!provider, queryKey: getListProviderSkillsQueryKey() } },
  );
  const providerSkills = providerSkillsQ.data ?? [];

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: ["allSkills"], enabled: true } });
  const allSkills = skillsQ.data ?? [];

  const updateProvider = useUpdateProvider();

  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [scheduleDirty, setScheduleDirty] = useState(false);

  useEffect(() => {
    if (!provider || scheduleDirty) return;
    setFromTime(provider.availableFrom ?? "");
    setToTime(provider.availableTo ?? "");
  }, [provider?.availableFrom, provider?.availableTo, scheduleDirty]);

  const available = provider?.isAvailable ?? false;
  const myJobs = myJobsQ.data ?? [];
  const completed = myJobs.filter((r) => r.status === "completed");
  const activeJobs = myJobs.filter((r) => r.status === "active");
  const earnings = completed.reduce((s, r) => s + jobAmount(r), 0);

  // Server already filters open requests by provider skills; just use them
  const openRequests = openReqQ.data ?? [];

  const mapRequests: CustomerRequest[] = [...openRequests, ...activeJobs]
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: String(r.id),
      service: skillName(r.skillId, allSkills),
      client: "",
      price: jobAmount(r),
      distance: "",
      coordinate: { latitude: r.lat as number, longitude: r.lng as number },
      isNew: r.status === "pending",
      status: r.status,
    }));

  const mapRegion =
    provider?.lat != null && provider?.lng != null
      ? { latitude: provider.lat, longitude: provider.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : DEFAULT_REGION;

  const refresh = () => {
    void providerQ.refetch();
    void myJobsQ.refetch();
    void openReqQ.refetch();
  };

  const invalidateProvider = () =>
    queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() });

  const toggleAvailable = async (next: boolean) => {
    if (!provider) return;
    try {
      await updateProvider.mutateAsync({ id: provider.id, data: { isAvailable: next } });
      await invalidateProvider();
    } catch {
      // surfaced via providerQ on next refetch
    }
  };

  const saveSchedule = async () => {
    if (!provider) return;
    try {
      await updateProvider.mutateAsync({
        id: provider.id,
        data: {
          availableFrom: fromTime.trim() || null,
          availableTo: toTime.trim() || null,
        },
      });
      await invalidateProvider();
      setScheduleDirty(false);
    } catch {
      // ignore; user can retry
    }
  };

  if (providerQ.isLoading || !provider) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Y} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarH + 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={myJobsQ.isRefetching || openReqQ.isRefetching}
          onRefresh={refresh}
          tintColor={Y}
        />
      }
    >
      <View style={[styles.headerRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { textAlign: align }]}>
            {t.providerDashboard.greeting.replace("{name}", name || t.providerDashboard.guest)}
          </Text>
          <Text style={[styles.svcType, { textAlign: align }]}>{providerSkills.map((s) => s.skill?.name).filter(Boolean).join(" · ") || provider.serviceType || "—"}</Text>
        </View>
        <TouchableOpacity
          style={styles.msgIconBtn}
          onPress={() => router.push("/messages")}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Feather name="message-circle" size={20} color={C.foreground} />
        </TouchableOpacity>
        <View style={[styles.availPill, { backgroundColor: (available ? "#4ADE80" : "#666") + "18" }]}>
          <View style={[styles.dot, { backgroundColor: available ? "#4ADE80" : "#666" }]} />
          <Text style={[styles.availPillText, { color: available ? "#4ADE80" : C.mutedForeground }]}>
            {available ? t.providerDashboard.availOn : t.providerDashboard.availOff}
          </Text>
        </View>
      </View>

      {/* Availability card */}
      <View style={styles.card}>
        <View style={[styles.availRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { textAlign: align }]}>{t.providerDashboard.receiveRequests}</Text>
            <Text style={[styles.cardHint, { textAlign: align }]}>
              {available ? t.providerDashboard.visibleNow : t.providerDashboard.activateAvail}
            </Text>
          </View>
          <Switch
            value={available}
            onValueChange={toggleAvailable}
            disabled={updateProvider.isPending}
            trackColor={{ false: "#333", true: C.primary + "80" }}
            thumbColor={available ? C.primary : "#666"}
          />
        </View>

        <View style={styles.sep} />

        <Text style={[styles.cardTitle, { marginBottom: 8, textAlign: align }]}>{t.providerDashboard.workHours}</Text>
        <View style={[styles.timeRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
          <View style={styles.timeField}>
            <Text style={[styles.timeLabel, { textAlign: align }]}>{t.providerDashboard.from}</Text>
            <TextInput
              style={styles.timeInput}
              value={fromTime}
              onChangeText={(v) => { setFromTime(v); setScheduleDirty(true); }}
              placeholder="09:00"
              placeholderTextColor={C.mutedForeground}
              textAlign="center"
            />
          </View>
          <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={16} color={C.mutedForeground} />
          <View style={styles.timeField}>
            <Text style={[styles.timeLabel, { textAlign: align }]}>{t.providerDashboard.to}</Text>
            <TextInput
              style={styles.timeInput}
              value={toTime}
              onChangeText={(v) => { setToTime(v); setScheduleDirty(true); }}
              placeholder="18:00"
              placeholderTextColor={C.mutedForeground}
              textAlign="center"
            />
          </View>
        </View>
        {scheduleDirty && (
          <TouchableOpacity style={styles.saveBtn} onPress={saveSchedule} disabled={updateProvider.isPending}>
            {updateProvider.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>{t.providerDashboard.saveHours}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Feather name="check-circle" size={16} color="#4ADE80" />
          <Text style={styles.statNum}>{completed.length}</Text>
          <Text style={styles.statLabel}>{t.providerDashboard.completed}</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="zap" size={16} color="#60A5FA" />
          <Text style={styles.statNum}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>{t.providerDashboard.active}</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="trending-up" size={18} color={C.primary} />
          <Text style={styles.statNum}>{earnings.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t.providerDashboard.earnings}</Text>
        </View>
      </View>

      {/* Map — open & active requests by status */}
      {mapRequests.length > 0 && (
        <View style={styles.mapCard}>
          <ProviderMap
            region={mapRegion}
            requests={mapRequests}
            selectedRequest={null}
            locationGranted={false}
            onPinPress={() => router.push("/(provider)/requests")}
            onMapPress={() => {}}
          />
        </View>
      )}

      {/* Open requests */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.providerDashboard.openRequests}</Text>
        <TouchableOpacity onPress={() => router.push("/(provider)/requests")}>
          <Text style={styles.seeAll}>{t.providerDashboard.seeAll}</Text>
        </TouchableOpacity>
      </View>

      {!availableNow ? (
        <View style={styles.empty}>
          <Feather name="eye-off" size={26} color={C.mutedForeground} />
          <Text style={styles.emptyText}>{t.providerDashboard.activateAvailHint}</Text>
        </View>
      ) : openReqQ.isLoading ? (
        <ActivityIndicator color={Y} style={{ marginVertical: 24 }} />
      ) : openRequests.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={26} color={C.mutedForeground} />
          <Text style={styles.emptyText}>{t.providerDashboard.noMatching}</Text>
        </View>
      ) : (
        openRequests.slice(0, 5).map((req) => {
          const meta = svcMeta(req.skillId, providerSkills, allSkills);
          return (
            <TouchableOpacity
              key={req.id}
              style={styles.reqCard}
              onPress={() => router.push("/(provider)/requests")}
              activeOpacity={0.85}
            >
              <View style={[styles.reqIcon, { backgroundColor: meta.color + "18" }]}>
                <Feather name={meta.icon} size={18} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reqService, { textAlign: align }]}>{skillName(req.skillId, allSkills)}</Text>
                <Text style={[styles.reqMeta, { textAlign: align }]} numberOfLines={1}>
                  {req.address || req.description || `${t.providerDashboard.request} #${req.requestNumber}`}
                </Text>
              </View>
              {(req.priceMin != null || req.priceMax != null) && (
                <Text style={styles.reqPrice}>
                  {req.priceMin ?? req.priceMax}
                  {req.priceMax && req.priceMin && req.priceMax !== req.priceMin ? `-${req.priceMax}` : ""} {t.providerDashboard.earnings}
                </Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, backgroundColor: C.background, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  msgIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  greeting: { fontSize: 14, color: C.mutedForeground, letterSpacing: 0.3 },
  svcType: { fontSize: 26, fontWeight: "800", color: C.foreground, letterSpacing: -0.5 },
  availPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24 },
  availPillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  card: { 
    backgroundColor: C.card, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  availRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: C.foreground, letterSpacing: -0.3 },
  cardHint: { fontSize: 13, color: C.mutedForeground, marginTop: 4, lineHeight: 18 },
  sep: { height: 1, backgroundColor: C.border, marginVertical: 20, opacity: 0.5 },

  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  timeField: { flex: 1, gap: 8 },
  timeLabel: { fontSize: 13, color: C.mutedForeground, fontWeight: "600" },
  timeInput: {
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingVertical: 12, fontSize: 16, fontWeight: "700", color: C.foreground,
  },
  saveBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: C.primaryForeground },

  mapCard: {
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    backgroundColor: C.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingVertical: 18, alignItems: "center", gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: "800", color: C.foreground, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.mutedForeground, fontWeight: "600", textTransform: "uppercase" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: C.foreground, letterSpacing: -0.5 },
  seeAll: { fontSize: 14, color: C.primary, fontWeight: "700" },

  empty: { alignItems: "center", gap: 12, paddingVertical: 40, backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, borderStyle: "dashed" },
  emptyText: { fontSize: 14, color: C.mutedForeground, textAlign: "center", fontWeight: "500" },

  reqCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  reqIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  reqService: { fontSize: 16, fontWeight: "800", color: C.foreground, letterSpacing: -0.3 },
  reqMeta: { fontSize: 13, color: C.mutedForeground, marginTop: 4, lineHeight: 18 },
  reqPrice: { fontSize: 15, fontWeight: "800", color: C.primary },
});
