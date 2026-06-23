# Build Khadma Android APK locally with Gradle (no EAS / no Expo cloud).
#
# Prerequisites: JDK 17+, Android SDK, pnpm install from repo root.
#
# Usage:
#   .\scripts\build-android.ps1           # release APK (local keystore)
#   .\scripts\build-android.ps1 -Debug    # debug APK (fastest)

param(
    [switch]$Debug,
    [switch]$SkipPrebuild
)

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path -Parent $PSScriptRoot
Set-Location $AppRoot

function Import-EnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            if ($value) { Set-Item -Path "env:$name" -Value $value }
        }
    }
}

Import-EnvFile (Join-Path $AppRoot ".env")

if (-not $env:EXPO_PUBLIC_DOMAIN) { $env:EXPO_PUBLIC_DOMAIN = "localhost" }
if (-not $env:EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    $env:EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_placeholder"
}
if (-not $env:GOOGLE_MAPS_API_KEY) { $env:GOOGLE_MAPS_API_KEY = "placeholder" }

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }
if (-not (Test-Path $sdk)) {
    Write-Host "Android SDK not found. Install Android Studio or set ANDROID_HOME." -ForegroundColor Red
    exit 1
}
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

$ndkDir = Join-Path $sdk "ndk"
if (Test-Path $ndkDir) {
    $ndkVersion = Get-ChildItem $ndkDir -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if ($ndkVersion) {
        $env:ANDROID_NDK_HOME = $ndkVersion.FullName
        Write-Host "Using NDK: $($ndkVersion.Name)"
    }
}

if (-not $SkipPrebuild) {
    Write-Host "Generating native Android project (expo prebuild)..." -ForegroundColor Cyan
    pnpm exec expo prebuild --platform android --clean --skip-dependency-update
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$androidDir = Join-Path $AppRoot "android"
$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "android/gradlew.bat missing — prebuild failed." -ForegroundColor Red
    exit 1
}

$variant = if ($Debug) { "assembleDebug" } else { "assembleRelease" }

if (-not $Debug) {
    $keystore = Join-Path $AppRoot "android\app\khadma-release.keystore"
    if (-not (Test-Path $keystore)) {
        Write-Host "Creating local release keystore..." -ForegroundColor Cyan
        $keytool = "keytool"
        if ($env:JAVA_HOME) {
            $candidate = Join-Path $env:JAVA_HOME "bin\keytool.exe"
            if (Test-Path $candidate) { $keytool = $candidate }
        }
        & $keytool -genkeypair -v -keystore $keystore -alias khadma `
            -keyalg RSA -keysize 2048 -validity 10000 `
            -storepass khadma123 -keypass khadma123 `
            -dname "CN=Khadma, OU=Mobile, O=Khadma, L=Local, ST=Local, C=IL"
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    $gradleProps = Join-Path $androidDir "gradle.properties"
    $lines = @(
        "",
        "KHADMA_UPLOAD_STORE_FILE=khadma-release.keystore",
        "KHADMA_UPLOAD_KEY_ALIAS=khadma",
        "KHADMA_UPLOAD_STORE_PASSWORD=khadma123",
        "KHADMA_UPLOAD_KEY_PASSWORD=khadma123"
    )
    $existing = Get-Content $gradleProps -Raw -ErrorAction SilentlyContinue
    if ($existing -notmatch "KHADMA_UPLOAD_STORE_FILE") {
        Add-Content -Path $gradleProps -Value ($lines -join "`n")
    }

    node (Join-Path $PSScriptRoot "patch-android-signing.cjs") $androidDir
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Building APK with Gradle ($variant)..." -ForegroundColor Cyan
Push-Location $androidDir
try {
    & .\gradlew.bat $variant --no-daemon "-PreactNativeArchitectures=arm64-v8a,armeabi-v7a"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

$apkSub = if ($Debug) { "debug" } else { "release" }
$apkPath = Join-Path $androidDir "app\build\outputs\apk\$apkSub\app-$apkSub.apk"
if (-not (Test-Path $apkPath)) {
    $found = Get-ChildItem -Path (Join-Path $androidDir "app\build\outputs\apk") -Filter "*.apk" -Recurse |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($found) { $apkPath = $found.FullName }
}

if (-not (Test-Path $apkPath)) {
    Write-Host "Build finished but APK not found." -ForegroundColor Red
    exit 1
}

$outDir = Join-Path $AppRoot "dist"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$suffix = if ($Debug) { "debug" } else { "release" }
$outApk = Join-Path $outDir ("khadma-{0}.apk" -f $suffix)
Copy-Item $apkPath $outApk -Force

Write-Host ""
Write-Host "APK ready:" -ForegroundColor Green
Write-Host ("  " + $outApk)
Write-Host ""
