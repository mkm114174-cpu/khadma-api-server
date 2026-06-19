---
name: Expo web asset URIs
description: How to get a usable image URL on Expo web (react-native-web), especially for HTML embedded in iframes
---

On Expo web (react-native-web), `Image.resolveAssetSource` does NOT exist and
throws `RNImage.default.resolveAssetSource is not a function` at runtime
(typecheck still passes). To get a usable URL for a static asset on web:

```
const mod: any = require("@/assets/images/x.png");
let uri: string = typeof mod === "string" ? mod : mod?.uri ?? mod?.default ?? "";
if (uri.startsWith("/") && typeof window !== "undefined") {
  uri = window.location.origin + uri; // absolutize for srcDoc iframes
}
```

**Why:** Leaflet map markers are built as an HTML string injected via `<iframe srcDoc>`.
Relative/root-relative asset paths don't resolve reliably inside srcDoc, so the URL
must be absolute (origin-prefixed). `resolveAssetSource` is the obvious-but-wrong API
on web (works only on native).

**How to apply:** Any time you embed a bundled image into raw HTML/iframe content on
the web side of a platform-split component (`*.tsx` web vs `*.native.tsx`). On native,
plain `require()` + `<Image source={require(...)}>` works as usual.
