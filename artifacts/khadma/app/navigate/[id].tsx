import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";

import LiveRouteMap from "@/components/LiveRouteMap";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { useGetRequest, getGetRequestQueryKey } from "@workspace/api-client-react";
import {
  fetchRoute,
  formatDistance,
  formatDuration,
  haversineKm,
  type LatLng,
  type ManeuverKind,
  type RouteResult,
} from "@/lib/routing";

const Y = "#C8A574";

const ICON_FOR: Record<ManeuverKind, keyof typeof Feather.glyphMap> = {
  depart: "navigation",
  arrive: "map-pin",
  left: "corner-up-left",
  right: "corner-up-right",
  "slight-left": "arrow-up-left",
  "slight-right": "arrow-up-right",
  "sharp-left": "corner-up-left",
  "sharp-right": "corner-up-right",
  straight: "arrow-up",
  uturn: "rotate-ccw",
  roundabout: "refresh-cw",
};

export default function NavigateScreen() {
  const C = useColors();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  const requestQ = useGetRequest(requestId, {
    query: { enabled: Number.isFinite(requestId), queryKey: getGetRequestQueryKey(requestId) },
  });
  const request = requestQ.data;

  const destination: LatLng | null =
    request?.lat != null && request?.lng != null
      ? { latitude: request.lat, longitude: request.lng }
      : null;

  const [live, setLive] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [follow, setFollow] = useState(true);
  const [permDenied, setPermDenied] = useState(false);
  const lastRoutedFrom = useRef<LatLng | null>(null);

  // Live location tracking (native + web).
  useEffect(() => {
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;
    let webId: number | null = null;

    async function start() {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== "granted") {
          setPermDenied(true);
          return;
        }
        const s = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: 4000 },
          (loc) => {
            if (cancelled) return;
            setLive({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          },
        );
        if (cancelled) {
          s.remove();
          return;
        }
        sub = s;
        return;
      }
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setPermDenied(true);
        return;
      }
      webId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return;
          setLive({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          if (!cancelled) setPermDenied(true);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 },
      );
    }
    start();
    return () => {
      cancelled = true;
      sub?.remove();
      if (webId != null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(webId);
      }
    };
  }, []);

  // (Re)compute the route when the provider moves meaningfully (~40m).
  useEffect(() => {
    if (!live || !destination) return;
    const moved =
      !lastRoutedFrom.current ||
      haversineKm(lastRoutedFrom.current, live) > 0.04;
    if (!moved && route) return;
    lastRoutedFrom.current = live;
    let cancelled = false;
    fetchRoute(live, destination).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [live?.latitude, live?.longitude, destination?.latitude, destination?.longitude]);

  const openExternal = () => {
    if (!destination) return;
    const { latitude, longitude } = destination;
    const url =
      Platform.OS === "ios"
        ? `maps://?daddr=${latitude},${longitude}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  const nextStep = route?.steps?.find((s) => s.kind !== "depart") ?? route?.steps?.[0];
  const arrived = !!live && !!destination && haversineKm(live, destination) < 0.05;

  if (Number.isFinite(requestId) && requestQ.isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Y} />
      </View>
    );
  }

  if (!request || !destination) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Feather name="map-pin" size={30} color={C.mutedForeground} />
        <Text style={styles.emptyText}>{t.navigate.noLocation}</Text>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backPillText}>{t.navigate.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Map */}
      <View style={styles.mapArea}>
        {live ? (
          <LiveRouteMap
            destination={destination}
            live={live}
            route={route?.coordinates ?? []}
            follow={follow}
            height={10000}
          />
        ) : (
          <View style={[styles.center, { backgroundColor: "#0D0D0D" }]}>
            <ActivityIndicator color={Y} />
            <Text style={styles.emptyText}>
              {permDenied ? t.navigate.permDenied : t.navigate.locating}
            </Text>
          </View>
        )}

        {/* Top bar */}
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-right" size={20} color={C.foreground} />
          </TouchableOpacity>
          <View style={styles.destPill}>
            <Feather name="home" size={13} color={Y} />
            <Text style={styles.destPillText} numberOfLines={1}>
              {request.address || `${t.providerRequests.request} ${request.requestNumber}`}
            </Text>
          </View>
        </View>

        {/* Recenter (native only — web map auto-fits) */}
        {live && Platform.OS !== "web" && (
          <TouchableOpacity
            style={[styles.recenter, { bottom: 24 }, follow && styles.recenterOn]}
            onPress={() => setFollow((f) => !f)}
          >
            <Feather name="crosshair" size={18} color={follow ? "#000" : C.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom navigation panel */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {arrived ? (
          <View style={styles.arrivedRow}>
            <Feather name="check-circle" size={22} color="#4ADE80" />
            <Text style={styles.arrivedText}>{t.navigate.arrived}</Text>
          </View>
        ) : (
          <View style={styles.nextRow}>
            <View style={styles.nextIcon}>
              <Feather name={ICON_FOR[nextStep?.kind ?? "straight"]} size={24} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextInstruction} numberOfLines={2}>
                {nextStep?.instruction ?? t.navigate.continueTo}
              </Text>
              {nextStep?.distanceM ? (
                <Text style={styles.nextDist}>{t.navigate.after} {formatDistance(nextStep.distanceM / 1000)}</Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{route ? formatDuration(route.durationMin) : "…"}</Text>
            <Text style={styles.statLabel}>{route?.approximate ? t.navigate.estimatedTime : t.navigate.arrivalTime}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{route ? formatDistance(route.distanceKm) : "…"}</Text>
            <Text style={styles.statLabel}>{t.navigate.remainingDistance}</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.extBtn} onPress={openExternal}>
            <Feather name="navigation" size={16} color="#000" />
            <Text style={styles.extBtnText}>{t.navigate.voiceNav}</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming steps */}
        {route?.steps && route.steps.length > 1 && (
          <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>
            {route.steps.slice(0, 6).map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Feather name={ICON_FOR[s.kind]} size={15} color={Y} />
                </View>
                <Text style={styles.stepText} numberOfLines={1}>
                  {s.instruction}
                </Text>
                {s.distanceM ? (
                  <Text style={styles.stepDist}>{formatDistance(s.distanceM / 1000)}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0D0D0D" },
    center: {
      flex: 1,
      backgroundColor: C.background,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyText: { color: C.mutedForeground, fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
    backPill: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: Y,
    },
    backPillText: { color: "#000", fontWeight: "700", fontSize: 14 },

    mapArea: { flex: 1, position: "relative" },

    topBar: {
      position: "absolute",
      left: 12,
      right: 12,
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 10,
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    destPill: {
      flex: 1,
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 21,
      paddingHorizontal: 14,
      height: 42,
    },
    destPillText: { flex: 1, color: C.foreground, fontSize: 13, fontWeight: "600", textAlign: "right" },

    recenter: {
      position: "absolute",
      right: 16,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    recenterOn: { backgroundColor: Y, borderColor: Y },

    panel: {
      backgroundColor: C.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 18,
      gap: 14,
      borderTopWidth: 1,
      borderColor: C.border,
    },
    nextRow: { flexDirection: "row-reverse", alignItems: "center", gap: 14 },
    nextIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: Y,
      alignItems: "center",
      justifyContent: "center",
    },
    nextInstruction: { color: C.foreground, fontSize: 17, fontWeight: "700", textAlign: "right" },
    nextDist: { color: Y, fontSize: 13, fontWeight: "600", textAlign: "right", marginTop: 2 },

    arrivedRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12, paddingVertical: 6 },
    arrivedText: { color: C.foreground, fontSize: 16, fontWeight: "700" },

    statsRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    stat: { flex: 1, alignItems: "center", gap: 2 },
    statVal: { color: C.foreground, fontSize: 16, fontWeight: "700" },
    statLabel: { color: C.mutedForeground, fontSize: 11 },
    statDivider: { width: 1, height: 34, backgroundColor: C.border },
    extBtn: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 6,
      backgroundColor: Y,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 6,
    },
    extBtnText: { color: "#000", fontSize: 13, fontWeight: "700" },

    steps: { maxHeight: 168 },
    stepRow: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: Y + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    stepText: { flex: 1, color: C.foreground, fontSize: 14, textAlign: "right" },
    stepDist: { color: C.mutedForeground, fontSize: 12 },
  });
}
