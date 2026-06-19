import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");
const GOLD = "#C8A574";
const DARK_BG = "#1A1A2E";

const STATIC_LANGUAGES = [
  { id: "ar" as const, dir: "rtl" as const },
  { id: "en" as const, dir: "ltr" as const },
  { id: "he" as const, dir: "rtl" as const },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLang, t } = useLang();
  const { setGuest, status } = useAuth();

  React.useEffect(() => {
    if (status === "guest") {
      router.replace("/(tabs)");
    }
  }, [status]);

  const selectLanguage = async (langId: "ar" | "en" | "he") => {
    await AsyncStorage.setItem("khadma.lang", langId);
    setLang(langId);
    router.replace("/(auth)/onboarding");
  };

  const demoMode = async (langId: "ar" | "en" | "he") => {
    await AsyncStorage.setItem("khadma.lang", langId);
    setLang(langId);
    await setGuest(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Feather name="globe" size={40} color={GOLD} />
          </View>
          <Text style={styles.title}>{t.langPicker.title}</Text>
          <Text style={styles.subtitle}>{t.langPicker.subtitle}</Text>
        </View>

        <View style={styles.languages}>
          {STATIC_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={styles.langCard}
              onPress={() => selectLanguage(lang.id)}
              activeOpacity={0.8}
            >
              <View style={styles.langInfo}>
                <Text style={styles.langLabel}>{lang.id === "ar" ? t.langPicker.arabic : lang.id === "he" ? t.langPicker.hebrew : t.langPicker.english}</Text>
              </View>
              <View style={styles.chevron}>
                <Feather name="chevron-left" size={20} color={GOLD} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 24, alignItems: "center" }}>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => demoMode("ar")}
            activeOpacity={0.8}
          >
            <Text style={styles.demoBtnText}>تجربة التطبيق بدون تسجيل</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200, 165, 116, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(200, 165, 116, 0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: GOLD,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginTop: 8,
    textAlign: "center",
  },
  languages: {
    gap: 12,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  langInfo: {
    flex: 1,
    alignItems: "center",
  },
  langLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  langDir: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200, 165, 116, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  demoBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(200, 165, 116, 0.4)",
    backgroundColor: "rgba(200, 165, 116, 0.08)",
  },
  demoBtnText: {
    fontSize: 14,
    color: GOLD,
    fontWeight: "600",
  },
});
