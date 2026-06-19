import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Provider, useListProviders, useListNotifications } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import { localizeCity } from "@/constants/cities";
const GOLD = "#C8A574";
const LIGHT_BG = "#F5F0E8";

export default function ProvidersRankingScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { isRTL, t, lang } = useLang();
  const topInset = Platform.OS === "web" ? 20 : insets.top;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("latest"); // latest, price, nearest, top_rated

  const { data, isLoading, refetch, isRefetching } = useListProviders();
  const notificationsQ = useListNotifications();
  const unreadCount = (notificationsQ.data ?? []).filter((n) => !n.isRead).length;

  // Filter labels
  const filterOptions = [
    { id: "latest", label: t.providers.latest },
    { id: "price", label: t.providers.price },
    { id: "nearest", label: t.providers.nearest },
    { id: "top_rated", label: t.providers.topRated },
  ];

  const processedProviders = useMemo(() => {
    let list = [...(data ?? [])];
    
    // Simple search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        (p.name?.toLowerCase().includes(q)) || 
        (p.serviceType?.toLowerCase().includes(q))
      );
    }

    // Sort
    if (filter === "top_rated") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filter === "latest") {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [data, search, filter]);

  const onRefresh = () => {
    refetch();
    notificationsQ.refetch();
  };

  const renderProviderCard = ({ item }: { item: Provider }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            source={item.id === 1 ? require("@/assets/images/provider1.png") : item.id === 2 ? require("@/assets/images/provider2.png") : require("@/assets/images/provider3.png")}
            style={styles.providerPhoto}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.heartBtn}>
            <Ionicons name="heart-outline" size={20} color="#666" />
          </TouchableOpacity>
          <View style={[styles.availabilityBadge, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.greenDot} />
            <Text style={styles.availabilityText}>{t.providers.availableNow}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.nameRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={styles.providerName}>{item.name || item.serviceType}</Text>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={GOLD} />
            </View>
          </View>
          
          <Text style={[styles.specialtyText, { textAlign: isRTL ? "right" : "left" }]}>
            {item.serviceType || t.providers.general}
          </Text>

          <View style={[styles.statsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[styles.ratingRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <FontAwesome5 name="star" size={10} color="#FFD700" solid />
              <Text style={styles.ratingScore}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({item.ratingCount || 0} {t.providers.reviews})</Text>
            </View>
            <View style={[styles.locationRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Ionicons name="location-sharp" size={14} color="#888" />
              <Text style={styles.locationText}>{item.city ? localizeCity(item.city, lang) : t.providers.cityFallback}</Text>
              <Text style={styles.distanceText}>• 2.5 {t.providers.km}</Text>
            </View>
          </View>

          <View style={[styles.tagsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.tag}><Text style={styles.tagText}>{t.providers.general}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{item.serviceType}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{item.serviceType}</Text></View>
          </View>

          <View style={[styles.cardActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity style={styles.viewProfileBtn}>
              <Text style={styles.viewProfileText}>{t.providers.viewProfile}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.requestBtn}
              onPress={() => router.push({ pathname: "/(tabs)/request", params: { providerId: item.id } })}
            >
              <Text style={styles.requestBtnText}>{t.providers.requestService}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 10, flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.iconButton}>
          <Feather name="bell" size={24} color="#000" />
          {unreadCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t.providers.title}</Text>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="search" size={20} color="#888" />
          <TextInput
            style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={t.providers.searchPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={styles.filterBtnText}>{t.providers.filter}</Text>
          <Ionicons name="options-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          inverted={isRTL}
          contentContainerStyle={styles.chipsContent}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.id)}
              style={[styles.chip, filter === item.id && styles.activeChip]}
            >
              <Text style={[styles.chipText, filter === item.id && styles.activeChipText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Count and Map Toggle */}
      <View style={[styles.countRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={styles.countText}>
          {t.providers.count?.replace("{{count}}", String(processedProviders.length)) ?? `${processedProviders.length} providers`}
        </Text>
        <TouchableOpacity style={[styles.mapToggle, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={styles.mapToggleText}>{t.providers.mapView}</Text>
          <Feather name="map" size={16} color={GOLD} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={processedProviders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProviderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={GOLD} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Feather name="users" size={48} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>{t.providers.empty}</Text>
              <TouchableOpacity style={styles.changeLocBtn}>
                <Text style={styles.changeLocText}>{t.providers.changeLocation}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (C: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: LIGHT_BG },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 15,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: LIGHT_BG,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
    iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    badge: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "red",
      borderWidth: 1,
      borderColor: LIGHT_BG,
    },
    searchContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 10,
    },
    searchBar: {
      flex: 1,
      height: 45,
      backgroundColor: "#FFF",
      borderRadius: 12,
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: "#EAEAEA",
    },
    searchInput: { flex: 1, fontSize: 14, color: "#000" },
    filterBtn: {
      width: 90,
      height: 45,
      backgroundColor: "#FFF",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "#EAEAEA",
    },
    filterBtnText: { fontSize: 14, fontWeight: "600" },
    chipsContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 10 },
    chip: {
      paddingHorizontal: 16,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#FFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#EAEAEA",
    },
    activeChip: { backgroundColor: GOLD, borderColor: GOLD },
    chipText: { fontSize: 13, color: "#666" },
    activeChipText: { color: "#FFF", fontWeight: "600" },
    countRow: {
      paddingHorizontal: 20,
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 10,
    },
    countText: { fontSize: 13, color: "#666" },
    mapToggle: { gap: 6, alignItems: "center" },
    mapToggleText: { fontSize: 13, color: GOLD, fontWeight: "600" },
    listContent: { padding: 20, gap: 15 },
    card: {
      backgroundColor: "#FFF",
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#EAEAEA",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: { height: 180, width: "100%", position: "relative" },
    providerPhoto: { width: "100%", height: "100%" },
    heartBtn: {
      position: "absolute",
      top: 12,
      left: 12,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.8)",
      alignItems: "center",
      justifyContent: "center",
    },
    availabilityBadge: {
      position: "absolute",
      bottom: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.9)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 6,
    },
    greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
    availabilityText: { fontSize: 11, fontWeight: "600", color: "#333" },
    cardBody: { padding: 15 },
    nameRow: { alignItems: "center", gap: 6, marginBottom: 2 },
    providerName: { fontSize: 16, fontWeight: "700", color: "#000" },
    verifiedBadge: { marginTop: 2 },
    specialtyText: { fontSize: 13, color: "#888", marginBottom: 10 },
    statsRow: { justifyContent: "space-between", marginBottom: 15 },
    ratingRow: { alignItems: "center", gap: 4 },
    ratingScore: { fontSize: 13, fontWeight: "700", color: "#000" },
    reviewCount: { fontSize: 12, color: "#888" },
    locationRow: { alignItems: "center", gap: 4 },
    locationText: { fontSize: 12, color: "#666" },
    distanceText: { fontSize: 12, color: "#888" },
    tagsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
    tag: {
      backgroundColor: "#F5F0E8",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    tagText: { fontSize: 11, color: "#666" },
    cardActions: { gap: 10 },
    viewProfileBtn: {
      flex: 1,
      height: 45,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: GOLD,
      alignItems: "center",
      justifyContent: "center",
    },
    viewProfileText: { color: GOLD, fontWeight: "600", fontSize: 14 },
    requestBtn: {
      flex: 1.5,
      height: 45,
      borderRadius: 12,
      backgroundColor: GOLD,
      alignItems: "center",
      justifyContent: "center",
    },
    requestBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
    emptyIconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#FFF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: "#888", marginBottom: 20 },
    changeLocBtn: {
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderRadius: 25,
      backgroundColor: GOLD,
    },
    changeLocText: { color: "#FFF", fontWeight: "700" },
  });
