#!/usr/bin/env node
/**
 * Build Khadma Android APK locally with Gradle (no EAS cloud).
 *
 * Usage:
 *   node scripts/build-android.mjs           # release APK
 *   node scripts/build-android.mjs --debug   # debug APK
 *   node scripts/build-android.mjs --skip-prebuild
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseEnv } from "./validate-release-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const isDebug = args.includes("--debug");
const skipPrebuild = args.includes("--skip-prebuild");

function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: opts.cwd ?? appRoot,
    env: { ...process.env, ...opts.env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim().replace(/^["']|["']$/g, "");
    if (value) process.env[key] = value;
  }
}

function ensureShortPathOnWindows() {
  // subst breaks Gradle codegen (K: vs C: mixed roots on Windows).
  return appRoot;
}

const workRoot = ensureShortPathOnWindows();

if (process.platform === "win32" && !args.includes("--force")) {
  console.error(`
Windows local Gradle builds fail for this project (React Native New Architecture + CMake).

Use one of these instead:
  1. GitHub Actions (recommended, no Expo cloud):
       push the repo to GitHub, then run workflow "Android APK"
  2. Linux or macOS:
       node scripts/build-android.mjs
  3. Force attempt anyway:
       node scripts/build-android.mjs --force
`);
  process.exit(1);
}

loadEnv(path.join(workRoot, ".env"));

if (!isDebug) {
  validateReleaseEnv(process.env);
} else {
  process.env.EXPO_PUBLIC_DOMAIN ??= "localhost";
}

process.env.GOOGLE_MAPS_API_KEY ??= "placeholder";

const sdk =
  process.env.ANDROID_HOME ??
  path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk");

if (!fs.existsSync(sdk)) {
  console.error("Android SDK not found. Install Android Studio or set ANDROID_HOME.");
  process.exit(1);
}

process.env.ANDROID_HOME = sdk;
process.env.ANDROID_SDK_ROOT = sdk;

const ndkRoot = path.join(sdk, "ndk");
if (fs.existsSync(ndkRoot)) {
  const preferred = ["27.1.12297006", "26.1.10909125"];
  const installed = fs
    .readdirSync(ndkRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const picked =
    preferred.find((v) => installed.includes(v)) ??
    installed.sort().reverse()[0];
  if (picked) {
    process.env.ANDROID_NDK_HOME = path.join(ndkRoot, picked);
    console.log(`Using NDK: ${picked}`);
  }
}

function patchGradleProperties(androidDir) {
  const gradleProps = path.join(androidDir, "gradle.properties");
  let props = fs.existsSync(gradleProps)
    ? fs.readFileSync(gradleProps, "utf8")
    : "";

  const upsert = (key, value) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    props = re.test(props)
      ? props.replace(re, line)
      : `${props.trimEnd()}\n${line}\n`;
  };

  upsert("reactNativeArchitectures", "arm64-v8a,armeabi-v7a");
  if (process.env.ANDROID_NDK_HOME) {
    upsert("android.ndkVersion", path.basename(process.env.ANDROID_NDK_HOME));
  }

  fs.writeFileSync(gradleProps, props);
}

if (!skipPrebuild) {
  console.log("Generating native Android project (expo prebuild)...");
  run("pnpm", [
    "exec",
    "expo",
    "prebuild",
    "--platform",
    "android",
    "--clean",
    "--no-install",
    "--skip-dependency-update",
    "expo,react,react-native",
  ], { cwd: workRoot });
  run("node", [path.join(__dirname, "sanitize-package-json.cjs")], {
    cwd: workRoot,
  });
}

const androidDir = path.join(workRoot, "android");
patchGradleProperties(androidDir);

const gradlew =
  process.platform === "win32"
    ? path.join(androidDir, "gradlew.bat")
    : path.join(androidDir, "gradlew");

if (!fs.existsSync(gradlew)) {
  console.error("android/gradlew missing — prebuild failed.");
  process.exit(1);
}

if (!isDebug) {
  const keystore = path.join(androidDir, "app", "khadma-release.keystore");
  if (!fs.existsSync(keystore)) {
    console.log("Creating local release keystore...");
    run("keytool", [
      "-genkeypair",
      "-v",
      "-keystore",
      keystore,
      "-alias",
      "khadma",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-storepass",
      "khadma123",
      "-keypass",
      "khadma123",
      "-dname",
      "CN=Khadma, OU=Mobile, O=Khadma, L=Local, ST=Local, C=IL",
    ]);
  }

  const gradleProps = path.join(androidDir, "gradle.properties");
  let props = fs.readFileSync(gradleProps, "utf8");
  if (!props.includes("KHADMA_UPLOAD_STORE_FILE")) {
    props += `
KHADMA_UPLOAD_STORE_FILE=khadma-release.keystore
KHADMA_UPLOAD_KEY_ALIAS=khadma
KHADMA_UPLOAD_STORE_PASSWORD=khadma123
KHADMA_UPLOAD_KEY_PASSWORD=khadma123
`;
    fs.writeFileSync(gradleProps, props);
  }

  run("node", [path.join(__dirname, "patch-android-signing.cjs"), androidDir]);
}

const variant = isDebug ? "assembleDebug" : "assembleRelease";
console.log(`Building APK with Gradle (${variant})...`);
run(
  gradlew,
  [variant, "--no-daemon", "-PreactNativeArchitectures=arm64-v8a,armeabi-v7a"],
  { cwd: androidDir },
);

const apkSub = isDebug ? "debug" : "release";
let apkPath = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "apk",
  apkSub,
  `app-${apkSub}.apk`,
);

if (!fs.existsSync(apkPath)) {
  const apkRoot = path.join(androidDir, "app", "build", "outputs", "apk");
  const findApk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findApk(full);
        if (found) return found;
      } else if (entry.name.endsWith(".apk")) {
        return full;
      }
    }
    return null;
  };
  apkPath = findApk(apkRoot);
}

if (!apkPath || !fs.existsSync(apkPath)) {
  console.error("Build finished but APK not found.");
  process.exit(1);
}

const outDir = path.join(appRoot, "dist");
fs.mkdirSync(outDir, { recursive: true });
const outApk = path.join(outDir, `khadma-${isDebug ? "debug" : "release"}.apk`);
fs.copyFileSync(apkPath, outApk);

console.log("\nAPK ready:");
console.log(`  ${outApk}\n`);
