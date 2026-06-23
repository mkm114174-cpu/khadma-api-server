import { useRouter } from "expo-router";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { updateCurrentUser } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

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

export default function AddressesScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { address, lat, lng, refresh } = useAuth();

  const [addressInput, setAddressInput] = useState(address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const align = isRTL ? "right" : "left";

  const dirty =
    addressInput.trim() !== (address ?? "").trim() ||
    (coords?.lat ?? null) !== (lat ?? null) ||
    (coords?.lng ?? null) !== (lng ?? null);
  const canSave = dirty && !saving;

  const notify = (msg: string) => {
    if (Platform.OS === "web") window.alert(msg);
    else Alert.alert("", msg);
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const c = await getCoords();
      if (c) {
        setCoords(c);
        if (Platform.OS !== "web") {
          try {
            const [place] = await Location.reverseGeocodeAsync({
              latitude: c.lat,
              longitude: c.lng,
            });
            if (place) {
              const parts = [place.name, place.street, place.city].filter(Boolean);
              if (parts.length && !addressInput.trim()) setAddressInput(parts.join("، "));
            }
          } catch {
            // reverse geocode is best-effort
          }
        }
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const trimmed = addressInput.trim();
      const hasAddress = trimmed.length > 0;
      // The saved location is address + coordinates together. Clearing the
      // address text also clears any previously saved coordinates so stale
      // coords can never keep auto-filling new requests.
      await updateCurrentUser({
        address: hasAddress ? trimmed : null,
        lat: hasAddress ? (coords?.lat ?? null) : null,
        lng: hasAddress ? (coords?.lng ?? null) : null,
      });
      await refresh();
      notify(t.profile.addressSaved);
      router.back();
    } catch (_e) {
      notify(t.profile.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8} activeOpacity={0.8}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profile.addressTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="info" size={16} color={Y} />
          <Text style={[styles.bannerText, { textAlign: align }]}>{t.profile.addressDesc}</Text>
        </View>

        {/* GPS */}
        <TouchableOpacity
          style={[styles.gpsBtn, coords && styles.gpsBtnActive]}
          onPress={useMyLocation}
          disabled={locating}
          activeOpacity={0.85}
        >
          {locating ? (
            <ActivityIndicator size="small" color={Y} />
          ) : (
            <Feather name={coords ? "check-circle" : "map-pin"} size={18} color={coords ? "#4ADE80" : Y} />
          )}
          <Text style={[styles.gpsText, coords && { color: "#4ADE80" }]}>
            {locating ? t.req.locating : coords ? t.req.located : t.req.useGps}
          </Text>
        </TouchableOpacity>

        {/* Address text */}
        <Text style={[styles.label, { textAlign: align, marginTop: 20 }]}>{t.profile.addressLabel}</Text>
        <View style={styles.inputWrap}>
          <Feather name="home" size={16} color={C.mutedForeground} />
          <TextInput
            style={[styles.input, { textAlign: align }]}
            value={addressInput}
            onChangeText={setAddressInput}
            placeholder={t.profile.addressPlaceholder}
            placeholderTextColor={C.mutedForeground}
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveText}>{t.profile.saveAddress}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{t.profile.cancel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: {
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.foreground },
    content: { padding: 20, paddingBottom: 60 },
    banner: {
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: Y + "12",
      borderWidth: 1,
      borderColor: Y + "30",
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
    },
    bannerText: { flex: 1, fontSize: 12, lineHeight: 18, color: C.foreground },
    label: { fontSize: 13, fontWeight: "600", color: C.mutedForeground, marginBottom: 8 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: C.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 14 : 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    input: { flex: 1, fontSize: 15, color: C.foreground },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 14,
    },
    gpsBtnActive: { borderColor: "#4ADE8050", backgroundColor: "#0F1A0F" },
    gpsText: { fontSize: 14, fontWeight: "600", color: Y },
    saveBtn: {
      marginTop: 32,
      backgroundColor: Y,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveText: { fontSize: 16, fontWeight: "700", color: "#000" },
    cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: "center" },
    cancelText: { fontSize: 14, fontWeight: "600", color: C.mutedForeground },
  });
