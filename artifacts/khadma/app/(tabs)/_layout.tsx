import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import ChatFAB from "@/components/ChatFAB";

/* Tab bar heights for FAB offset */
const WEB_TAB_H = 84;
const NATIVE_TAB_H = 70;

const GOLD = "#C8A574";
const TAB_BG = "#1A1A2E";

// Home (index) is the anchor/initial tab so the Android back button never lands
// on the hidden "request" tab (which is declared first). Back follows visit
// history and exits the app from the home tab.
export const unstable_settings = {
  initialRouteName: "index",
};

function TabBarIcon({ name, color, focused, type }: { name: any, color: string, focused: boolean, type: 'feather' | 'material' | 'ionicons' }) {
  const IconComponent = type === 'feather' ? Feather : type === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={iconStyles.iconWrapper}>
      {focused && (
        <View style={iconStyles.activeCircle}>
          <IconComponent name={name} size={22} color="#FFFFFF" />
        </View>
      )}
      {!focused && <IconComponent name={name} size={22} color={color} />}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();
  const { t } = useLang();

  const fabBottom = isWeb
    ? WEB_TAB_H + 12
    : NATIVE_TAB_H + safeAreaInsets.bottom + 12;

  return (
    <View style={styles.root}>
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: GOLD,
          tabBarInactiveTintColor: "#888",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: TAB_BG,
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: isWeb ? 10 : Math.max(safeAreaInsets.bottom, 10),
            height: isWeb ? WEB_TAB_H : NATIVE_TAB_H + safeAreaInsets.bottom,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
          },
        }}
      >
        <Tabs.Screen
          name="request"
          options={{
            href: null,
            title: t.tabs.more,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon type="feather" name="more-horizontal" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: t.tabs.services || t.tabs.messages,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon type="feather" name="grid" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t.tabs.home,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon type="feather" name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: t.tabs.orders,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon type="feather" name="clipboard" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.tabs.profile,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon type="feather" name="user" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>

      <ChatFAB bottomOffset={fabBottom} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  activeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
});
