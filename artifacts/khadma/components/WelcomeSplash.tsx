import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LogoIcon } from "@/components/LogoIcon";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

const Y = "#C8A574";

/**
 * Branded full-screen welcome animation shown for ~3s after the customer
 * verifies their login code, just before entering the app.
 */
export function WelcomeSplash({
  name,
  durationMs = 3000,
  onDone,
}: {
  name?: string;
  durationMs?: number;
  onDone?: () => void;
}) {
  const C = useColors();
  const { t } = useLang();
  const styles = React.useMemo(() => makeStyles(C), [C]);

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    console.log("[WelcomeSplash] useEffect started, durationMs=", durationMs);
    const entrance = Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 45,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(nameAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(taglineAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    entrance.start();

    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(durationMs - 300, 600),
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    });
    progressAnim.start();

    const spin = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    const timer = setTimeout(() => {
      console.log("[WelcomeSplash] timer fired, calling onDone");
      onDoneRef.current?.();
    }, durationMs);
    return () => {
      clearTimeout(timer);
      entrance.stop();
      progressAnim.stop();
      spin.stop();
      pulse.stop();
    };
  }, [durationMs]); // onDoneRef is stable, no need to re-run when callback changes

  const spinDeg = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.12] });
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.glow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Animated.View
            style={[styles.ring, { transform: [{ rotate: spinDeg }] }]}
          />
          <Animated.View
            style={[styles.logoCircle, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          >
            <LogoIcon size={80} />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: nameAnim,
              transform: [
                {
                  translateY: nameAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {t.auth.appName}
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          {name ? `${t.auth.welcomeBack}، ${name}` : t.auth.welcomeBack}
        </Animated.Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.footer}>{t.auth.appName}</Text>
        <Pressable style={styles.skipBtn} onPress={onDone}>
          <Text style={styles.skipText}>{t.auth.continue}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.background,
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 160,
      paddingBottom: 64,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
    logoStage: {
      width: 180,
      height: 180,
      alignItems: "center",
      justifyContent: "center",
    },
    glow: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: Y,
    },
    ring: {
      position: "absolute",
      width: 168,
      height: 168,
      borderRadius: 84,
      borderWidth: 3,
      borderColor: "transparent",
      borderTopColor: Y,
      borderRightColor: Y + "55",
    },
    logoCircle: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: "rgba(200, 165, 116, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Y,
    },
    logoText: {
      fontSize: 48,
      fontWeight: "800",
      color: Y,
    },
    appName: {
      fontSize: 40,
      fontWeight: "800",
      color: C.foreground,
      letterSpacing: 2,
    },
    tagline: { fontSize: 16, color: C.mutedForeground },
    bottom: { alignItems: "center", gap: 14, alignSelf: "stretch", paddingHorizontal: 64 },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      alignSelf: "stretch",
      overflow: "hidden",
    },
    progressFill: { height: 4, borderRadius: 2, backgroundColor: Y },
    footer: { fontSize: 13, color: C.mutedForeground },
    skipBtn: {
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Y,
      backgroundColor: "rgba(200, 165, 116, 0.15)",
      marginTop: 8,
    },
    skipText: { fontSize: 15, color: Y, fontWeight: "600" },
  });
