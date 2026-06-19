import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const Y = "#C8A574";

export function LogoIcon({ size = 56 }: { size?: number }) {
  return (
    <View style={[styles.logoOuter, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.logoInner, { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39 }]}>
        <Feather name="home" size={size * 0.38} color={Y} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoOuter: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Y,
    backgroundColor: "rgba(200, 165, 116, 0.12)",
    overflow: "hidden",
  },
  logoInner: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(200, 165, 116, 0.25)",
  },
});
