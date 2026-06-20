import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfigGuard } from "@/components/ConfigGuard";
import { NotificationCenter } from "@/components/NotificationCenter";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { setBaseUrl } from "@workspace/api-client-react";

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#0D0D0D");

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const queryClient = new QueryClient();

function AuthGate() {
  const { status, role, refresh, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const C = useColors();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { t } = useLang();

  usePresenceHeartbeat(status === "ready");

  useEffect(() => {
    // Do not route while resolving or when the profile fetch failed — the
    // error overlay handles recovery so transient failures never push the
    // user into the provisioning flow.
    if (status === "loading" || status === "error") return;

    const inAuth = segments[0] === "(auth)";
    const inProvider = segments[0] === "(provider)";
    const inTabs = segments[0] === "(tabs)";

    if (status === "signedOut") {
      // "contact" (تواصل معنا) is a public screen reachable from the auth
      // landing — do not bounce the user back to onboarding when they open it.
      const isPublic = inAuth || segments[0] === "contact";
      if (!isPublic) {
        // Check if language was selected
        AsyncStorage.getItem("khadma.lang").then((lang) => {
          if (!lang) {
            router.replace("/(auth)/language");
          } else {
            router.replace("/(auth)/onboarding");
          }
        });
      }
      return;
    }

    if (status === "needsProvision") {
      if (segments[1] !== "complete") router.replace("/(auth)/complete");
      return;
    }

    // Guest demo mode
    if (status === "guest") {
      if (inAuth) {
        router.replace("/(tabs)");
      }
      return;
    }

    // status === "ready"
    if (inAuth) {
      router.replace(role === "provider" ? "/(provider)" : "/(tabs)");
    } else if (role === "provider" && inTabs) {
      router.replace("/(provider)");
    } else if (role !== "provider" && inProvider) {
      router.replace("/(tabs)");
    }
  }, [status, role, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(provider)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="request/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="request/new" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="navigate/[id]" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="messages" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="chat/[requestId]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="providers" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="contact" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="rate-app" options={{ headerShown: false, animation: "slide_from_right" }} />
      </Stack>
      {status === "ready" && <NotificationCenter />}
      {status === "loading" && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.loadingText, { color: C.mutedForeground }]}>Khadma</Text>
          </View>
        </View>
      )}
      {status === "error" && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.errorTitle}>{t.layout.errorTitle}</Text>
          <Text style={styles.errorBody}>{t.layout.errorBody}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              void refresh();
            }}
          >
            <Text style={styles.retryText}>{t.layout.retry}</Text>
          </Pressable>
          <Pressable
            style={styles.signOutButton}
            onPress={() => {
              void logout();
            }}
          >
            <Text style={styles.signOutText}>{t.layout.signOut}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const makeStyles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingContent: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  errorTitle: {
    color: C.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  errorBody: {
    color: C.mutedForeground,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "stretch",
  },
  retryText: {
    color: "#0D0D0D",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
  signOutText: {
    color: C.mutedForeground,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ConfigGuard>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider>
                <LanguageProvider>
                  <GestureHandlerRootView>
                    <KeyboardProvider>
                      <AuthGate />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </LanguageProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ConfigGuard>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
