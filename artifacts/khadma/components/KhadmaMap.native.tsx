import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { requestStatusStyle, type RequestMarker } from "@/lib/requestStatus";

const LOGO = require("@/assets/images/logo_clean.png");

// Google's official "night" map style. Produces the beta look: navy-blue water
// (#17263c), dark-slate land, visible roads + Israeli route-number shields, green
// parks, and standard place labels. Do NOT over-darken water/roads — that blacks
// out the sea and hides the route shields (the exact regression we fixed here).
export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export interface NearbyProvider {
  id: string;
  serviceId: string;
  serviceName: string;
  providerName?: string;
  categoryId: string;
  city: string;
  coordinate: { latitude: number; longitude: number };
  price: number;
  rating: number;
}

export interface TownMarker {
  id: string;
  name: string;
  count: number;
  coordinate: { latitude: number; longitude: number };
}

interface Props {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  towns: TownMarker[];
  selectedTownId?: string | null;
  locationGranted: boolean;
  onTownPress: (town: TownMarker) => void;
  onMapPress: () => void;
  mapRef?: React.RefObject<MapView | null>;
  requests?: RequestMarker[];
}

export default function KhadmaMap({ region, towns, selectedTownId, locationGranted, onTownPress, onMapPress, mapRef, requests = [] }: Props) {
  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      customMapStyle={DARK_MAP_STYLE}
      region={region}
      showsUserLocation={locationGranted}
      showsMyLocationButton={false}
      onPress={onMapPress}
    >
      {towns.map((town) => {
        const active = selectedTownId === town.id;
        return (
          <Marker
            key={town.id}
            coordinate={town.coordinate}
            onPress={() => onTownPress(town)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.townWrap}>
              <View style={[styles.townPin, active && styles.townPinActive]}>
                <View style={styles.townPinInner}>
                  <Image source={LOGO} style={styles.townLogo} resizeMode="cover" />
                </View>
                <View style={styles.townCount}>
                  <Text style={styles.townCountText}>{town.count}</Text>
                </View>
              </View>
              <View style={styles.townLabel}>
                <Text style={styles.townLabelText} numberOfLines={1}>{town.name}</Text>
              </View>
            </View>
          </Marker>
        );
      })}
      {requests.map((r) => {
        const s = requestStatusStyle(r.status);
        return (
          <Marker key={`req-${r.id}`} coordinate={r.coordinate} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.reqMarker, { borderColor: s.color, backgroundColor: s.color + "33" }]}>
              <View style={[styles.reqDot, { backgroundColor: s.color, shadowColor: s.color, shadowOpacity: 1, shadowRadius: 4 }]} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  reqMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  reqDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  townWrap: {
    alignItems: "center",
    width: 140,
  },
  townPin: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#C8A574",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 10,
  },
  townPinInner: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  townPinActive: {
    borderWidth: 3,
    borderColor: "#FFD700",
    transform: [{ scale: 1.15 }],
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 15,
  },
  townLogo: {
    width: "100%",
    height: "100%",
  },
  townCount: {
    position: "absolute",
    top: -10,
    right: -10,
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 6,
    backgroundColor: "#C8A574",
    borderWidth: 2,
    borderColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  townCountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  townLabel: {
    marginTop: 10,
    maxWidth: 130,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(20,20,20,0.95)",
    borderWidth: 1,
    borderColor: "rgba(200,165,116,0.4)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  townLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C8A574",
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
