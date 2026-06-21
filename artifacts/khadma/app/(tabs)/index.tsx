import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, FontAwesome5, FontAwesome } from "@expo/vector-icons";

import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LogoIcon } from "@/components/LogoIcon";
import { useListNotifications, useListProviders, useListRequests } from "@workspace/api-client-react";

const GOLD = "#C8A574";

const HOME_CATEGORIES = [
  { id: "painting", name: "painting", icon: "edit-3", iconType: "feather" },
  { id: "maintenance", name: "maintenance", icon: "home", iconType: "feather" },
  { id: "electricity", name: "electricity", icon: "zap", iconType: "feather" },
  { id: "plumbing", name: "plumbing", icon: "droplet", iconType: "feather" },
  { id: "furniture", name: "furniture", icon: "box", iconType: "feather" },
  { id: "cars", name: "cars", icon: "truck", iconType: "feather" },
  { id: "cleaning", name: "cleaning", icon: "scissors", iconType: "feather" },
  { id: "ac", name: "ac", icon: "wind", iconType: "feather" },
  { id: "carpentry", name: "carpentry", icon: "tool", iconType: "feather" },
  { id: "appliances", name: "appliances", icon: "hard-drive", iconType: "feather" },
  { id: "pest_control", name: "pest_control", icon: "shield", iconType: "feather" },
  { id: "landscaping", name: "landscaping", icon: "sun", iconType: "feather" },
  { id: "moving", name: "moving", icon: "move", iconType: "feather" },
  { id: "other", name: "other", icon: "more-horizontal", iconType: "feather" },
];

const CATEGORY_NAME_KEY: Record<string, string> = {
  painting: "painting",
  maintenance: "maintenance",
  electricity: "electricity",
  plumbing: "plumbing",
  furniture: "furniture",
  cars: "cars",
  cleaning: "cleaning",
  ac: "ac",
  carpentry: "carpentry",
  appliances: "appliances",
  pest_control: "pest_control",
  landscaping: "landscaping",
  moving: "moving",
  other: "other",
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, isRTL, t } = useLang();
  const { name: userName, isLoggedIn } = useAuth();

  const notificationsQ = useListNotifications({
    query: { enabled: isLoggedIn },
  });
  const unreadCount = (notificationsQ.data ?? []).filter((n) => !n.isRead).length;

  const [locationName, setLocationName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [locating, setLocating] = useState(false);

  const providersQ = useListProviders(undefined, { query: { enabled: isLoggedIn } });
  const myRequestsQ = useListRequests({ mine: true }, { query: { enabled: isLoggedIn } });

  const topInset = Platform.OS === "web" ? 20 : insets.top;

  const notifyLocationDenied = () => {
    if (Platform.OS === "web") {
      notify(t.home.locationDenied);
      return;
    }
    Alert.alert(t.home.currentLocation, t.home.locationDenied, [
      { text: t.req.cancel, style: "cancel" },
      { text: t.home.openSettings, onPress: () => Linking.openSettings() },
    ]);
  };

  const notify = (msg: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.alert(msg);
    } else {
      Alert.alert(t.home.currentLocation, msg);
    }
  };

  const acquireLocation = async (manual = false) => {
    if (locating) return;
    setLocating(true);
    try {
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (manual) notifyLocationDenied();
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        const [addr] = await Location.reverseGeocodeAsync(coords);
        if (addr) {
          const parts = [addr.district, addr.city].filter(Boolean);
          if (parts.length) setLocationName(parts.join("، "));
          else if (manual) notify(t.home.locationError);
        } else if (manual) {
          notify(t.home.locationError);
        }
      } else {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=ar`,
                  );
                  const data = await res.json();
                  const a = data?.address ?? {};
                  const parts = [
                    a.suburb || a.neighbourhood || a.city_district,
                    a.city || a.town || a.village || a.state,
                  ].filter(Boolean);
                  if (parts.length) setLocationName(parts.join("، "));
                  else if (manual) notify(t.home.locationError);
                } catch (_) {
                  if (manual) notify(t.home.locationError);
                }
                resolve();
              },
              () => {
                if (manual) notifyLocationDenied();
                resolve();
              },
              { enableHighAccuracy: true, timeout: 10000 },
            );
          });
        } else if (manual) {
          notify(t.home.locationError);
        }
      }
    } catch (_) {
      if (manual) notify(t.home.locationError);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    setLocationName(t.home.currentLocation);
    acquireLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.home.currentLocation]);

  const visibleCategories = HOME_CATEGORIES.filter((cat) => {
    const q = searchText.trim();
    if (!q) return true;
    const label = String(t.home[CATEGORY_NAME_KEY[cat.id] as keyof typeof t.home] ?? "");
    return label.includes(q);
  });

  const renderCategoryIcon = (cat: typeof HOME_CATEGORIES[0]) => {
    if (cat.iconType === "material") {
      return <MaterialCommunityIcons name={cat.icon as any} size={28} color={GOLD} />;
    } else if (cat.iconType === "font-awesome-5") {
      return <FontAwesome5 name={cat.icon as any} size={24} color={GOLD} />;
    } else if (cat.iconType === "font-awesome") {
      return <FontAwesome name={cat.icon as any} size={24} color={GOLD} />;
    }
    return <Feather name={cat.icon as any} size={24} color={GOLD} />;
  };

  return (
    <ScrollView style={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Image Background */}
      <ImageBackground
        source={require("@/assets/images/home_bg.png")}
        style={styles.hero}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <View style={[styles.header, { paddingTop: topInset + 10 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push("/(tabs)/profile")}>
              <Feather name="menu" size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
               <Text style={styles.logoText}>{t.home.appName}</Text>
               <LogoIcon size={38} />
            </View>

            <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.iconCircle}>
              <Feather name="bell" size={20} color="white" />
              {unreadCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>{t.home.goodEvening}</Text>
            <Text style={styles.subtitleText}>{t.home.weAreHere}</Text>
          </View>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
               <View style={styles.locationPinCircle}>
                  <Feather name="map-pin" size={16} color={GOLD} />
               </View>
               <View style={styles.locationTexts}>
                  <Text style={styles.locationLabel}>{t.home.currentLocation}</Text>
                  <Text style={styles.locationValue} numberOfLines={1}>{locationName}</Text>
               </View>
            </View>
            <TouchableOpacity style={styles.changeLocBtn} onPress={() => acquireLocation(true)} disabled={locating}>
               {locating ? (
                 <ActivityIndicator size="small" color={GOLD} />
               ) : (
                 <Text style={styles.changeLocText}>{t.home.update}</Text>
               )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.filterBtn} onPress={() => router.push("/(tabs)/services")}>
               <Feather name="sliders" size={18} color="white" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
               <TextInput
                 style={styles.searchInput}
                 placeholder={t.home.searchService}
                 placeholderTextColor="#999"
                 value={searchText}
                 onChangeText={setSearchText}
                 returnKeyType="search"
                 onSubmitEditing={() => router.push("/(tabs)/services")}
               />
               <Feather name="search" size={18} color="#999" style={{marginLeft: 10}} />
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
            <Text style={styles.viewAllText}>{t.home.viewAll}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{t.home.categories}</Text>
        </View>

        <View style={styles.grid}>
          {visibleCategories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.categoryCard}
              onPress={() => {
                router.push({ pathname: "/request/new", params: { category: cat.id, categoryName: cat.name } });
              }}
            >
              <View style={styles.catIconContainer}>
                {renderCategoryIcon(cat)}
              </View>
              <Text style={styles.catName}>{t.home[CATEGORY_NAME_KEY[cat.id] as keyof typeof t.home]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Professional Services Banner */}
        <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={() => router.push("/(tabs)/services")}>
           <ImageBackground
             source={require("@/assets/images/home_bg.png")}
             style={styles.bannerBg}
             imageStyle={{ borderRadius: 15, resizeMode: "cover" }}
           >
              <View style={styles.bannerOverlay} />
              <View style={styles.bannerContent}>
                 <Text style={styles.bannerTitle}>{t.home.professionalServices}</Text>
                 <Text style={styles.bannerSubtitle}>{t.home.highQuality}</Text>
                 <TouchableOpacity style={styles.bookNowBtn} onPress={() => router.push("/(tabs)/services")}>
                    <Text style={styles.bookNowText}>{t.home.bookNow}</Text>
                 </TouchableOpacity>
              </View>
           </ImageBackground>
        </TouchableOpacity>
      </View>
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  hero: {
    width: "100%",
    height: 450,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  header: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "white",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "bold",
    marginRight: 8,
  },
  greetingSection: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  greetingText: {
    color: GOLD,
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitleText: {
    color: "white",
    fontSize: 16,
    marginTop: 5,
  },
  locationCard: {
    backgroundColor: "rgba(30,30,30,0.85)",
    borderRadius: 15,
    padding: 12,
    marginTop: 25,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  locationInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
  },
  locationPinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200,165,116,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  locationTexts: {
    alignItems: "flex-end",
  },
  locationLabel: {
    color: "#999",
    fontSize: 12,
  },
  locationValue: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  changeLocBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  changeLocText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  filterBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#333",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#0A0A0A",
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAllText: {
    color: GOLD,
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "23%",
    aspectRatio: 0.85,
    backgroundColor: "white",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  catIconContainer: {
    marginBottom: 8,
  },
  catName: {
    color: "#333",
    fontSize: 11,
    fontWeight: "600",
  },
  banner: {
    marginTop: 10,
    height: 120,
    borderRadius: 15,
    overflow: "hidden",
  },
  bannerBg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bannerContent: {
    paddingHorizontal: 20,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  bookNowBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookNowText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
