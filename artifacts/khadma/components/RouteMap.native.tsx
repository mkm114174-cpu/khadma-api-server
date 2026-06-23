import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Feather } from "@expo/vector-icons";

import { DARK_MAP_STYLE } from "./KhadmaMap.native";
import type { LatLng } from "@/lib/routing";

interface Props {
  customer: LatLng;
  provider: LatLng;
  route: LatLng[];
  height?: number;
}

export default function RouteMap({ customer, provider, route, height = 220 }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const coords = route.length >= 2 ? route : [provider, customer];

  useEffect(() => {
    const id = setTimeout(() => {
      mapRef.current?.fitToCoordinates([provider, customer], {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 350);
    return () => clearTimeout(id);
  }, [provider.latitude, provider.longitude, customer.latitude, customer.longitude]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: (provider.latitude + customer.latitude) / 2,
          longitude: (provider.longitude + customer.longitude) / 2,
          latitudeDelta: Math.abs(provider.latitude - customer.latitude) * 2.2 + 0.02,
          longitudeDelta: Math.abs(provider.longitude - customer.longitude) * 2.2 + 0.02,
        }}
        pointerEvents="none"
      >
        <Polyline coordinates={coords} strokeColor="#C8A574" strokeWidth={4} />
        <Marker coordinate={provider} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.pin, { borderColor: "#60A5FA" }]}>
            <Feather name="truck" size={14} color="#60A5FA" />
          </View>
        </Marker>
        <Marker coordinate={customer} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.pin, { borderColor: "#C8A574" }]}>
            <Feather name="home" size={14} color="#C8A574" />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: "hidden", backgroundColor: "#0D0D0D" },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
