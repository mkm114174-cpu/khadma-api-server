---
name: Khadma brand logo
description: Which asset/component is the real Khadma logo vs. decoy yellow PNGs.
---

The Khadma brand mark is the **golden** `LogoIcon` component (gold house inside concentric gold rings, brand gold `#C8A574`). Use it wherever the logo should appear (home header next to the title, onboarding/welcome hero, auth screens).

**Why:** `assets/images/logo.png` / `logo_clean.png` are a bright **yellow** filled house+wrench app-icon style mark. They look like a logo but the user explicitly rejected them ("the golden one, not the yellow"). The brand identity across the running app is the muted-gold line treatment, not the yellow square.

**How to apply:** For any in-app "show the logo" request, reach for `<LogoIcon size={...} />`, not the yellow PNG assets. Only use logo.png for the OS app icon (app.json) if ever needed.
