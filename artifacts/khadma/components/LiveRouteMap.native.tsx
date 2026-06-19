import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Feather } from "@expo/vector-icons";

import { DARK_MAP_STYLE } from "./KhadmaMap.native";
import type { LatLng } from "@/lib/routing";

interface Props {
  destination: LatLng;
  live: LatLng;
  route: LatLng[];
  follow?: boolean;
  height?: number;
}

export default function LiveRouteMap({
  destination,
  live,
  route,
  follow = true,
  height = 360,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const coords = route.length >= 2 ? route : [live, destination];

  // Follow the live position smoothly while navigating.
  useEffect(() => {
    if (!follow) return;
    mapRef.current?.animateCamera(
      { center: live, zoom: 16 },
      { duration: 600 },
    );
  }, [follow, live.latitude, live.longitude]);

  // When not following, frame the whole route.
  useEffect(() => {
    if (follow) return;
    const id = setTimeout(() => {
      mapRef.current?.fitToCoordinates([live, destination], {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(id);
  }, [follow, live.latitude, live.longitude, destination.latitude, destination.longitude]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: live.latitude,
          longitude: live.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
      >
        <Polyline coordinates={coords} strokeColor="#C8A574" strokeWidth={6} />
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.pin, { borderColor: "#C8A574" }]}>
            <Feather name="home" size={15} color="#C8A574" />
          </View>
        </Marker>
        <Marker coordinate={live} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.liveOuter}>
            <View style={styles.liveInner} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "#0D0D0D" },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  liveOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(96,165,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#60A5FA",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
