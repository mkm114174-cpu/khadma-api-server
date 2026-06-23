import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useListRequests } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang, Lang } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

const GOLD = "#C8A574";

/* ── Language Picker ── */
const LANGS: { key: Lang; label: string }[] = [
  { key: "ar", label: "العربية" },
  { key: "en", label: "English" },
  { key: "he", label: "עברית" },
];

function LanguagePicker() {
  const C = useColors();
  const { lang, setLang } = useLang();

  return (
    <View style={lpStyles.row}>
      {LANGS.map((l) => {
        const active = l.key === lang;
        return (
          <TouchableOpacity
            key={l.key}
            style={[
              lpStyles.btn,
              { backgroundColor: C.muted, borderColor: C.border },
              active && { borderColor: GOLD, backgroundColor: GOLD + "15" }
            ]}
            onPress={() => setLang(l.key)}
            activeOpacity={0.8}
          >
            <Text style={[
              lpStyles.label,
              { color: C.mutedForeground },
              active && { color: GOLD, fontWeight: "700" }
            ]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const lpStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  label: { fontSize: 14, fontWeight: "600" },
});

/* ── Stat Box ── */
function StatBox({ num, label, icon }: { num: number; label: string; icon: keyof typeof Feather.glyphMap }) {
  const C = useColors();
  return (
    <View style={statStyles.statBox}>
      <View style={[statStyles.statIcon, { backgroundColor: GOLD + "15" }]}>
        <Feather name={icon} size={18} color={GOLD} />
      </View>
      <View>
        <Text style={[statStyles.statNum, { color: C.foreground }]}>{num}</Text>
        <Text style={[statStyles.statLabel, { color: C.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  statBox: { flex: 1, flexDirection: 'row', alignItems: "center", paddingVertical: 16, paddingHorizontal: 12, gap: 10 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500" },
});

/* ── Menu Row ── */
interface MenuRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  danger?: boolean;
  rightNode?: React.ReactNode;
  badge?: number;
  onPress?: () => void;
  isRTL?: boolean;
}

function MenuRow({ icon, label, value, danger, rightNode, badge, onPress, isRTL }: MenuRowProps) {
  const C = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        menuStyles.row,
        { flexDirection: isRTL ? "row" : "row-reverse" },
        pressed && { backgroundColor: C.muted },
      ]}
      onPress={onPress}
    >
      <View style={[menuStyles.rowIcon, { backgroundColor: danger ? "#FF444415" : GOLD + "10" }]}>
        <Feather name={icon} size={18} color={danger ? "#FF4444" : GOLD} />
      </View>
      <Text style={[
        menuStyles.rowLabel,
        { textAlign: isRTL ? "right" : "left", color: danger ? "#FF4444" : C.foreground },
      ]}>
        {label}
      </Text>
      <View style={menuStyles.rowRight}>
        {badge ? (
          <View style={menuStyles.badge}>
            <Text style={menuStyles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        ) : null}
        {rightNode ?? (value ? <Text style={[menuStyles.rowValue, { color: C.mutedForeground }]}>{value}</Text> : null)}
        {!danger && (
          <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={C.mutedForeground} />
        )}
      </View>
    </Pressable>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 16, fontWeight: "500", flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 14 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
});

/* ── Screen ── */
export default function ProfileScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const { name, phone, address, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const [modalInfo, setModalInfo] = useState<"privacy" | "terms" | "about" | null>(null);

  const { data: requests } = useListRequests({ mine: true });
  const all = requests ?? [];
  const completed = all.filter((r) => r.status === "completed").length;
  const active = all.filter((r) => r.status === "active" || r.status === "pending").length;
  const total = all.length;

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm(t.profile.logoutConfirm)) logout();
    } else {
      Alert.alert(t.profile.logoutTitle, t.profile.logoutConfirm, [
        { text: t.profile.cancel, style: "cancel" },
        { text: t.profile.logout, style: "destructive", onPress: logout },
      ], { userInterfaceStyle: isDark ? "dark" : "light" });
    }
  };

  return (
    <View style={styles.root}>
      {/* Premium Header Background */}
      <View style={[styles.headerBg, { backgroundColor: isDark ? "#0A0A0A" : "#1A1A2E", height: 260 + insets.top }]}>
         <View style={[styles.goldOverlay, { opacity: isDark ? 0.05 : 0.1 }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { borderColor: GOLD }]}>
              <Text style={styles.avatarText}>{phone ? phone.slice(-2) : "KH"}</Text>
            </View>
            <View style={styles.editBadge}>
              <Feather name="camera" size={12} color="#FFF" />
            </View>
          </View>
          
          <Text style={styles.heroName}>{name || t.profile.name}</Text>
          <Text style={styles.heroPhone}>+972 {phone || "— — —"}</Text>
          
          <View style={[styles.verifiedBadge, { backgroundColor: GOLD + "20" }]}>
            <Feather name="shield" size={12} color={GOLD} />
            <Text style={styles.verifiedText}>{t.profile.verified}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <StatBox num={completed} label={t.profile.completed} icon="check-circle" />
          <View style={styles.statDivider} />
          <StatBox num={active} label={t.profile.active} icon="zap" />
          <View style={styles.statDivider} />
          <StatBox num={total} label={t.profile.total} icon="layers" />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t.profile.accountSection}
          </Text>
          <View style={styles.card}>
            <MenuRow isRTL={isRTL} icon="user" label={t.profile.nameLabel} value={name || t.profile.name} onPress={() => router.push("/edit-profile")} />
            <View style={styles.sep} />
            <MenuRow isRTL={isRTL} icon="phone" label={t.profile.phoneLabel} value={`+972 ${phone || ""}`} onPress={() => router.push("/edit-profile")} />
            <View style={styles.sep} />
            <MenuRow isRTL={isRTL} icon="map-pin" label={t.profile.addresses} value={address || t.profile.addressEmpty} onPress={() => router.push("/addresses")} />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t.profile.prefs}
          </Text>
          <View style={styles.card}>
            <MenuRow
              isRTL={isRTL}
              icon="bell"
              label={t.profile.notifications}
              onPress={() => router.push("/notifications")}
            />
            <View style={styles.sep} />
            <View>
              <View style={[menuStyles.row, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <View style={[menuStyles.rowIcon, { backgroundColor: GOLD + "10" }]}>
                  <Feather name="globe" size={18} color={GOLD} />
                </View>
                <Text style={[menuStyles.rowLabel, { textAlign: isRTL ? "right" : "left", color: C.foreground }]}>
                  {t.profile.language}
                </Text>
              </View>
              <LanguagePicker />
            </View>
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon={isDark ? "moon" : "sun"}
              label={t.profile.theme}
              value={isDark ? t.profile.dark : t.profile.light}
              onPress={toggleTheme}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? "right" : "left" }]}>
            {t.profile.support}
          </Text>
          <View style={styles.card}>
            <MenuRow isRTL={isRTL} icon="help-circle" label={t.profile.faq} />
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon="message-circle"
              label={t.profile.contact}
              onPress={() => router.push("/contact")}
            />
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon="lock"
              label={t.privacy.title}
              onPress={() => setModalInfo("privacy")}
            />
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon="file-text"
              label={t.terms.title}
              onPress={() => setModalInfo("terms")}
            />
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon="info"
              label={t.about.title}
              onPress={() => setModalInfo("about")}
            />
            <View style={styles.sep} />
            <MenuRow
              isRTL={isRTL}
              icon="star"
              label={t.profile.rate}
              onPress={() => router.push("/rate-app")}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.card}>
            <MenuRow isRTL={isRTL} icon="log-out" label={t.profile.logout} danger onPress={handleLogout} />
          </View>
        </View>

        <Text style={styles.version}>{t.profile.version}</Text>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={modalInfo != null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModalInfo(null)}
      >
        <View style={[styles.modalRoot, { backgroundColor: C.background, paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <TouchableOpacity onPress={() => setModalInfo(null)} style={styles.modalClose}>
              <Feather name="x" size={22} color={C.foreground} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalInfo === "privacy" ? t.privacy.title : modalInfo === "terms" ? t.terms.title : t.about.title}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalBody, { textAlign: isRTL ? "right" : "left" }]}>
              {modalInfo === "privacy" ? t.privacy.content : modalInfo === "terms" ? t.terms.content : t.about.content}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    headerBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },
    goldOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: GOLD,
    },
    scrollView: { flex: 1 },
    content: { paddingBottom: 120 },

    hero: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 32, fontWeight: "700", color: "#FFF" },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: GOLD,
      borderWidth: 3,
      borderColor: '#1A1A2E',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroName: { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 4 },
    heroPhone: { fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 12 },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    verifiedText: { fontSize: 12, color: GOLD, fontWeight: "700" },

    statsCard: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 30,
      backgroundColor: C.card,
      borderRadius: 24,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 },
      }),
      borderWidth: 1,
      borderColor: C.border,
    },
    statDivider: { width: 1, backgroundColor: C.border, marginVertical: 20 },

    section: { marginHorizontal: 20, marginBottom: 24 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: C.mutedForeground,
      marginBottom: 12,
      paddingHorizontal: 4,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
    },
    sep: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

    version: {
      textAlign: "center",
      fontSize: 12,
      color: C.mutedForeground,
      marginTop: 8,
      opacity: 0.5,
    },

    /* Modal */
    modalRoot: { flex: 1 },
    modalHeader: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    modalClose: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    modalTitle: { fontSize: 20, fontWeight: "700", color: C.foreground },
    modalContent: { padding: 24 },
    modalBody: { fontSize: 16, color: C.foreground, lineHeight: 26 },
  });

