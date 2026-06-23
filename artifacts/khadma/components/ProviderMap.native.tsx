import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { DARK_MAP_STYLE } from "./KhadmaMap.native";
import { requestStatusStyle } from "@/lib/requestStatus";

export interface CustomerRequest {
  id: string;
  service: string;
  client: string;
  price: number;
  distance: string;
  coordinate: { latitude: number; longitude: number };
  isNew: boolean;
  status: string;
}

interface Props {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  requests: CustomerRequest[];
  selectedRequest: CustomerRequest | null;
  locationGranted: boolean;
  onPinPress: (req: CustomerRequest) => void;
  onMapPress: () => void;
  mapRef?: React.RefObject<MapView | null>;
}

const Y = "#C8A574";

function PulseMarker({ isNew, isSelected, color }: { isNew: boolean; isSelected: boolean; color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNew) return;
    const run = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    run(pulse, 0);
    run(pulse2, 600);
  }, [isNew]);

  const ringStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.8, 0.4, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }],
  });

  return (
    <View style={styles.markerContainer}>
      {isNew && (
        <>
          <Animated.View style={ringStyle(pulse)} />
          <Animated.View style={ringStyle(pulse2)} />
        </>
      )}
      <View style={[
        styles.pin,
        { borderColor: color },
        isSelected && { backgroundColor: color },
        isNew && { shadowColor: color, shadowOpacity: 0.6, shadowRadius: 8, elevation: 8 },
      ]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      {isNew && <View style={[styles.newDot, { backgroundColor: color }]} />}
    </View>
  );
}

export default function ProviderMap({ region, requests, selectedRequest, locationGranted, onPinPress, onMapPress, mapRef }: Props) {
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
      {requests.map((req) => (
        <Marker
          key={req.id}
          coordinate={req.coordinate}
          onPress={() => onPinPress(req)}
          tracksViewChanges={false}
        >
          <PulseMarker isNew={req.isNew} isSelected={selectedRequest?.id === req.id} color={requestStatusStyle(req.status).color} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 6,
  },
  pinSelected: { backgroundColor: Y, borderColor: Y },
  pinOld: { borderColor: "#444", opacity: 0.6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  newDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Y,
    borderWidth: 2,
    borderColor: "#0D0D0D",
  },
});
