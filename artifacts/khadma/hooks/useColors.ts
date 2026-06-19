import colors from "@/constants/colors";
import { useThemeOptional } from "@/context/ThemeContext";

const DARK = { ...colors.dark, radius: colors.radius };

/**
 * Returns the design tokens for the active theme (dark or light).
 *
 * The palette is driven by ThemeContext, which persists the user's choice to
 * AsyncStorage and restores it on launch. The returned object contains all
 * color tokens for the active palette plus scheme-independent values like
 * `radius`.
 *
 * Falls back to the dark palette when used outside ThemeProvider (e.g. the
 * top-level error fallback) so it never throws on the crash screen.
 */
export function useColors() {
  return useThemeOptional()?.colors ?? DARK;
}
