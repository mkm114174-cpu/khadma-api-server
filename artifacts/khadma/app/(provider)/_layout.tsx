import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

import {
  ApiError,
  getGetMyProviderQueryKey,
  useGetMyProvider,
} from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";
import ChatFAB from "@/components/ChatFAB";
import ProviderOnboarding from "@/components/provider/ProviderOnboarding";
import ProviderStatusScreen from "@/components/provider/ProviderStatusScreen";

const Y = "#C8A574";
const WEB_TAB_H = 84;
const NATIVE_TAB_H = 60;

function ProviderTabs() {
  const C = useColors();
  const { t } = useLang();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const fabBottom = isWeb ? WEB_TAB_H + 4 : NATIVE_TAB_H + insets.bottom + 4;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Y,
          tabBarInactiveTintColor: C.mutedForeground,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : C.background,
            borderTopWidth: 1,
            borderTopColor: C.border,
            elevation: 0,
            paddingBottom: isWeb ? 0 : insets.bottom,
            ...(isWeb ? { height: WEB_TAB_H } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: C.background }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.providerDashboard.title ?? "Dashboard",
            tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: t.providerDashboard.requests ?? "Requests",
            tabBarIcon: ({ color }) => <Feather name="inbox" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: t.providerDashboard.earnings ?? "Earnings",
            tabBarIcon: ({ color }) => <Feather name="trending-up" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.providerProfile.title ?? "Profile",
            tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
          }}
        />
      </Tabs>
      <ChatFAB bottomOffset={fabBottom} />
    </View>
  );
}

export default function ProviderLayout() {
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { t } = useLang();
  const providerQ = useGetMyProvider({
    query: { retry: false, queryKey: getGetMyProviderQueryKey() },
  });

  if (providerQ.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Y} />
      </View>
    );
  }

  // A 404 means the user is a provider account with no provider profile yet —
  // send them through registration. Any other error is transient/retryable.
  const notFound =
    providerQ.error instanceof ApiError && providerQ.error.status === 404;

  if (notFound) {
    return <ProviderOnboarding />;
  }

  if (providerQ.error || !providerQ.data) {
    return (
      <View style={styles.center}>
        <Feather name="alert-triangle" size={34} color={C.mutedForeground} />
        <Text style={styles.errTitle}>{t.layout.errorTitle}</Text>
        <Text style={styles.errBody}>{t.layout.errorBody}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => providerQ.refetch()}>
          <Text style={styles.retryText}>{t.layout.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (providerQ.data.status === "needs_info") {
    return (
      <ProviderOnboarding
        resubmit
        provider={providerQ.data}
        onDone={() => providerQ.refetch()}
      />
    );
  }

  if (providerQ.data.status !== "approved") {
    return (
      <ProviderStatusScreen
        status={providerQ.data.status}
        onRefresh={() => providerQ.refetch()}
      />
    );
  }

  return <ProviderTabs />;
}

const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errTitle: { fontSize: 17, fontWeight: "700", color: C.foreground, textAlign: "center" },
  errBody: { fontSize: 13, color: C.mutedForeground, textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Y,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: "#000" },
});
