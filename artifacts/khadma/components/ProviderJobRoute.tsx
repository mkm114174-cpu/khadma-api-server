import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import RouteMap from "@/components/RouteMap";
import { useColors } from "@/hooks/useColors";
import {
  fetchRoute,
  formatDistance,
  formatDuration,
  type LatLng,
  type RouteResult,
} from "@/lib/routing";

const Y = "#C8A574";

interface Props {
  provider: LatLng;
  customer: LatLng;
}

/**
 * Route card for a provider's accepted job: draws the road route from the
 * provider's location to the customer with distance and ETA. Mirrors the
 * customer-side live route view.
 */
export default function ProviderJobRoute({ provider, customer }: Props) {
  const C = useColors();
  const styles = makeStyles(C);
  const [route, setRoute] = useState<RouteResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoute(provider, customer).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [provider.latitude, provider.longitude, customer.latitude, customer.longitude]);

  return (
    <View style={styles.routeCard}>
      <RouteMap customer={customer} provider={provider} route={route?.coordinates ?? []} height={170} />
      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <Feather name="navigation" size={14} color={Y} />
          <Text style={styles.routeStatVal}>{route ? formatDistance(route.distanceKm) : "…"}</Text>
          <Text style={styles.routeStatLabel}>المسافة للعميل</Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeStat}>
          <Feather name="clock" size={14} color={Y} />
          <Text style={styles.routeStatVal}>{route ? formatDuration(route.durationMin) : "…"}</Text>
          <Text style={styles.routeStatLabel}>{route?.approximate ? "زمن تقريبي" : "زمن الوصول"}</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    routeCard: {
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: C.border,
      marginTop: 10,
    },
    routeStats: {
      flexDirection: "row-reverse",
      alignItems: "center",
      paddingVertical: 12,
      backgroundColor: C.card,
    },
    routeStat: { alignItems: "center", gap: 4, flex: 1 },
    routeStatVal: { fontSize: 15, fontWeight: "700", color: C.foreground },
    routeStatLabel: { fontSize: 11, color: C.mutedForeground },
    routeDivider: { width: 1, height: 32, backgroundColor: C.border },
  });
}
