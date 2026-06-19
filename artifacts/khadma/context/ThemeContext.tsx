import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import colors from "@/constants/colors";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "khadma.theme";

export type ThemeColors = (typeof colors)["dark"] & { radius: number };

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  hydrated: boolean;
  setMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved choice on launch.
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") setModeState(saved);
      } catch {
        // ignore — fall back to the default dark theme
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Keep the native window background in sync to avoid color flashes.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors[mode].background).catch(() => {});
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const toggleTheme = () => setMode(mode === "dark" ? "light" : "dark");

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      colors: { ...colors[mode], radius: colors.radius },
      isDark: mode === "dark",
      hydrated,
      setMode,
      toggleTheme,
    }),
    [mode, hydrated],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

/**
 * Non-throwing accessor. Returns null when used outside ThemeProvider (e.g. the
 * top-level error fallback, which renders if the provider tree itself crashes).
 */
export function useThemeOptional() {
  return useContext(ThemeContext);
}
