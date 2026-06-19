import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { LogoIcon } from "@/components/LogoIcon";

const { width } = Dimensions.get("window");
const Y = "#C8A574";

function useRefs() {
  const { t } = useLang();
  return [
    { label: t.onboarding.slide1Label, desc: t.onboarding.slide1Desc },
    { label: t.onboarding.slide2Label, desc: t.onboarding.slide2Desc },
    { label: t.onboarding.slide3Label, desc: t.onboarding.slide3Desc },
    { label: t.onboarding.slide4Label, desc: t.onboarding.slide4Desc },
  ];
}

export default function OnboardingScreen() {
  const C = useColors();
  const s = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLang();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);
  const scrollRef = useRef<any>(null);

  const refs = useRefs();

  const goNext = () => {
    if (page < refs.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    } else {
      router.push("/(auth)/role");
    }
  };
  const skip = () => router.push("/(auth)/role");

  return (
    <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity style={s.skipBtn} onPress={skip} activeOpacity={0.7}>
        <Text style={[s.skipText, { color: C.mutedForeground }]}>{t.onboarding.skip}</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={16}
        style={s.scroll}
      >
        {refs.map((item, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View key={i} style={[s.page, { transform: [{ scale }], opacity }]}>
              <View style={[s.iconCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <LogoIcon size={140} />
              </View>
              <Text style={[s.label, { color: C.foreground }]}>{item.label}</Text>
              <Text style={[s.desc, { color: C.mutedForeground }]}>{item.desc}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={s.dots}>
        {refs.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === page && s.dotActive, { backgroundColor: i === page ? Y : C.border }]}
          />
        ))}
      </View>

      <TouchableOpacity style={[s.nextBtn, { backgroundColor: Y }]} onPress={goNext} activeOpacity={0.8}>
        <Text style={s.nextText}>{page === refs.length - 1 ? t.onboarding.startNow : t.onboarding.next}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.background,
      alignItems: "center",
    },
    skipBtn: {
      position: "absolute",
      top: 50,
      right: 24,
      zIndex: 10,
    },
    skipText: {
      fontSize: 14,
      fontWeight: "600",
    },
    scroll: {
      flex: 1,
      width: width,
    },
    page: {
      width: width,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 16,
    },
    iconCard: {
      width: width - 48,
      height: (width - 48) * 1.2,
      borderRadius: 28,
      overflow: "hidden",
      borderWidth: 1,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
      elevation: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 24,
      fontWeight: "800",
      marginTop: 24,
    },
    desc: {
      fontSize: 16,
      fontWeight: "500",
      textAlign: "center",
      marginTop: 4,
    },
    dots: {
      flexDirection: "row",
      gap: 8,
      marginTop: 20,
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      opacity: 0.4,
    },
    dotActive: {
      width: 24,
      opacity: 1,
    },
    nextBtn: {
      width: width - 48,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 20,
    },
    nextText: {
      color: "#000",
      fontSize: 16,
      fontWeight: "800",
    },
  });
