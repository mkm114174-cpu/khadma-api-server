---
name: Khadma theme conversion pattern
description: How dark/light theming is applied across Khadma mobile screens; follow when adding/editing any screen.
---

# Khadma per-component theme pattern

Khadma supports a persisted dark/light toggle (ThemeContext + AsyncStorage). Colors are NOT module-level constants.

**Rule:** Never write `const C = colors.dark` at module scope. Instead, inside each component:
```ts
const C = useColors();
const styles = useMemo(() => makeStyles(C), [C]);
```
with `const makeStyles = (C: ReturnType<typeof useColors>) => StyleSheet.create({...})`.

- Keep the gold accent `const Y = "#F5C518"` and status hex colors as module constants — they are theme-independent.
- Helper/sub components must call `useColors()` + `makeStyles` themselves (they cannot inherit C via closure if defined at module scope).
- Module helper *functions* (non-components) that need colors take `C` as an argument.

**Why:** Light mode must re-render with new tokens when the user toggles. Module-level `colors.dark` freezes the theme and breaks the toggle. Light mode intentionally keeps the same gold accent for brand continuity.

**How to apply:** Any new screen or edit to an existing screen in `artifacts/khadma/` must use this pattern. `useColors()` reads ThemeContext and falls back to DARK tokens.
