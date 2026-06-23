---
name: Tab bar overlaps absolute footers
description: Why in-screen absolute-positioned footers (e.g. a submit CTA) get hidden behind the bottom tab bar in the Khadma Expo app.
---

The customer Tabs navigator (`app/(tabs)/_layout.tsx`, ClassicTabLayout) renders its
tab bar with `tabBarStyle.position: "absolute"` at the bottom, height `WEB_TAB_H = 84`
on web and `NATIVE_TAB_H = 60` (+ `insets.bottom`) on native. Because it is absolute,
it overlays the screen content — it does NOT push content up.

**The rule:** any screen that places its own `position: absolute; bottom: 0` footer
(such as the request screen's "send" CTA) will render *behind* that tab bar and look
missing. Offset the footer's `bottom` by the tab bar height:
`const tabBarH = Platform.OS === "web" ? 84 : 60 + insets.bottom;` then `bottom: tabBarH`,
and give the scroll content `paddingBottom: tabBarH + <footer height>`.

**Why:** a user repeatedly reported "there is no send button" on the request screen.
The button existed and was enabled — it was simply covered by the absolute tab bar on web.
The first fix (removing a `disabled` guard) did not help because the cause was layout, not state.

**How to apply:** whenever adding a sticky/absolute bottom bar inside any `(tabs)` screen,
account for the tab bar height, or the bottom of your UI will be invisible.
