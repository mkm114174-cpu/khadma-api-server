import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useQueryClient } from "@tanstack/react-query";

import {
  ApiError,
  getGetCurrentUserQueryKey,
  getGetMyProviderQueryKey,
  getListProviderSkillsQueryKey,
  getListSkillsQueryKey,
  useCreateSkill,
  useGetMyProvider,
  useListProviderSkills,
  useListRequests,
  useListSkills,
  useSetProviderSkills,
  useUpdateCurrentUser,
  useUpdateProvider,
  type ProviderStatus,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { localizedSkillName } from "@/constants/serviceTranslations";
import { getServiceCategories, CATEGORY_SLUG } from "@/constants/serviceCatalog";

const Y = "#C8A574";

const STATUS_LABEL: Record<ProviderStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: Y },
  under_review: { label: "Under Review", color: "#60A5FA" },
  needs_info: { label: "Needs Info", color: Y },
  approved: { label: "Verified", color: "#4ADE80" },
  rejected: { label: "Rejected", color: "#F87171" },
};

async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 10000 },
      );
    });
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const loc = await Location.getCurrentPositionAsync({});
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

function Row({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value?: string }) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Feather name={icon} size={17} color={Y} /></View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
    </View>
  );
}

export default function ProviderProfile() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { user, name, phone, address, lat, lng, logout, refresh } = useAuth();
  const { t, isRTL, lang } = useLang();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const queryClient = useQueryClient();
  const align = isRTL ? "right" : "left";

  const providerQ = useGetMyProvider({ query: { queryKey: getGetMyProviderQueryKey() } });
  const provider = providerQ.data;

  const mySkillsQ = useListProviderSkills({ query: { queryKey: getListProviderSkillsQueryKey(), enabled: !!provider } });
  const mySkills = mySkillsQ.data ?? [];
  const mySkillSlugs = useMemo(() => mySkills.map((s) => s.skill?.slug).filter(Boolean) as string[], [mySkills]);

  const skillsQ = useListSkills({ type: "all" }, { query: { queryKey: getListSkillsQueryKey() } });
  const allSkills = skillsQ.data ?? [];
  // Approved custom services proposed by other providers — customers can request
  // these, so providers must be able to offer them too.
  const customSkillsQ = useListSkills({ status: "approved", type: "custom" });
  const customApproved = customSkillsQ.data ?? [];

  const updateUser = useUpdateCurrentUser();
  const updateProvider = useUpdateProvider();
  const setProviderSkills = useSetProviderSkills();
  const createSkill = useCreateSkill();
  const saving = updateUser.isPending || updateProvider.isPending || setProviderSkills.isPending;

  const jobsQ = useListRequests(
    { providerId: provider?.id },
    { query: { enabled: !!provider, queryKey: ["myJobs", provider?.id] } },
  );
  const completedCount = (jobsQ.data ?? []).filter((r) => r.status === "completed").length;

  const status = provider ? STATUS_LABEL[provider.status] : null;
  const rating = provider?.rating ?? 0;
  const ratingCount = provider?.ratingCount ?? 0;

  const hasLocation =
    (provider?.lat != null && provider?.lng != null) || (lat != null && lng != null);

  // The picker offers the EXACT services a customer can browse: the real display
  // categories (mapped to their catalog skill slug) plus approved custom services.
  const serviceOptions = useMemo(() => {
    const catOpts = getServiceCategories(t)
      .map((c) => ({
        key: `cat:${c.id}`,
        slug: CATEGORY_SLUG[c.id],
        label: c.name,
        icon: c.icon,
      }))
      .filter((o): o is { key: string; slug: string; label: string; icon: string } => !!o.slug);
    const customOpts = customApproved.map((s) => ({
      key: `custom:${s.id}`,
      slug: s.slug,
      label: localizedSkillName(s, lang),
      icon: (s.icon ?? "briefcase") as string,
    }));
    return [...catOpts, ...customOpts];
  }, [t, customApproved, lang]);

  /* ---- Edit form state ---- */
  const [editing, setEditing] = useState(false);
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fSelectedSkills, setFSelectedSkills] = useState<string[]>([]);
  const [fCustomSkill, setFCustomSkill] = useState("");
  const [fCustomSkillModal, setFCustomSkillModal] = useState(false);
  const [fAddress, setFAddress] = useState("");
  const [fCoords, setFCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [fBio, setFBio] = useState("");
  const [locating, setLocating] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const openEdit = () => {
    setFName(name || "");
    setFPhone(provider?.phone || phone || "");
    setFSelectedSkills([...mySkillSlugs]);
    setFBio(provider?.bio || "");
    setFAddress(address || "");
    if (provider?.lat != null && provider?.lng != null) {
      setFCoords({ lat: provider.lat, lng: provider.lng });
    } else if (lat != null && lng != null) {
      setFCoords({ lat, lng });
    } else {
      setFCoords(null);
    }
    setSaveErr(null);
    setEditing(true);
  };

  const toggleSkill = (slug: string) => {
    setFSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const addCustomSkill = async () => {
    const name = fCustomSkill.trim();
    if (!name) return;
    const slug = name.trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06FF\-]/g, "");
    if (!slug) {
      setSaveErr(t.providerOnboarding.errorCustomSkill);
      return;
    }
    setSaveErr(null);
    try {
      const created = await createSkill.mutateAsync({
        data: { name, slug, type: "custom" },
      });
      await skillsQ.refetch();
      setFSelectedSkills((prev) => [...prev, created.slug]);
      setFCustomSkill("");
      setFCustomSkillModal(false);
    } catch (err) {
      console.error("Custom skill creation error:", err);
      if (err instanceof ApiError && err.status === 409) {
        const existing = allSkills.find((s) => s.slug === slug);
        if (existing) {
          setFSelectedSkills((prev) => [...prev, existing.slug]);
          setFCustomSkill("");
          setFCustomSkillModal(false);
          return;
        }
      }
      setSaveErr(err instanceof ApiError ? err.message : t.providerOnboarding.errorCustomSkill);
    }
  };

  const captureLocation = async () => {
    setLocating(true);
    try {
      const c = await getCoords();
      if (c) setFCoords(c);
      else setSaveErr(t.providerProfile.errorLocation);
    } finally {
      setLocating(false);
    }
  };

  const onSave = async () => {
    if (!fName.trim()) {
      setSaveErr(t.providerProfile.errorName);
      return;
    }
    // Only keep selections that exist in the current customer-facing catalog so
    // editing a profile also drops stale legacy skills that no customer can request.
    const allowedSlugs = new Set(serviceOptions.map((o) => o.slug));
    const effectiveSlugs = fSelectedSkills.filter((s) => allowedSlugs.has(s));
    if (effectiveSlugs.length === 0) {
      setSaveErr(t.providerProfile.errorService);
      return;
    }
    if (!fPhone.trim()) {
      setSaveErr(t.providerProfile.errorPhone);
      return;
    }
    setSaveErr(null);
    try {
      await updateUser.mutateAsync({
        data: {
          name: fName.trim(),
          phone: fPhone.trim(),
          address: fAddress.trim() || null,
          lat: fCoords?.lat ?? null,
          lng: fCoords?.lng ?? null,
        },
      });
      if (provider) {
        const skillLookup = [...allSkills, ...customApproved];
        const primarySkill = skillLookup.find((s) => s.slug === effectiveSlugs[0]);
        const primaryService = primarySkill?.name ?? effectiveSlugs[0];
        await updateProvider.mutateAsync({
          id: provider.id,
          data: {
            serviceType: primaryService,
            phone: fPhone.trim(),
            bio: fBio.trim() || undefined,
            ...(fCoords ? { lat: fCoords.lat, lng: fCoords.lng } : {}),
          },
        });
        const skillIds = Array.from(
          new Set(
            skillLookup
              .filter((s) => effectiveSlugs.includes(s.slug))
              .map((s) => s.id),
          ),
        );
        if (skillIds.length === 0) {
          setSaveErr(t.providerProfile.errorService);
          return;
        }
        await setProviderSkills.mutateAsync({ data: { skillIds } });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListProviderSkillsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListSkillsQueryKey() }),
      ]);
      await refresh();
      setEditing(false);
    } catch {
      setSaveErr(t.providerProfile.errorSave);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm(t.providerProfile.logoutConfirm)) logout();
    } else {
      Alert.alert(t.providerProfile.logout, t.providerProfile.logoutConfirm, [
        { text: t.profile.cancel, style: "cancel" },
        { text: t.providerProfile.logout, style: "destructive", onPress: logout },
      ]);
    }
  };

  const skillsText = mySkills.length > 0
    ? mySkills.map((s) => s.skill?.name).filter(Boolean).join(" · ")
    : provider?.serviceType || "—";

  return (
    <ScrollView
      style={[styles.root, { paddingTop: topInset }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { textAlign: align }]}>{t.providerProfile.title}</Text>

      {/* Provider hero card */}
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name.slice(0, 2) : t.providerProfile.avatarFallback}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={[styles.heroName, { textAlign: align }]}>{name || t.providerProfile.provider}</Text>
          <Text style={[styles.heroPhone, { textAlign: align }]}>{provider?.serviceType || "—"}</Text>
          <View style={[styles.heroBadges, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.badge}>
              <Feather name="star" size={10} color={Y} />
              <Text style={styles.badgeText}>
                {ratingCount > 0 ? `${rating.toFixed(1)} (${ratingCount})` : t.providerProfile.noRating}
              </Text>
            </View>
            {status && (
              <View style={[styles.badge, { borderColor: status.color + "40", backgroundColor: status.color + "12" }]}>
                <Feather name="shield" size={10} color={status.color} />
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Feather name="check-circle" size={15} color={Y} />
          <Text style={styles.statNum}>{completedCount}</Text>
          <Text style={styles.statLabel}>{t.providerProfile.service}</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name="star" size={15} color={Y} />
          <Text style={styles.statNum}>{ratingCount > 0 ? rating.toFixed(1) : "—"}</Text>
          <Text style={styles.statLabel}>{t.providerProfile.avgRating}</Text>
        </View>
        <View style={styles.statBox}>
          <Feather name={provider?.isAvailable ? "wifi" : "wifi-off"} size={15} color={Y} />
          <Text style={styles.statNum}>{provider?.isAvailable ? t.providerProfile.statusOpen : t.providerProfile.statusClosed}</Text>
          <Text style={styles.statLabel}>{t.providerProfile.status}</Text>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <View style={[styles.sectionHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={[styles.sectionLabel, { textAlign: align }]}>{t.providerProfile.account}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.85}>
            <Feather name="edit-2" size={12} color={Y} />
            <Text style={styles.editBtnText}>{t.providerProfile.edit}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Row icon="user" label={t.providerProfile.name} value={name || "—"} />
          <View style={styles.sep} />
          <Row icon="briefcase" label={t.providerProfile.serviceLabel} value={skillsText} />
          <View style={styles.sep} />
          <Row icon="phone" label={t.providerProfile.phone} value={provider?.phone || phone || "—"} />
          <View style={styles.sep} />
          <Row icon="map-pin" label={t.providerProfile.address} value={address || "—"} />
          <View style={styles.sep} />
          <Row
            icon="navigation"
            label={t.providerProfile.location}
            value={hasLocation ? t.providerProfile.locationSet : t.providerProfile.locationNotSet}
          />
          {provider?.availableFrom || provider?.availableTo ? (
            <>
              <View style={styles.sep} />
              <Row
                icon="clock"
                label={t.providerProfile.workHours}
                value={`${provider?.availableFrom || "—"} - ${provider?.availableTo || "—"}`}
              />
            </>
          ) : null}
        </View>
      </View>

      {/* Commission terms */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textAlign: align }]}>{t.providerProfile.commissionSection}</Text>
        <View style={styles.card}>
          <Row icon="percent" label={t.providerProfile.commissionRate} value="10%" />
          <View style={styles.sep} />
          <Text style={[styles.bio, { textAlign: align }]}>{t.providerProfile.commissionDesc}</Text>
          <View style={styles.sep} />
          <Row
            icon="check-circle"
            label={t.providerProfile.commissionAgreedLabel}
            value={
              user?.commissionAgreedAt
                ? new Date(user.commissionAgreedAt).toLocaleDateString()
                : t.providerProfile.commissionNotRecorded
            }
          />
        </View>
      </View>

      {/* Bio */}
      {provider?.bio ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: align }]}>{t.providerProfile.bio}</Text>
          <View style={styles.card}>
            <Text style={[styles.bio, { textAlign: align }]}>{provider.bio}</Text>
          </View>
        </View>
      ) : null}

      {/* Logout */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={handleLogout}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#CC333312" }]}>
              <Feather name="log-out" size={17} color="#CC3333" />
            </View>
            <Text style={[styles.rowLabel, { color: "#CC3333" }]}>{t.providerProfile.logout}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.version}>{t.providerProfile.version}</Text>

      {/* Edit modal */}
      <Modal
        visible={editing}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditing(false)}
      >
        <View style={[styles.modalRoot, { paddingTop: topInset }]}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalClose}>
              <Feather name="x" size={22} color={C.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.providerProfile.editTitle}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerProfile.name}</Text>
            <TextInput
              style={[styles.input, { textAlign: align }]}
              value={fName}
              onChangeText={setFName}
              placeholder={t.providerProfile.fullName}
              placeholderTextColor={C.mutedForeground}
            />

            {/* Phone */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerProfile.phone}</Text>
            <TextInput
              style={[styles.input, { textAlign: align }]}
              value={fPhone}
              onChangeText={setFPhone}
              placeholder={t.providerProfile.phonePlaceholder}
              placeholderTextColor={C.mutedForeground}
              keyboardType="phone-pad"
            />

            {/* Skills picker */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerOnboarding.skillsLabel}</Text>
            {skillsQ.isLoading ? (
              <ActivityIndicator color={Y} style={{ marginVertical: 12 }} />
            ) : (
              <View style={[styles.serviceGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                {serviceOptions.map((o) => {
                  const selected = fSelectedSkills.includes(o.slug);
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.serviceItem, selected && styles.serviceItemOn]}
                      onPress={() => toggleSkill(o.slug)}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name={o.icon as keyof typeof Feather.glyphMap}
                        size={16}
                        color={selected ? Y : C.mutedForeground}
                      />
                      <Text style={[styles.serviceItemText, selected && { color: C.foreground }]}>{o.label}</Text>
                      {selected && <Feather name="check-circle" size={15} color={Y} />}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.serviceItem, { borderColor: Y + "50", backgroundColor: Y + "08" }]}
                  onPress={() => setFCustomSkillModal(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={16} color={Y} />
                  <Text style={[styles.serviceItemText, { color: Y }]}>{t.providerOnboarding.addCustomSkill}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bio */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerProfile.bio}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: align }]}
              value={fBio}
              onChangeText={setFBio}
              placeholder={t.providerOnboarding.bioPlaceholder}
              placeholderTextColor={C.mutedForeground}
              multiline
              textAlignVertical="top"
            />

            {/* Address */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerProfile.address}</Text>
            <TextInput
              style={[styles.input, { textAlign: align }]}
              value={fAddress}
              onChangeText={setFAddress}
              placeholder={t.providerProfile.addressPlaceholder}
              placeholderTextColor={C.mutedForeground}
            />

            {/* Location */}
            <Text style={[styles.fLabel, { textAlign: align }]}>{t.providerProfile.location}</Text>
            <TouchableOpacity style={styles.locBtn} onPress={captureLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={Y} />
              ) : (
                <Feather name={fCoords ? "check-circle" : "map-pin"} size={16} color={fCoords ? "#4ADE80" : Y} />
              )}
              <Text style={styles.locBtnText}>
                {fCoords ? t.providerProfile.locationDetected : t.providerProfile.detectLocation}
              </Text>
            </TouchableOpacity>

            {saveErr && <Text style={styles.error}>{saveErr}</Text>}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#000" />
                  <Text style={styles.saveBtnText}>{t.providerProfile.saveChanges}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom skill modal */}
      <Modal
        visible={fCustomSkillModal}
        transparent
        animationType="slide"
        onRequestClose={() => setFCustomSkillModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFCustomSkillModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }] as any}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalSheetTitle}>{t.providerOnboarding.customSkillTitle}</Text>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            value={fCustomSkill}
            onChangeText={setFCustomSkill}
            placeholder={t.providerOnboarding.customSkillPlaceholder}
            placeholderTextColor={C.mutedForeground}
          />
          {saveErr && fCustomSkillModal && (
            <Text style={[styles.error, { textAlign: align, marginBottom: 8 }]}>{saveErr}</Text>
          )}
          <TouchableOpacity
            style={[styles.submit, !fCustomSkill.trim() && styles.submitDisabled]}
            onPress={addCustomSkill}
            disabled={!fCustomSkill.trim() || createSkill.isPending}
            activeOpacity={0.85}
          >
            {createSkill.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Feather name="plus" size={15} color="#000" />
                <Text style={styles.submitText}>{t.providerOnboarding.addCustomSkill}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 30, fontWeight: "700", color: C.foreground, letterSpacing: -0.5, paddingVertical: 8 },

  hero: { backgroundColor: C.card, borderRadius: 20, padding: 20, flexDirection: "row", gap: 16, borderWidth: 1, borderColor: Y + "25", overflow: "hidden" },
  heroGlow: { position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: Y, opacity: 0.07 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: Y + "20", borderWidth: 2, borderColor: Y + "50", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: Y },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 18, fontWeight: "700", color: C.foreground },
  heroPhone: { fontSize: 13, color: C.mutedForeground },
  heroBadges: { flexDirection: "row-reverse", gap: 8, marginTop: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Y + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Y + "30" },
  badgeText: { fontSize: 10, color: Y, fontWeight: "600" },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", gap: 4 },
  statNum: { fontSize: 18, fontWeight: "700", color: C.foreground },
  statLabel: { fontSize: 9, color: C.mutedForeground, textAlign: "center" },

  section: { gap: 8 },
  sectionHead: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: C.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Y + "15", borderWidth: 1, borderColor: Y + "35", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText: { fontSize: 12, fontWeight: "700", color: Y },
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden" },

  bio: { fontSize: 14, color: C.foreground, lineHeight: 22, padding: 16 },

  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowPressed: { backgroundColor: "#ffffff08" },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Y + "12", alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, color: C.foreground },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 13, color: C.mutedForeground },
  sep: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  version: { textAlign: "center", fontSize: 11, color: C.mutedForeground + "50", letterSpacing: 0.5 },

  /* Modal */
  modalRoot: { flex: 1, backgroundColor: C.background },
  modalHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  modalClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.foreground },
  modalContent: { paddingHorizontal: 18, paddingTop: 12, gap: 12 },

  fLabel: { fontSize: 13, fontWeight: "600", color: C.foreground, marginTop: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.foreground },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  catRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  catChipText: { fontSize: 12, fontWeight: "600", color: C.mutedForeground },

  serviceGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  serviceItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  serviceItemOn: { borderColor: Y + "70", backgroundColor: Y + "10" },
  serviceItemText: { fontSize: 13, fontWeight: "600", color: C.mutedForeground },

  locBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingVertical: 13 },
  locBtnText: { fontSize: 13, fontWeight: "600", color: C.foreground },

  error: { fontSize: 13, color: "#F87171", textAlign: "center", marginTop: 4 },

  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Y, borderRadius: 15, paddingVertical: 15, marginTop: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },

  /* Custom skill modal */
  modalBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#00000080" },
  modalSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, borderWidth: 1, borderColor: C.border, borderBottomWidth: 0 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.mutedForeground + "40", alignSelf: "center" },
  modalSheetTitle: { fontSize: 16, fontWeight: "700", color: C.foreground, textAlign: "center", marginTop: 4 },
  submit: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Y, borderRadius: 15, paddingVertical: 14 },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontWeight: "700", color: "#000" },
});
