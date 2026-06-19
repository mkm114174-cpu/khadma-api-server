---
name: Expo Go remote push limitation (Khadma)
description: Why true "notify provider while app is closed" push cannot ship in this project's current setup.
---

Remote/background push notifications ("alert the provider when they are outside
the app") cannot work in this project as-is.

**Why:** The Khadma mobile app runs in Expo Go (react-native-maps pinned to
1.18.0 for Expo Go compatibility). Expo Go on SDK 53+ dropped support for remote
push notifications. Delivering push when the app is closed requires a development
build / standalone APK, not Expo Go.

**How to apply:** If asked for push when the app is backgrounded/closed, do not
attempt to make it work in Expo Go. The full pipeline needs: a dev/standalone
build, expo-notifications, a push-token column on the user, token registration
on the client, and a server-side Expo push sender invoked on new/reassigned
requests. In-app alerts already exist via ~10s notification polling + toast/bell
(works only while the app is open), and the backend auto-reassign sweep
re-notifies providers for stale pending requests.
