import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { updateCurrentUser, useCreateRequest, useListSkills } from "@workspace/api-client-react";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { uploadAsset } from "@/lib/upload";
import { normalizeIlPhone } from "@/lib/phone";
import { CATEGORY_SLUG, CATEGORY_SECTION } from "@/constants/serviceCatalog";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");
const GOLD = "#C8A574";
const DARK_BG = "#1A1A2E";

type PickedAsset = { uri: string; mimeType?: string | null; fileName?: string | null };

const TIME_OPTIONS = [
  { id: "asap", labelKey: "timeAsap" },
  { id: "todayEvening", labelKey: "timeTodayEve" },
  { id: "tomorrowMorning", labelKey: "timeTomMorning" },
  { id: "tomorrowEvening", labelKey: "timeTomEve" },
];

// The preferred-time presets are semantic choices; the API stores an actual
// timestamp, so map each preset id to a concrete Date before sending.
function timeFromPreset(id: string): Date {
  const d = new Date();
  switch (id) {
    case "todayEvening":
      d.setHours(18, 0, 0, 0);
      return d;
    case "tomorrowMorning":
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    case "tomorrowEvening":
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      return d;
    case "asap":
    default:
      return d;
  }
}

type CatIcon = { name: string; type: "feather" | "material" | "fontawesome" };

const CATEGORY_ICONS: Record<string, CatIcon> = {
  painting: { name: "paint-brush", type: "fontawesome" },
  plumbing: { name: "droplet", type: "feather" },
  electricity: { name: "zap", type: "feather" },
  cleaning: { name: "scissors", type: "feather" },
  furniture: { name: "box", type: "feather" },
  cars: { name: "truck", type: "feather" },
  ac: { name: "wind", type: "feather" },
  carpentry: { name: "tool", type: "feather" },
  maintenance: { name: "home", type: "feather" },
  appliances: { name: "hard-drive", type: "feather" },
  pest_control: { name: "shield", type: "feather" },
  landscaping: { name: "sun", type: "feather" },
  moving: { name: "move", type: "feather" },
  other: { name: "more-horizontal", type: "feather" },
};

const CATEGORY_NAME_KEY: Record<string, string> = {
  painting: "painting",
  plumbing: "plumbing",
  electricity: "electricity",
  cleaning: "cleaning",
  furniture: "furniture",
  cars: "cars",
  ac: "ac",
  carpentry: "carpentry",
  maintenance: "maintenance",
  pest_control: "pest_control",
  landscaping: "landscaping",
  moving: "moving",
  other: "other",
};

export default function NewRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const { status, phone: savedPhone, refresh } = useAuth();
  const createRequest = useCreateRequest();
  const { data: skills } = useListSkills({ status: "approved" });

  const category = (params.category as string) || "general";
  const categoryName = (params.categoryName as string) || t.req.request;
  // An explicit skillId (e.g. from an approved custom service) takes priority.
  // Otherwise resolve the category to a REAL catalog skill id at runtime so we
  // never send a non-existent skill id (which fails the DB foreign key).
  const explicitSkillId = params.skillId ? Number(params.skillId) : null;
  const resolvedSkillId = useMemo<number | null>(() => {
    if (explicitSkillId && Number.isInteger(explicitSkillId)) return explicitSkillId;
    const list = skills ?? [];
    if (!list.length) return null;
    const slug = CATEGORY_SLUG[category];
    if (slug) {
      const bySlug = list.find((s) => s.slug === slug);
      if (bySlug) return bySlug.id;
    }
    const section = CATEGORY_SECTION[category];
    if (section) {
      const bySection = list.find((s) => s.category === section);
      if (bySection) return bySection.id;
    }
    return list[0].id;
  }, [explicitSkillId, skills, category]);

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [image, setImage] = useState<PickedAsset | null>(null);
  const [video, setVideo] = useState<PickedAsset | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [includesSpareParts, setIncludesSpareParts] = useState(false);
  const [preferredTime, setPreferredTime] = useState<string>("asap");

  useEffect(() => {
    if (savedPhone) setPhone((prev) => prev || savedPhone);
  }, [savedPhone]);

  // Get location
  const getLocation = async () => {
    setIsLocating(true);
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t.req.location, t.home.locationDenied, [
            { text: t.req.cancel, style: "cancel" },
            { text: t.home.openSettings, onPress: () => Linking.openSettings() },
          ]);
          setIsLocating(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocationCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        // Reverse geocode
        try {
          const [addr] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (addr) {
            const parts = [addr.street, addr.district, addr.city].filter(Boolean);
            if (parts.length) setAddress(parts.join("، "));
          }
        } catch (_) {}
      } else {
        // Web fallback
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocationCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            },
            () => {}
          );
        }
      }
    } catch (e) {
      Alert.alert(t.req.error, t.req.locationFailed);
    } finally {
      setIsLocating(false);
    }
  };

  // Pick media. Image and video live in separate slots so the customer can
  // attach one or both; at least one is required at submit time.
  const pickMedia = async (type: "image" | "video") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.req.error, t.req.mediaPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "image" ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const picked: PickedAsset = {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      };
      if (type === "image") setImage(picked);
      else setVideo(picked);
    }
  };

  const removeMedia = (type: "image" | "video") => {
    if (type === "image") setImage(null);
    else setVideo(null);
  };

  // Submit request
  const submitRequest = async () => {
    if (!description.trim()) {
      Alert.alert(t.req.error, t.req.descRequired);
      return;
    }
    if (!address.trim()) {
      Alert.alert(t.req.error, t.req.addressRequired);
      return;
    }
    const normalizedPhone = normalizeIlPhone(phone);
    if (!normalizedPhone) {
      Alert.alert(t.req.error, t.req.phoneRequired);
      return;
    }
    if (!image && !video) {
      Alert.alert(t.req.error, t.req.mediaRequired);
      return;
    }
    if (!resolvedSkillId) {
      Alert.alert(t.req.error, t.req.submitFailed);
      return;
    }

    setSubmitting(true);
    try {
      if (normalizedPhone !== (savedPhone ?? "").trim()) {
        try {
          await updateCurrentUser({ phone: normalizedPhone });
          await refresh();
        } catch {
          setSubmitting(false);
          Alert.alert(t.req.error, t.req.submitFailed);
          return;
        }
      }
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      if (image || video) {
        setUploadingMedia(true);
        try {
          if (image) {
            imageUrl = await uploadAsset({
              uri: image.uri,
              name: image.fileName ?? `request-${Date.now()}.jpg`,
              mimeType: image.mimeType,
            });
          }
          if (video) {
            videoUrl = await uploadAsset({
              uri: video.uri,
              name: video.fileName ?? `request-${Date.now()}.mp4`,
              mimeType: video.mimeType ?? "video/mp4",
            });
          }
        } catch (e) {
          console.error("Upload failed:", e);
          setSubmitting(false);
          Alert.alert(t.req.error, t.req.submitFailed);
          return;
        } finally {
          setUploadingMedia(false);
        }
      }

      const result = await createRequest.mutateAsync({
        data: {
          skillId: resolvedSkillId,
          description: description.trim(),
          address: address.trim(),
          lat: locationCoords?.lat ?? undefined,
          lng: locationCoords?.lng ?? undefined,
          paymentMethod: "on_site",
          priceMin: undefined,
          priceMax: undefined,
          preferredTime: timeFromPreset(preferredTime).toISOString(),
          scheduledTime: undefined,
          imageUrl: imageUrl,
          videoUrl: videoUrl,
          includesSpareParts: includesSpareParts,
        },
      });
      setCreatedRequestId(result.id);
      setSuccess(true);
    } catch (err) {
      Alert.alert(t.req.error, t.req.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  // Success view
  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={80} color={GOLD} />
          </View>
          <Text style={styles.successTitle}>{t.req.created}</Text>
          <Text style={styles.successText}>
            {t.req.createdMsg}
          </Text>
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => {
                if (createdRequestId) {
                  router.push(`/request/${createdRequestId}` as any);
                }
              }}
            >
              <Text style={styles.viewBtnText}>{t.req.viewRequest}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.homeBtnText}>{t.tabs.home}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.req.newTitle}</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <View style={styles.categoryIcon}>
            {CATEGORY_ICONS[category]?.type === "fontawesome" ? (
              <FontAwesome name={CATEGORY_ICONS[category].name as any} size={16} color={GOLD} />
            ) : CATEGORY_ICONS[category]?.type === "material" ? (
              <MaterialCommunityIcons name={CATEGORY_ICONS[category].name as any} size={18} color={GOLD} />
            ) : (
              <Feather name={(CATEGORY_ICONS[category]?.name || "briefcase") as any} size={16} color={GOLD} />
            )}
          </View>
          <Text style={styles.categoryText}>{(t.home[category as keyof typeof t.home] || t.home[CATEGORY_NAME_KEY[category] as keyof typeof t.home] || categoryName)}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.req.descLabel}</Text>
          <Text style={styles.sectionSubtitle}>{t.req.newSub}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder={t.req.descPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Media Upload — image and video each have their own slot; at least
            one is required (both allowed). */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.req.mediaSectionTitle}</Text>
          <Text style={styles.sectionSubtitle}>{t.req.mediaSectionSub}</Text>
          <View style={styles.mediaButtons}>
            {image ? (
              <View style={styles.mediaSlot}>
                <Image source={{ uri: image.uri }} style={styles.mediaImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia("image")}>
                  <Feather name="x" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia("image")}>
                <Feather name="image" size={24} color={GOLD} />
                <Text style={styles.mediaBtnText}>{t.req.photoBtn}</Text>
              </TouchableOpacity>
            )}
            {video ? (
              <View style={styles.mediaSlot}>
                <View style={styles.videoThumb}>
                  <Feather name="video" size={28} color={GOLD} />
                  <Text style={styles.videoThumbText}>{t.req.videoBtn}</Text>
                </View>
                <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia("video")}>
                  <Feather name="x" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia("video")}>
                <Feather name="video" size={24} color={GOLD} />
                <Text style={styles.mediaBtnText}>{t.req.videoBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
          {uploadingMedia && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={styles.uploadingText}>{t.req.uploadingMedia}</Text>
            </View>
          )}
        </View>

        {/* Spare parts — optional flag surfaced to providers for pricing. */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.spareRow}
            onPress={() => setIncludesSpareParts((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, includesSpareParts && styles.checkboxOn]}>
              {includesSpareParts && <Feather name="check" size={14} color="#FFF" />}
            </View>
            <View style={styles.spareTextWrap}>
              <Text style={styles.spareLabel}>{t.req.sparePartsLabel}</Text>
              <Text style={styles.spareHint}>{t.req.sparePartsHint}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferred Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.req.preferredTime}</Text>
          <View style={styles.timeOptions}>
            {TIME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.timeBtn,
                  preferredTime === opt.id && styles.timeBtnActive,
                ]}
                onPress={() => setPreferredTime(opt.id)}
              >
                <Text
                  style={[
                    styles.timeBtnText,
                    preferredTime === opt.id && styles.timeBtnTextActive,
                  ]}
                >
                  {t.req[opt.labelKey as keyof typeof t.req] as string}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.req.location}</Text>
            <TouchableOpacity style={styles.gpsBtn} onPress={getLocation} disabled={isLocating}>
              {isLocating ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <>
                  <Feather name="map-pin" size={14} color={GOLD} />
                  <Text style={styles.gpsText}>{t.req.useGps}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t.req.addressPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          {locationCoords && (
            <Text style={styles.locationHint}>
              {t.req.located}
            </Text>
          )}
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.profile.phoneLabel}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="05xxxxxxxx"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
              maxLength={10}
            />
            <View style={styles.phoneIcon}>
              <Feather name="phone" size={18} color={GOLD} />
            </View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.req.paymentLabel}</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentOption}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={GOLD} />
              <Text style={styles.paymentText}>{t.req.payOnSite}</Text>
              <View style={styles.paymentCheck}>
                <Feather name="check" size={14} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitRequest}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>{t.req.submit}</Text>
              <Feather name="send" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          {t.req.createdMsg}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(200,165,116,0.15)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    color: GOLD,
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  textArea: {
    padding: 14,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 100,
    textAlign: "right",
    lineHeight: 20,
  },
  input: {
    padding: 14,
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "right",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200,165,116,0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  gpsText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "600",
  },
  locationHint: {
    color: "#4CAF50",
    fontSize: 12,
    marginTop: 6,
    textAlign: "right",
  },
  phoneIcon: {
    position: "absolute",
    left: 14,
    top: 14,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
    gap: 8,
    flex: 1,
  },
  paymentText: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },
  paymentCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  // Media
  mediaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mediaBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
    gap: 8,
  },
  mediaBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mediaSlot: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoThumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  videoThumbText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "600",
  },
  spareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(200,165,116,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  spareTextWrap: {
    flex: 1,
  },
  spareLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  spareHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  videoBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 6,
  },
  removeMediaBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  uploadingText: {
    color: GOLD,
    fontSize: 13,
  },
  // Time picker
  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeBtnActive: {
    backgroundColor: GOLD + "20",
    borderColor: GOLD,
  },
  timeBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  timeBtnTextActive: {
    color: GOLD,
    fontWeight: "700",
  },
  // Success
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(200,165,116,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.3)",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 30,
  },
  successButtons: {
    gap: 12,
    width: "100%",
  },
  viewBtn: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  viewBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  homeBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  homeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
