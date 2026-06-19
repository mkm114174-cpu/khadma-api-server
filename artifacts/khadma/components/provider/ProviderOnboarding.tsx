import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/expo";

import {
  ApiError,
  getGetMyProviderQueryKey,
  provisionUser,
  useCreateProvider,
  useUpdateProvider,
  useListSkills,
  useCreateSkill,
  useSetProviderSkills,
  getListProviderSkillsQueryKey,
  type Provider,
  type Skill,
} from "@workspace/api-client-react";

import { CITIES, localizeCity } from "@/constants/cities";
import { localizedSkillName } from "@/constants/serviceTranslations";
import { getServiceCategories, CATEGORY_SLUG } from "@/constants/serviceCatalog";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { uploadAsset, uploadImageAsset } from "@/lib/upload";

const Y = "#C8A574";

type DocState = { path: string | null; name: string | null; uploading: boolean };
const emptyDoc: DocState = { path: null, name: null, uploading: false };

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

export default function ProviderOnboarding({
  resubmit = false,
  provider,
  onDone,
}: {
  resubmit?: boolean;
  provider?: Provider;
  onDone?: () => void;
} = {}) {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { name, phone: authPhone, logout, status, refresh } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { user: clerkUser } = useUser();
  const topInset = Platform.OS === "web" ? 40 : insets.top;
  const align = isRTL ? "right" : "left";

  // Provider provisioning is merged into this single screen: when the account
  // has not been provisioned yet, collect the name + agreements here and create
  // the local user record before creating the provider profile.
  const needsProvision = !resubmit && status === "needsProvision";
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? undefined;

  const [regName, setRegName] = useState("");
  const [commissionAgreed, setCommissionAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Prefill the name from the Clerk identity once it is available.
  useEffect(() => {
    if (!needsProvision) return;
    const fromClerk = clerkUser?.fullName ?? clerkUser?.firstName ?? "";
    if (fromClerk) setRegName((prev) => (prev ? prev : fromClerk));
  }, [needsProvision, clerkUser?.fullName, clerkUser?.firstName]);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  // Custom skills proposed in this session. They start as pending, so they are
  // not returned by the approved-only skills query and must be tracked locally
  // to keep them selectable and linked to this provider on submit.
  const [extraSkills, setExtraSkills] = useState<Skill[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [customSkillModal, setCustomSkillModal] = useState(false);
  const [phone, setPhone] = useState(provider?.phone || authPhone || "");
  const [address, setAddress] = useState(provider?.addressText || "");
  const [experience, setExperience] = useState(
    provider?.experienceYears != null ? String(provider.experienceYears) : "",
  );
  const [bio, setBio] = useState(provider?.bio || "");
  const [city, setCity] = useState<string | null>(provider?.city ?? null);
  const [cityModal, setCityModal] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [skillsModal, setSkillsModal] = useState(false);
  const [skillsSearch, setSkillsSearch] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [osekPatur, setOsekPatur] = useState<DocState>(emptyDoc);
  const [osekMurshe, setOsekMurshe] = useState<DocState>(emptyDoc);
  const [idDoc, setIdDoc] = useState<DocState>(emptyDoc);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameHe.toLowerCase().includes(q),
    );
  }, [citySearch]);

  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const skillsQ = useListSkills({ type: "all" });
  // Approved custom services proposed by other providers — customers can request
  // these, so providers must be able to offer them too.
  const customSkillsQ = useListSkills({ status: "approved", type: "custom" });
  const createSkill = useCreateSkill();
  const setProviderSkills = useSetProviderSkills();
  const allSkills = skillsQ.data ?? [];
  const customApproved = customSkillsQ.data ?? [];

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
    const seen = new Set<number>();
    const customOpts = [...customApproved, ...extraSkills]
      .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
      .map((s) => ({
        key: `custom:${s.id}`,
        slug: s.slug,
        label: localizedSkillName(s, lang),
        icon: (s.icon ?? "briefcase") as string,
      }));
    return [...catOpts, ...customOpts];
  }, [t, customApproved, extraSkills, lang]);

  const filteredOptions = useMemo(() => {
    const q = skillsSearch.trim().toLowerCase();
    if (!q) return serviceOptions;
    return serviceOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [serviceOptions, skillsSearch]);

  const anyUploading = osekPatur.uploading || osekMurshe.uploading || idDoc.uploading;
  const pending = createProvider.isPending || updateProvider.isPending || setProviderSkills.isPending;

  // In resubmit mode the document may already be on file (kept until a final
  // decision), so a re-upload is optional. In create mode the required docs
  // must be freshly attached.
  const hasOsekPatur = !!osekPatur.path || (resubmit && !!provider?.docOsekPaturPath);
  const hasIdDoc = !!idDoc.path || (resubmit && !!provider?.docIdPath);

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const addCustomSkill = async () => {
    const skillName = customSkill.trim();
    if (!skillName) return;
    const slug = skillName.trim().replace(/\s+/g, "-").replace(/[^a-z0-9\u0600-\u06FF\-]/g, "");
    if (!slug) {
      setError(t.providerOnboarding.errorCustomSkill);
      return;
    }
    setError(null);
    try {
      const created = await createSkill.mutateAsync({
        data: { name: skillName, slug, type: "custom" },
      });
      setExtraSkills((prev) =>
        prev.some((s) => s.id === created.id) ? prev : [...prev, created],
      );
      setSelectedSkills((prev) => [...prev, created.slug]);
      setCustomSkill("");
      setCustomSkillModal(false);
    } catch (err) {
      console.error("Custom skill creation error:", err);
      if (err instanceof ApiError && err.status === 409) {
        const existing = allSkills.find((s) => s.slug === slug);
        if (existing) {
          setSelectedSkills((prev) => [...prev, existing.slug]);
          setCustomSkill("");
          setCustomSkillModal(false);
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : t.providerOnboarding.errorCustomSkill);
    }
  };

  const captureLocation = async () => {
    setLocating(true);
    try {
      const c = await getCoords();
      if (c) setCoords(c);
      else setError(t.providerOnboarding.errorLocation);
    } finally {
      setLocating(false);
    }
  };

  const pickTaxDoc = async (setDoc: React.Dispatch<React.SetStateAction<DocState>>) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file) return;
      setError(null);
      setDoc({ path: null, name: file.name, uploading: true });
      const path = await uploadAsset({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      });
      setDoc({ path, name: file.name, uploading: false });
    } catch {
      setDoc(emptyDoc);
      setError(t.providerOnboarding.docUploadError);
    }
  };

  const pickIdPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      setError(null);
      setIdDoc({ path: null, name: asset.fileName ?? "ID", uploading: true });
      const path = await uploadImageAsset(asset);
      setIdDoc({ path, name: asset.fileName ?? "ID", uploading: false });
    } catch {
      setIdDoc(emptyDoc);
      setError(t.providerOnboarding.docUploadError);
    }
  };

  const agreementsOk =
    resubmit || (commissionAgreed && privacyAgreed && pledgeAgreed);

  const canSubmit =
    !pending &&
    !anyUploading &&
    !!city &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    hasOsekPatur &&
    hasIdDoc &&
    agreementsOk &&
    (!needsProvision || regName.trim().length >= 2) &&
    (resubmit || selectedSkills.length > 0);

  const submit = async () => {
    if (!resubmit && selectedSkills.length === 0) {
      setError(t.providerOnboarding.errorService);
      return;
    }
    if (needsProvision && regName.trim().length < 2) {
      setError(t.auth.nameError);
      return;
    }
    if (!city) {
      setError(t.providerOnboarding.errorCity);
      return;
    }
    if (!phone.trim()) {
      setError(t.providerOnboarding.errorPhone);
      return;
    }
    if (!address.trim()) {
      setError(t.providerOnboarding.errorAddress);
      return;
    }
    if (!hasOsekPatur || !hasIdDoc) {
      setError(t.providerOnboarding.errorDocs);
      return;
    }
    if (!resubmit && !(commissionAgreed && privacyAgreed && pledgeAgreed)) {
      setError(t.auth.agreementsError);
      return;
    }
    setError(null);

    const expNum = parseInt(experience.trim(), 10);

    try {
      if (resubmit && provider) {
        await updateProvider.mutateAsync({
          id: provider.id,
          data: {
            phone: phone.trim(),
            city,
            addressText: address.trim(),
            bio: bio.trim() || undefined,
            experienceYears: Number.isFinite(expNum) ? expNum : undefined,
            ...(osekPatur.path ? { docOsekPaturPath: osekPatur.path } : {}),
            ...(osekMurshe.path ? { docOsekMurshePath: osekMurshe.path } : {}),
            ...(idDoc.path ? { docIdPath: idDoc.path } : {}),
            ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
          },
        });
        await queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() });
        onDone?.();
        return;
      }

      // Merged flow: provision the local user record first (idempotent on the
      // server) so the provider profile can be attached to it.
      if (needsProvision) {
        await provisionUser({
          name: regName.trim(),
          role: "provider",
          email: clerkEmail,
          commissionAgreed: true,
          language: lang,
        });
      }

      const primaryService =
        allSkills.find((s) => s.slug === selectedSkills[0])?.name ?? selectedSkills[0];
      await createProvider.mutateAsync({
        data: {
          serviceType: primaryService,
          city,
          phone: phone.trim(),
          addressText: address.trim(),
          docOsekPaturPath: osekPatur.path!,
          docOsekMurshePath: osekMurshe.path ?? undefined,
          docIdPath: idDoc.path!,
          bio: bio.trim() || undefined,
          experienceYears: Number.isFinite(expNum) ? expNum : undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
      });
      const skillLookup = [...allSkills, ...extraSkills, ...customApproved];
      const skillIds = Array.from(
        new Set(
          skillLookup
            .filter((s) => selectedSkills.includes(s.slug))
            .map((s) => s.id),
        ),
      );
      if (skillIds.length > 0) {
        await setProviderSkills.mutateAsync({ data: { skillIds } });
      }
      await AsyncStorage.removeItem("khadma:intendedRole");
      await queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListProviderSkillsQueryKey() });
      // Refresh the auth profile so the status machine moves off needsProvision.
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        await queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() });
        await refresh();
        return;
      }
      setError(t.providerOnboarding.errorSubmit);
    }
  };

  const renderDoc = (
    label: string,
    doc: DocState,
    onPick: () => void,
    opts: { required: boolean; onFile?: boolean },
  ) => {
    const attached = !!doc.path || !!opts.onFile;
    return (
      <View style={styles.docCard}>
        <View style={[styles.docRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather
            name={attached ? "check-circle" : "file-text"}
            size={18}
            color={attached ? "#4ADE80" : C.mutedForeground}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.docLabel, { textAlign: align }]}>{label}</Text>
            <Text style={[styles.docSub, { textAlign: align }]}>
              {doc.uploading
                ? t.providerOnboarding.docUploading
                : doc.path
                  ? doc.name || t.providerOnboarding.docOnFile
                  : opts.onFile
                    ? t.providerOnboarding.docSaved
                    : opts.required
                      ? t.providerOnboarding.docRequired
                      : t.providerOnboarding.docOptional}
            </Text>
          </View>
          <TouchableOpacity style={styles.docBtn} onPress={onPick} disabled={doc.uploading}>
            {doc.uploading ? (
              <ActivityIndicator size="small" color={Y} />
            ) : (
              <Text style={styles.docBtnText}>
                {attached ? t.providerOnboarding.docReplace : t.providerOnboarding.docPick}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Feather name="briefcase" size={22} color={Y} />
        </View>
        <Text style={styles.title}>
          {resubmit ? t.providerOnboarding.resubmitTitle : t.providerOnboarding.title}
        </Text>
        <Text style={styles.subtitle}>
          {resubmit
            ? t.providerOnboarding.resubmitSubtitle
            : `${name ? `${name}، ` : ""}${t.providerOnboarding.subtitle}`}
        </Text>
      </View>

      {resubmit && provider?.reviewNote ? (
        <View style={styles.noteCard}>
          <View style={[styles.noteHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Feather name="message-circle" size={15} color={Y} />
            <Text style={styles.noteTitle}>{t.providerOnboarding.reviewNoteTitle}</Text>
          </View>
          <Text style={[styles.noteBody, { textAlign: align }]}>{provider.reviewNote}</Text>
        </View>
      ) : null}

      {/* Name (registration, when the account is not yet provisioned) */}
      {needsProvision && (
        <>
          <Text style={[styles.label, { textAlign: align }]}>{t.auth.fullName}</Text>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            value={regName}
            onChangeText={setRegName}
            placeholder={t.auth.namePlaceholder}
            placeholderTextColor={C.mutedForeground}
          />
        </>
      )}

      {/* Skills picker (registration only) */}
      {!resubmit && (
        <>
          <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.skillsLabel}</Text>
          {skillsQ.isLoading ? (
            <ActivityIndicator color={Y} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.cityField, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => setSkillsModal(true)}
                activeOpacity={0.85}
              >
                <Feather name="chevron-down" size={16} color={C.mutedForeground} />
                <Text
                  style={[
                    styles.cityFieldText,
                    selectedSkills.length > 0 ? { color: C.foreground } : null,
                    { textAlign: align },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSkills.length === 0
                    ? t.providerOnboarding.skillsPlaceholder
                    : `${selectedSkills.length} ${t.providerOnboarding.skillsSelectedSuffix}`}
                </Text>
                <Feather name="briefcase" size={16} color={selectedSkills.length > 0 ? "#4ADE80" : Y} />
              </TouchableOpacity>
              {selectedSkills.length > 0 && (
                <View style={[styles.chipsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  {selectedSkills.map((slug) => {
                    const sk = [...allSkills, ...extraSkills, ...customApproved].find((s) => s.slug === slug);
                    const label = sk ? localizedSkillName(sk, lang) : slug;
                    return (
                      <TouchableOpacity
                        key={slug}
                        style={[styles.chip, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                        onPress={() => toggleSkill(slug)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.chipText}>{label}</Text>
                        <Feather name="x" size={13} color={Y} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </>
      )}

      {/* Custom skill modal */}
      <Modal
        visible={customSkillModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomSkillModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCustomSkillModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }] as any}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t.providerOnboarding.customSkillTitle}</Text>
          <TextInput
            style={[styles.input, { textAlign: align }]}
            value={customSkill}
            onChangeText={setCustomSkill}
            placeholder={t.providerOnboarding.customSkillPlaceholder}
            placeholderTextColor={C.mutedForeground}
          />
          {error && customSkillModal && (
            <Text style={[styles.error, { textAlign: align, marginBottom: 8 }]}>{error}</Text>
          )}
          <TouchableOpacity
            style={[styles.submit, !customSkill.trim() && styles.submitDisabled]}
            onPress={addCustomSkill}
            disabled={!customSkill.trim() || createSkill.isPending}
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

      {/* Skills picker modal */}
      <Modal
        visible={skillsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSkillsModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSkillsModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t.providerOnboarding.skillsModalTitle}</Text>
          <View style={[styles.modalSearch, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Feather name="search" size={16} color={C.mutedForeground} />
            <TextInput
              style={[styles.modalSearchInput, { textAlign: align }]}
              value={skillsSearch}
              onChangeText={setSkillsSearch}
              placeholder={t.providerOnboarding.skillsModalSearch}
              placeholderTextColor={C.mutedForeground}
            />
          </View>
          <ScrollView
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((o) => {
              const selected = selectedSkills.includes(o.slug);
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.cityRow, selected && styles.cityRowOn, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  onPress={() => toggleSkill(o.slug)}
                  activeOpacity={0.8}
                >
                  {selected ? (
                    <Feather name="check" size={16} color={Y} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                  <Feather
                    name={o.icon as keyof typeof Feather.glyphMap}
                    size={15}
                    color={selected ? Y : C.mutedForeground}
                  />
                  <Text style={[styles.cityRowText, selected && { color: C.foreground }, { textAlign: align }]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {filteredOptions.length === 0 && (
              <Text style={styles.cityEmpty}>{t.providerOnboarding.skillsModalEmpty}</Text>
            )}
            <TouchableOpacity
              style={[
                styles.cityRow,
                { borderColor: Y + "50", backgroundColor: Y + "08", flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
              onPress={() => {
                setSkillsModal(false);
                setCustomSkillModal(true);
              }}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color={Y} />
              <Text style={[styles.cityRowText, { color: Y }, { textAlign: align }]}>
                {t.providerOnboarding.addCustomSkill}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.submit} onPress={() => setSkillsModal(false)} activeOpacity={0.85}>
            <Text style={styles.submitText}>{t.providerOnboarding.skillsModalDone}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* City */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.cityLabel}</Text>
      <TouchableOpacity
        style={[styles.cityField, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        onPress={() => setCityModal(true)}
        activeOpacity={0.85}
      >
        <Feather name="chevron-down" size={16} color={C.mutedForeground} />
        <Text style={[styles.cityFieldText, city ? { color: C.foreground } : null, { textAlign: align }]}>
          {city ? localizeCity(city, lang) : t.providerOnboarding.cityPlaceholder}
        </Text>
        <Feather name="map-pin" size={16} color={city ? "#4ADE80" : Y} />
      </TouchableOpacity>

      {/* Phone */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.phoneLabel}</Text>
      <TextInput
        style={[styles.input, { textAlign: align }]}
        value={phone}
        onChangeText={setPhone}
        placeholder={t.providerOnboarding.phonePlaceholder}
        placeholderTextColor={C.mutedForeground}
        keyboardType="phone-pad"
      />

      {/* Residential address */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.addressLabel}</Text>
      <TextInput
        style={[styles.input, { textAlign: align }]}
        value={address}
        onChangeText={setAddress}
        placeholder={t.providerOnboarding.addressPlaceholder}
        placeholderTextColor={C.mutedForeground}
      />

      {/* Documents */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.docsLabel}</Text>
      <Text style={[styles.docsHint, { textAlign: align }]}>{t.providerOnboarding.docsHint}</Text>
      {renderDoc(t.providerOnboarding.docOsekPaturLabel, osekPatur, () => pickTaxDoc(setOsekPatur), {
        required: true,
        onFile: resubmit && !!provider?.docOsekPaturPath,
      })}
      {renderDoc(t.providerOnboarding.docOsekMursheLabel, osekMurshe, () => pickTaxDoc(setOsekMurshe), {
        required: false,
        onFile: resubmit && !!provider?.docOsekMurshePath,
      })}
      {renderDoc(t.providerOnboarding.docIdLabel, idDoc, pickIdPhoto, {
        required: true,
        onFile: resubmit && !!provider?.docIdPath,
      })}

      {/* Experience */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.experienceLabel}</Text>
      <TextInput
        style={[styles.input, { textAlign: align }]}
        value={experience}
        onChangeText={(v) => setExperience(v.replace(/[^0-9]/g, ""))}
        placeholder={t.providerOnboarding.experiencePlaceholder}
        placeholderTextColor={C.mutedForeground}
        keyboardType="number-pad"
      />

      {/* Bio */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.bioLabel}</Text>
      <TextInput
        style={[styles.input, styles.textArea, { textAlign: align }]}
        value={bio}
        onChangeText={setBio}
        placeholder={t.providerOnboarding.bioPlaceholder}
        placeholderTextColor={C.mutedForeground}
        multiline
        textAlignVertical="top"
      />

      {/* Location */}
      <Text style={[styles.label, { textAlign: align }]}>{t.providerOnboarding.locationLabel}</Text>
      <TouchableOpacity style={styles.locBtn} onPress={captureLocation} disabled={locating}>
        {locating ? (
          <ActivityIndicator size="small" color={Y} />
        ) : (
          <Feather name={coords ? "check-circle" : "map-pin"} size={16} color={coords ? "#4ADE80" : Y} />
        )}
        <Text style={styles.locBtnText}>
          {coords ? t.providerOnboarding.locationDone : t.providerOnboarding.locationBtn}
        </Text>
      </TouchableOpacity>

      {/* Agreements (registration only) — required right above submit */}
      {!resubmit && (
        <View style={styles.agreements}>
          <TouchableOpacity
            style={[styles.agreeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => setCommissionAgreed((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, commissionAgreed && styles.checkboxOn]}>
              {commissionAgreed && <Feather name="check" size={13} color="#000" />}
            </View>
            <Text style={[styles.agreeText, { textAlign: align }]}>{t.auth.commissionAgree}</Text>
          </TouchableOpacity>

          <View style={[styles.agreeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity
              style={[styles.checkbox, privacyAgreed && styles.checkboxOn]}
              onPress={() => setPrivacyAgreed((v) => !v)}
              activeOpacity={0.8}
            >
              {privacyAgreed && <Feather name="check" size={13} color="#000" />}
            </TouchableOpacity>
            <Text style={[styles.agreeText, { textAlign: align }]}>
              {t.auth.privacyAgree}{" "}
              <Text style={styles.readLink} onPress={() => setPrivacyOpen(true)}>
                ({t.auth.privacyRead})
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.agreeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => setPledgeAgreed((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, pledgeAgreed && styles.checkboxOn]}>
              {pledgeAgreed && <Feather name="check" size={13} color="#000" />}
            </View>
            <Text style={[styles.agreeText, { textAlign: align }]}>{t.auth.pledgeAgree}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy policy modal */}
      <Modal
        visible={privacyOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPrivacyOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t.auth.privacyTitle}</Text>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.noteBody, { textAlign: align, paddingVertical: 8 }]}>
              {t.auth.privacyBody}
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.submit} onPress={() => setPrivacyOpen(false)} activeOpacity={0.85}>
            <Text style={styles.submitText}>{t.auth.privacyClose}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.submit, !canSubmit && styles.submitDisabled]}
        onPress={submit}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        {pending ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Feather name="send" size={15} color="#000" />
            <Text style={styles.submitText}>
              {resubmit ? t.providerOnboarding.resubmit : t.providerOnboarding.submit}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>{t.providerOnboarding.logout}</Text>
      </TouchableOpacity>

      {/* City picker modal */}
      <Modal
        visible={cityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCityModal(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t.providerOnboarding.cityModalTitle}</Text>
          <View style={[styles.modalSearch, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Feather name="search" size={16} color={C.mutedForeground} />
            <TextInput
              style={[styles.modalSearchInput, { textAlign: align }]}
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder={t.providerOnboarding.cityModalSearch}
              placeholderTextColor={C.mutedForeground}
            />
          </View>
          <ScrollView
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredCities.map((c) => {
              const selected = city === c.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.cityRow, selected && styles.cityRowOn, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                  onPress={() => {
                    setCity(c.name);
                    setCityModal(false);
                    setCitySearch("");
                  }}
                  activeOpacity={0.8}
                >
                  {selected ? (
                    <Feather name="check" size={16} color={Y} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                  <Text style={[styles.cityRowText, selected && { color: C.foreground }, { textAlign: align }]}>
                    {localizeCity(c.name, lang)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {filteredCities.length === 0 && (
              <Text style={styles.cityEmpty}>{t.providerOnboarding.cityModalEmpty}</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 18, gap: 12 },

  header: { alignItems: "center", gap: 8, marginBottom: 8 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Y + "15", borderWidth: 1, borderColor: Y + "35",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700", color: C.foreground, textAlign: "center" },
  subtitle: { fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingHorizontal: 10 },

  label: { fontSize: 13, fontWeight: "600", color: C.foreground, textAlign: "right", marginTop: 6 },

  noteCard: {
    backgroundColor: Y + "10", borderWidth: 1, borderColor: Y + "35",
    borderRadius: 14, padding: 14, gap: 6,
  },
  noteHead: { alignItems: "center", gap: 8 },
  noteTitle: { fontSize: 13, fontWeight: "700", color: Y },
  noteBody: { fontSize: 13, color: C.foreground, lineHeight: 20 },

  catRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  catChipText: { fontSize: 12, fontWeight: "600", color: C.mutedForeground },

  chipsRow: { flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Y + "12", borderWidth: 1, borderColor: Y + "55",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: C.foreground },

  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.foreground,
  },
  textArea: { minHeight: 84 },

  docsHint: { fontSize: 12, color: C.mutedForeground, marginTop: -4 },
  docCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  docRow: { alignItems: "center", gap: 12 },
  docLabel: { fontSize: 13, fontWeight: "600", color: C.foreground },
  docSub: { fontSize: 12, color: C.mutedForeground, marginTop: 2 },
  docBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Y + "15", borderWidth: 1, borderColor: Y + "40",
  },
  docBtnText: { fontSize: 12, fontWeight: "700", color: Y },

  locBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13,
    paddingVertical: 13,
  },
  locBtnText: { fontSize: 13, fontWeight: "600", color: C.foreground },

  cityField: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  cityFieldText: { flex: 1, fontSize: 14, color: C.mutedForeground, textAlign: "right", marginHorizontal: 10 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    maxHeight: "75%",
    backgroundColor: C.background,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, borderColor: "rgba(245,197,24,0.25)",
    paddingHorizontal: 18, paddingTop: 10, gap: 12,
  },
  modalHandle: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, marginBottom: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: C.foreground, textAlign: "center" },
  modalSearch: {
    flexDirection: "row-reverse", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: C.foreground },
  modalList: { marginTop: 2 },
  cityRow: {
    flexDirection: "row-reverse", alignItems: "center", gap: 10,
    paddingVertical: 14, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cityRowOn: { backgroundColor: Y + "10" },
  cityRowText: { flex: 1, fontSize: 15, color: C.mutedForeground, textAlign: "right", fontWeight: "600" },
  cityEmpty: { fontSize: 13, color: C.mutedForeground, textAlign: "center", paddingVertical: 24 },

  agreements: { gap: 12, marginTop: 6 },
  agreeRow: { alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, marginTop: 1,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Y, borderColor: Y },
  agreeText: { flex: 1, fontSize: 13, color: C.foreground, lineHeight: 20 },
  readLink: { color: Y, fontWeight: "700", textDecorationLine: "underline" },

  error: { fontSize: 13, color: "#F87171", textAlign: "center", marginTop: 4 },

  submit: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Y, borderRadius: 15, paddingVertical: 15, marginTop: 10,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 15, fontWeight: "700", color: "#000" },

  logout: { alignItems: "center", paddingVertical: 14 },
  logoutText: { fontSize: 13, color: C.mutedForeground, fontWeight: "600" },
});
