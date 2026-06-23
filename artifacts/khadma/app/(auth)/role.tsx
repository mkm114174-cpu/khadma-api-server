import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

const { width, height } = Dimensions.get("window");
const GOLD = "#C8A574";
const DARK_BG = "#1A1A2E";

const isSmall = height < 700;

function LogoIcon({ size = 56 }: { size?: number }) {
  return (
    <View style={[logoStyles.logoContainer, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[logoStyles.logoInner, { width: size * 0.78, height: size * 0.78, borderRadius: size * 0.39 }]}>
        <Feather name="home" size={size * 0.38} color={GOLD} />
      </View>
    </View>
  );
}

function ProviderCard({ onPress, t }: { onPress: () => void; t: any }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={cardStyles.card}>
      <View style={[cardStyles.cardInner, { backgroundColor: "#1A1A2E" }]}>
        <View style={cardStyles.iconOuterCircle}>
          <View style={cardStyles.iconInnerCircle}>
            <Feather name="tool" size={26} color={GOLD} />
          </View>
        </View>
        <Text style={[cardStyles.cardTitle, { color: "#FFFFFF" }]}>{t.role.provider}</Text>
        <Text style={[cardStyles.cardDesc, { color: "#AAAAAA" }]}>
          {t.role.providerDesc}
        </Text>
        <View style={[cardStyles.arrowBtn, cardStyles.arrowBtnDark]}>
          <Feather name="arrow-right" size={20} color={GOLD} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CustomerCard({ onPress, t }: { onPress: () => void; t: any }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={cardStyles.card}>
      <View style={[cardStyles.cardInner, { backgroundColor: "#FFFFFF" }]}>
        <View style={[cardStyles.iconOuterCircle, { borderColor: "rgba(200, 165, 116, 0.2)" }]}>
          <View style={[cardStyles.iconInnerCircle, { backgroundColor: "rgba(200, 165, 116, 0.1)" }]}>
            <Feather name="user" size={26} color="#1A1A2E" />
          </View>
        </View>
        <Text style={[cardStyles.cardTitle, { color: "#1A1A2E" }]}>{t.role.customer}</Text>
        <Text style={[cardStyles.cardDesc, { color: "#666666" }]}>
          {t.role.customerDesc}
        </Text>
        <View style={[cardStyles.arrowBtn, cardStyles.arrowBtnLight]}>
          <Feather name="arrow-right" size={20} color="#1A1A2E" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoleScreen() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useLang();

  const LANGS: { id: "ar" | "en" | "he"; label: string }[] = [
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
    { id: "he", label: "עברית" },
  ];

  const goToSignUp = async (role: "customer" | "provider") => {
    await AsyncStorage.setItem("khadma:intendedRole", role);
    if (role === "customer") {
      router.push("/(auth)/email-code");
    } else {
      router.push({ pathname: "/(auth)/sign-up", params: { role } });
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top image section */}
      <View style={styles.imageWrap}>
        <Image
          source={require("@/assets/images/role_bg.png")}
          style={styles.topImage}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.imageOverlay} />
      </View>

      {/* Bottom dark section */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <LogoIcon size={isSmall ? 56 : 72} />
          <Text style={styles.appName}>{t.role.appName}</Text>
          <Text style={styles.welcomeText}>{t.role.welcome}</Text>
          <Text style={styles.subtitle}>{t.role.subtitle}</Text>
          <View style={styles.langRow}>
            {LANGS.map((l) => {
              const active = lang === l.id;
              return (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => setLang(l.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.divider} />
        </View>

        {/* Cards */}
        <View style={styles.cardsRow}>
          <ProviderCard onPress={() => goToSignUp("provider")} t={t} />
          <CustomerCard onPress={() => goToSignUp("customer")} t={t} />
        </View>

        {/* Contact button */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => router.push("/contact")}
        >
          <Feather name="headphones" size={18} color={GOLD} />
          <View style={styles.contactTextWrapper}>
            <Text style={styles.contactText}>{t.role.contact}</Text>
            <Text style={styles.contactSubtext}>{t.role.contactSub}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const logoStyles = StyleSheet.create({
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "rgba(200, 165, 116, 0.12)",
    overflow: "hidden",
  },
  logoInner: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(200, 165, 116, 0.25)",
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInner: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: isSmall ? 200 : 230,
  },
  iconOuterCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(200, 165, 116, 0.5)",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(200, 165, 116, 0.2)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  arrowBtnDark: {
    borderColor: "rgba(200, 165, 116, 0.4)",
    backgroundColor: "rgba(200, 165, 116, 0.1)",
  },
  arrowBtnLight: {
    borderColor: "rgba(200, 165, 116, 0.2)",
    backgroundColor: "rgba(200, 165, 116, 0.05)",
  },
});

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: DARK_BG,
    },
    scrollContent: {
      flexGrow: 1,
    },
    imageWrap: {
      width: "100%",
      height: height * 0.32,
      position: "relative",
    },
    topImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: DARK_BG,
      opacity: 0.3,
    },
    bottomSection: {
      flex: 1,
      backgroundColor: DARK_BG,
      paddingHorizontal: 16,
      paddingTop: 6,
      justifyContent: "flex-start",
      gap: 12,
    },
    header: {
      alignItems: "center",
    },
    appName: {
      fontSize: 18,
      fontWeight: "bold",
      color: GOLD,
      marginTop: 4,
    },
    welcomeText: {
      fontSize: isSmall ? 20 : 24,
      fontWeight: "bold",
      color: GOLD,
      textAlign: "center",
      marginTop: 4,
    },
    subtitle: {
      fontSize: 13,
      color: "#FFFFFF",
      marginTop: 2,
      textAlign: "center",
      opacity: 0.85,
    },
    langRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      justifyContent: "center",
    },
    langChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(200, 165, 116, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
    },
    langChipActive: {
      backgroundColor: "rgba(200, 165, 116, 0.18)",
      borderColor: GOLD,
    },
    langChipText: {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: 13,
      fontWeight: "600",
    },
    langChipTextActive: {
      color: GOLD,
    },
    divider: {
      width: 36,
      height: 2,
      backgroundColor: GOLD,
      borderRadius: 1,
      marginTop: 6,
      opacity: 0.5,
    },
    cardsRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    contactBtn: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      paddingVertical: 10,
      paddingHorizontal: 32,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
      marginTop: 4,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      width: "100%",
      alignSelf: "center",
    },
    contactTextWrapper: {
      alignItems: "flex-start",
    },
    contactText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    contactSubtext: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 11,
      marginTop: 1,
    },
  });
