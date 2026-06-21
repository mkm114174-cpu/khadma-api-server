import type { ExpoConfig } from "expo/config";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withAndroidPackagingFix = require("./plugins/withAndroidPackagingFix.js");

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN?.replace(/^https?:\/\//, "");
const routerOrigin = apiDomain
  ? `https://${apiDomain}`
  : "https://replit.com/";

const config: ExpoConfig = {
  name: "Khadma",
  slug: "khadma",
  version: "1.0.12",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "khadma",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#0D0D0D",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.khadma.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "نحتاج إلى موقعك لعرض الخدمات القريبة منك",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "نحتاج إلى موقعك لعرض الخدمات القريبة منك",
    },
  },
  android: {
    package: "com.khadma.app",
    versionCode: 12,
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#0D0D0D",
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECORD_AUDIO",
      "MODIFY_AUDIO_SETTINGS",
      "CAMERA",
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VIDEO",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      },
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "khadma",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: routerOrigin,
      },
    ],
    "expo-font",
    "expo-web-browser",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "نحتاج إلى موقعك لعرض الخدمات القريبة منك",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "نحتاج الوصول للصور لإرفاق صورة أو فيديو مع طلب الخدمة",
        cameraPermission:
          "نحتاج الكاميرا لالتقاط صورة أو فيديو مع طلب الخدمة",
      },
    ],
    "expo-audio",
    "expo-video",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "79a68bf7-7044-4cec-a160-4d0e9a97677b",
    },
  },
  owner: "saher90",
};

export default withAndroidPackagingFix(config);
