import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  getListRequestsQueryKey,
  updateCurrentUser,
  useCreateRequest,
  useListSkills,
  type Skill,
} from "@workspace/api-client-react";

import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { normalizeIlPhone } from "@/lib/phone";
import { localizedSkillName } from "@/constants/serviceTranslations";
import { uploadImageAsset } from "@/lib/upload";

const Y = "#C8A574";

type TimeKey = "asap" | "todayEve" | "tomMorning" | "tomEve";

const CAT_LABEL: Record<string, string> = {
  beauty: "beauty",
  home: "home",
  maintenance: "maintenance",
  other: "other",
};

const CAT_COLORS: Record<string, string> = {
  beauty: "#FF6B9D",
  home: "#2196F3",
  maintenance: "#FF9800",
  other: "#888888",
};

const CAT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  beauty: "heart",
  home: "home",
  maintenance: "tool",
  other: "briefcase",
};

function timeFromKey(key: TimeKey): Date {
  const d = new Date();
  switch (key) {
    case "asap": return d;
    case "todayEve": d.setHours(18, 0, 0, 0); return d;
    case "tomMorning": d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d;
    case "tomEve": d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); return d;
  }
}

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
  const pos = await Location.getCurrentPositionAsync({});
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export default function RequestScreen() {
  const { t, isRTL, lang } = useLang();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const queryClient = useQueryClient();
  const createRequest = useCreateRequest();
  const skillsQ = useListSkills({ type: "all" });
  const { address: savedAddress, lat: savedLat, lng: savedLng, phone: savedPhone, refresh } = useAuth();

  const allSkills = skillsQ.data ?? [];
  const categories = useMemo(() => {
    const cats = [...new Set(allSkills.map((s) => s.category || "other"))];
    return cats;
  }, [allSkills]);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selected, setSelected] = useState<Skill | null>(null);
  const [description, setDescription] = useState("");
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [locating, setLocating] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [payOnSite, setPayOnSite] = useState(false);
  const [timeKey, setTimeKey] = useState<TimeKey>("asap");
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!params.serviceId) return;
    const skill = allSkills.find((s) => String(s.id) === params.serviceId);
    if (skill) {
      setActiveCategory(skill.category || "other");
      setSelected(skill);
    }
  }, [params.serviceId, allSkills]);

  useEffect(() => {
    if (!savedAddress) return;
    setAddress((prev) => prev || savedAddress);
    if (savedLat != null && savedLng != null) {
      setCoords((prev) => prev ?? { lat: savedLat, lng: savedLng });
    }
  }, [savedAddress, savedLat, savedLng]);

  useEffect(() => {
    if (savedPhone) setPhone((prev) => prev || savedPhone);
  }, [savedPhone]);

  const filtered = useMemo(() => allSkills.filter((s) => (s.category || "other") === activeCategory), [allSkills, activeCategory]);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabBarH = Platform.OS === "web" ? 84 : 60 + insets.bottom;
  const align = isRTL ? "right" : "left";

  const timeOptions: { key: TimeKey; label: string }[] = [
    { key: "asap", label: t.req.timeAsap },
    { key: "todayEve", label: t.req.timeTodayEve },
    { key: "tomMorning", label: t.req.timeTomMorning },
    { key: "tomEve", label: t.req.timeTomEve },
  ];

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setAsset(res.assets[0]);
      Haptics.selectionAsync();
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const c = await getCoords();
      if (c) {
        setCoords(c);
        if (Platform.OS !== "web") {
          try {
            const [place] = await Location.reverseGeocodeAsync({ latitude: c.lat, longitude: c.lng });
            if (place) {
              const parts = [place.name, place.street, place.city].filter(Boolean);
              if (parts.length && !address) setAddress(parts.join("، "));
            }
          } catch { /* best effort */ }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally { setLocating(false); }
  };

  const notify = (title: string, message: string, onOk: () => void) => {
    if (Platform.OS === "web") { window.alert(`${title}\n${message}`); onOk(); }
    else { Alert.alert(title, message, [{ text: t.req.ok, onPress: onOk }], { userInterfaceStyle: "dark" }); }
  };

  const submit = async () => {
    if (!selected) { notify(t.req.newTitle, t.req.selectServiceFirst, () => {}); return; }
    if (!address.trim()) { notify(t.req.newTitle, t.req.locationRequired, () => {}); return; }
    const normalizedPhone = normalizeIlPhone(phone);
    if (!normalizedPhone) { notify(t.req.newTitle, t.req.phoneRequired, () => {}); return; }
    setSubmitting(true);
    try {
      if (normalizedPhone !== (savedPhone ?? "").trim()) {
        try {
          await updateCurrentUser({ phone: normalizedPhone });
          await refresh();
        } catch {
          setSubmitting(false);
          notify(t.req.newTitle, t.req.error, () => {});
          return;
        }
      }
      let imageUrl: string | undefined;
      if (asset) imageUrl = await uploadImageAsset(asset);
      const min = parseInt(priceMin, 10);
      const max = parseInt(priceMax, 10);
      const created = await createRequest.mutateAsync({
        data: {
          skillId: selected.id,
          description: description.trim() || undefined,
          imageUrl,
          lat: coords?.lat,
          lng: coords?.lng,
          address: address.trim() || undefined,
          priceMin: Number.isFinite(min) ? min : undefined,
          priceMax: Number.isFinite(max) ? max : undefined,
          paymentMethod: payOnSite ? "on_site" : undefined,
          preferredTime: timeFromKey(timeKey).toISOString(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
      setSelected(null);
      setDescription("");
      setAsset(null);
      setCoords(savedAddress && savedLat != null && savedLng != null ? { lat: savedLat, lng: savedLng } : null);
      setAddress(savedAddress || "");
      setPriceMin("");
      setPriceMax("");
      setPayOnSite(false);
      setTimeKey("asap");
      setModalVisible(false);
      notify(t.req.created, t.req.createdMsg, () => { router.push(`/request/${created.id}`); });
    } catch { notify(t.req.newTitle, t.req.error, () => {}); }
    finally { setSubmitting(false); }
  };

  const openModal = () => {
    if (!selected) { notify(t.req.newTitle, t.req.selectServiceFirst, () => {}); return; }
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={[styles.title, { textAlign: align }]}>{t.req.newTitle}</Text>
        <Text style={[styles.subtitle, { textAlign: align }]}>{t.req.newSub}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarH + 150 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { textAlign: align }]}>{t.req.chooseService}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { flexDirection: isRTL ? "row" : "row-reverse", paddingHorizontal: 16 }]}
          style={{ marginHorizontal: -16 }}
        >
          {categories.map((cat) => {
            const isActive = cat === activeCategory;
            const catColor = CAT_COLORS[cat] || C.primary;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }}
                style={[styles.chip, isActive && { borderColor: catColor, backgroundColor: catColor + "10" }]}
                activeOpacity={0.8}
              >
                <View style={[styles.chipIconWrap, isActive && { backgroundColor: catColor }]}>
                  <Feather name={(CAT_ICONS[cat] ?? "briefcase") as any} size={14} color={isActive ? "#000" : C.mutedForeground} />
                </View>
                <Text style={[styles.chipText, isActive && { color: catColor, fontWeight: "700" }]}>{CAT_LABEL[cat] ?? cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {skillsQ.isLoading && (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
        )}

        <View style={styles.serviceGrid}>
          {filtered.map((svc) => {
            const isSel = selected?.id === svc.id;
            return (
              <TouchableOpacity
                key={svc.id}
                style={[styles.serviceCard, isSel && styles.serviceCardActive]}
                onPress={() => { Haptics.selectionAsync(); setSelected(svc); }}
                activeOpacity={0.85}
              >
                <View style={[styles.serviceIcon, isSel && styles.serviceIconActive]}>
                  <Feather name={(svc.icon ?? "briefcase") as any} size={20} color={isSel ? "#000" : C.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.serviceName, isSel && { color: C.primary }]} numberOfLines={1}>{localizedSkillName(svc, lang)}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={1}>{svc.category || t.req.newSub}</Text>
                </View>
                {isSel ? (
                  <View style={styles.checkCircle}>
                    <Feather name="check" size={12} color="#000" />
                  </View>
                ) : (
                  <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={C.mutedForeground} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { bottom: tabBarH }]}>
        <TouchableOpacity 
          style={[styles.submitBtn, !selected && { opacity: 0.5, backgroundColor: C.muted }]} 
          onPress={openModal} 
          disabled={!selected} 
          activeOpacity={0.85}
        >
          <Text style={[styles.submitText, !selected && { color: C.mutedForeground }]}>{t.req.next}</Text>
          <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={18} color={selected ? "#000" : C.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Single modal with all fields */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: C.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
              <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.req.newTitle}</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selected service summary */}
            <View style={styles.svcSummary}>
              <View style={styles.svcSummaryIcon}>
                <Feather name={selected?.icon as any} size={24} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.svcSummaryName}>{selected ? localizedSkillName(selected, lang) : ""}</Text>
                <Text style={styles.svcSummaryCat}>{CAT_LABEL[activeCategory] || activeCategory}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.svcChangeBtn}>
                <Text style={styles.svcChangeText}>{t.req.changeService}</Text>
              </TouchableOpacity>
            </View>

            {/* Section: Location */}
            <View style={styles.formSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="map-pin" size={16} color={C.primary} />
                <Text style={[styles.sectionTitle, { textAlign: align }]}>{t.req.stepLocation}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.premiumInput, { textAlign: align }]}
                  placeholder={t.req.addressPlaceholder}
                  placeholderTextColor={C.mutedForeground}
                  value={address}
                  onChangeText={setAddress}
                />
                <TouchableOpacity 
                  style={[styles.inputAction, locating && { opacity: 0.7 }]} 
                  onPress={useMyLocation} 
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Feather name="crosshair" size={18} color={coords ? "#4ADE80" : C.primary} />
                  )}
                </TouchableOpacity>
              </View>
              {coords && (
                <View style={[styles.statusBadge, { alignSelf: isRTL ? "flex-end" : "flex-start" }]}>
                  <View style={[styles.statusDot, { backgroundColor: "#4ADE80" }]} />
                  <Text style={styles.statusText}>{t.req.located}</Text>
                </View>
              )}
            </View>

            {/* Section: Description */}
            <View style={styles.formSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="edit-3" size={16} color={C.primary} />
                <Text style={[styles.sectionTitle, { textAlign: align }]}>{t.req.stepDescription}</Text>
              </View>
              
              <TextInput
                style={[styles.premiumTextArea, { textAlign: align }]}
                placeholder={t.req.descPlaceholder}
                placeholderTextColor={C.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <View style={styles.photoSection}>
                {asset ? (
                  <View style={styles.premiumPhotoWrap}>
                    <Image source={{ uri: asset.uri }} style={styles.premiumPhoto} contentFit="cover" />
                    <TouchableOpacity style={styles.premiumPhotoRemove} onPress={() => setAsset(null)}>
                      <Feather name="x" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.premiumPhotoBtn} onPress={pickImage} activeOpacity={0.8}>
                    <View style={styles.photoBtnIcon}>
                      <Feather name="camera" size={20} color={C.primary} />
                    </View>
                    <Text style={styles.photoBtnLabel}>{t.req.addPhoto}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Section: Phone */}
            <View style={styles.formSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="phone" size={16} color={C.primary} />
                <Text style={[styles.sectionTitle, { textAlign: align }]}>{t.profile.phoneLabel}</Text>
              </View>

              <TextInput
                style={[styles.premiumTextArea, { textAlign: align, minHeight: 0, height: 52 }]}
                placeholder="05xxxxxxxx"
                placeholderTextColor={C.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Section: Time */}
            <View style={styles.formSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="clock" size={16} color={C.primary} />
                <Text style={[styles.sectionTitle, { textAlign: align }]}>{t.req.stepTime}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.dropdownTrigger} 
                onPress={() => setTimeDropdownOpen(!timeDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownValue}>
                  {timeOptions.find(o => o.key === timeKey)?.label}
                </Text>
                <Feather name={timeDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={C.primary} />
              </TouchableOpacity>

              {timeDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {timeOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.dropdownItem, timeKey === opt.key && styles.dropdownItemActive]}
                      onPress={() => {
                        setTimeKey(opt.key);
                        setTimeDropdownOpen(false);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.dropdownItemText, timeKey === opt.key && styles.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                      {timeKey === opt.key && <Feather name="check" size={16} color={C.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Section: Price */}
            <View style={styles.formSection}>
              <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Feather name="dollar-sign" size={16} color={C.primary} />
                <Text style={[styles.sectionTitle, { textAlign: align }]}>{t.req.stepPrice}</Text>
              </View>
              
              <View style={[styles.priceInputsRow, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <View style={styles.premiumPriceField}>
                  <Text style={styles.priceFieldLabel}>{t.req.priceMin}</Text>
                  <View style={styles.priceInputWrap}>
                    <TextInput 
                      style={styles.priceInputContent} 
                      placeholder="0" 
                      placeholderTextColor={C.mutedForeground} 
                      value={priceMin} 
                      onChangeText={setPriceMin} 
                      keyboardType="numeric" 
                    />
                    <Text style={styles.priceCurrencySmall}>{t.req.currency}</Text>
                  </View>
                </View>
                <View style={styles.premiumPriceField}>
                  <Text style={styles.priceFieldLabel}>{t.req.priceMax}</Text>
                  <View style={styles.priceInputWrap}>
                    <TextInput 
                      style={styles.priceInputContent} 
                      placeholder="0" 
                      placeholderTextColor={C.mutedForeground} 
                      value={priceMax} 
                      onChangeText={setPriceMax} 
                      keyboardType="numeric" 
                    />
                    <Text style={styles.priceCurrencySmall}>{t.req.currency}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.premiumPayToggle, payOnSite && styles.premiumPayToggleActive, { flexDirection: isRTL ? "row" : "row-reverse" }]}
                onPress={() => {
                  setPayOnSite((v) => !v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleCircle, payOnSite && { backgroundColor: "#000" }]}>
                  {payOnSite && <Feather name="check" size={12} color={C.primary} />}
                </View>
                <Text style={[styles.payToggleText, payOnSite && { color: "#000", fontWeight: "700" }]}>{t.req.payOnSite}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={submit} 
              disabled={submitting} 
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.submitText}>{t.req.confirm}</Text>
                  <Feather name="send" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontSize: 32, fontWeight: "800", color: C.foreground, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: C.mutedForeground, marginTop: 4 },

  content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: C.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },

  chips: { gap: 10, paddingVertical: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  chipIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.muted, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 14, fontWeight: "600", color: C.mutedForeground },

  serviceGrid: { gap: 12 },
  serviceCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  serviceCardActive: { borderColor: C.primary, backgroundColor: C.primary + "05" },
  serviceIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  serviceIconActive: { backgroundColor: C.primary },
  serviceName: { fontSize: 16, fontWeight: "700", color: C.foreground },
  serviceDesc: { fontSize: 13, color: C.mutedForeground },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border, padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20 },
  submitBtn: { height: 58, backgroundColor: C.primary, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitText: { fontSize: 18, fontWeight: "800", color: "#000" },

  // Modal
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.foreground },

  modalContent: { paddingHorizontal: 20, paddingTop: 24 },
  
  svcSummary: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: C.card, borderRadius: 22, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: C.border },
  svcSummaryIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  svcSummaryName: { fontSize: 18, fontWeight: "800", color: C.foreground },
  svcSummaryCat: { fontSize: 13, color: C.primary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  svcChangeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.muted },
  svcChangeText: { fontSize: 12, fontWeight: "700", color: C.foreground },

  formSection: { marginBottom: 32 },
  sectionHeader: { alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.foreground, textTransform: "uppercase", letterSpacing: 1 },

  inputContainer: { position: "relative", justifyContent: "center" },
  premiumInput: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: C.foreground, paddingRight: 50 },
  inputAction: { position: "absolute", right: 12, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "#4ADE8015", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "700", color: "#4ADE80" },

  premiumTextArea: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, padding: 18, fontSize: 16, color: C.foreground, minHeight: 120, textAlignVertical: "top" },
  
  photoSection: { marginTop: 16 },
  premiumPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.primary + "40", borderStyle: "dashed", padding: 16 },
  photoBtnIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  photoBtnLabel: { fontSize: 15, fontWeight: "700", color: C.primary },
  
  premiumPhotoWrap: { borderRadius: 20, overflow: "hidden", position: "relative", marginTop: 8 },
  premiumPhoto: { width: "100%", height: 220, backgroundColor: C.card },
  premiumPhotoRemove: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },

  dropdownTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 18, paddingVertical: 16 },
  dropdownValue: { fontSize: 16, fontWeight: "600", color: C.foreground },
  dropdownMenu: { marginTop: 8, backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  dropdownItemActive: { backgroundColor: C.primary + "10" },
  dropdownItemText: { fontSize: 15, color: C.mutedForeground, fontWeight: "600" },
  dropdownItemTextActive: { color: C.primary, fontWeight: "700" },

  priceInputsRow: { gap: 12 },
  premiumPriceField: { flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, padding: 14 },
  priceFieldLabel: { fontSize: 12, fontWeight: "700", color: C.mutedForeground, textTransform: "uppercase", marginBottom: 6 },
  priceInputWrap: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  priceInputContent: { fontSize: 20, fontWeight: "800", color: C.foreground, padding: 0, flex: 1 },
  priceCurrencySmall: { fontSize: 13, fontWeight: "700", color: C.mutedForeground },

  premiumPayToggle: { alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, padding: 16, marginTop: 16 },
  premiumPayToggleActive: { backgroundColor: C.primary, borderColor: C.primary },
  toggleCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  payToggleText: { fontSize: 15, fontWeight: "700", color: C.foreground },

  modalFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border, padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20 },
});
