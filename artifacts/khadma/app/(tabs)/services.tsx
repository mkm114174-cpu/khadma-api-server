import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { useListSkills } from "@workspace/api-client-react";

import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import AuthedImage from "@/components/AuthedImage";
import { localizedSkillName, localizedSkillDescription } from "@/constants/serviceTranslations";
import { getServiceCategories } from "@/constants/serviceCatalog";

const GOLD = "#C8A574";
const DARK_BG = "#0A0A0A";
const CARD_BG = "#1A1A1A";

type DisplayItem = {
  key: string;
  section: string;
  name: string;
  description: string;
  image?: any;
  imagePath?: string | null;
  skillId?: number;
};

function CategoryCard({ item, onPress }: { item: DisplayItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {item.imagePath ? (
          <AuthedImage objectPath={item.imagePath} style={styles.categoryImage} contentFit="cover" />
        ) : (
          <Image source={item.image} style={styles.categoryImage} resizeMode="cover" />
        )}
      </View>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
      <View style={styles.chevronContainer}>
        <Feather name="chevron-left" size={12} color={GOLD} />
      </View>
    </TouchableOpacity>
  );
}

export default function ServicesScreen() {
  const { t, isRTL } = useLang();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const { lang } = useLang();
  const DISPLAY_CATEGORIES = getServiceCategories(t);

  // Approved custom services proposed by providers and approved by an admin.
  const { data: customSkills } = useListSkills({ status: "approved", type: "custom" });

  const items: DisplayItem[] = useMemo(() => {
    const builtIn: DisplayItem[] = DISPLAY_CATEGORIES.map((cat) => ({
      key: `cat:${cat.id}`,
      section: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image,
    }));
    const custom: DisplayItem[] = (customSkills ?? []).map((s) => ({
      key: `skill:${s.id}`,
      section: s.category ?? "other",
      name: localizedSkillName(s, lang),
      description: localizedSkillDescription(s, lang),
      imagePath: s.image ?? null,
      skillId: s.id,
    }));
    return [...builtIn, ...custom];
  }, [DISPLAY_CATEGORIES, customSkills, lang]);

  const filtered = items.filter((cat) =>
    cat.name.includes(searchQuery) || cat.description.includes(searchQuery)
  );

  const handleCategoryPress = (item: DisplayItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/request/new",
      params: {
        category: item.section,
        categoryName: item.name,
        ...(item.skillId ? { skillId: String(item.skillId) } : {}),
      },
    });
  };

  const topInset = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.filterButton}>
            <Feather name="sliders" size={20} color={GOLD} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={t.home.searchService}
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
          </View>
        </View>

        <View style={styles.titleRow}>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>{t.home.viewAll}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{t.home.categories}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        numColumns={4}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryCard item={item} onPress={() => handleCategoryPress(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  header: {
    paddingHorizontal: 20,
    backgroundColor: DARK_BG,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchIcon: { marginLeft: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  viewAllText: {
    fontSize: 14,
    color: GOLD,
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: 15,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    width: "23%",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 10,
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 10,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
  },
  chevronContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(200,165,116,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
