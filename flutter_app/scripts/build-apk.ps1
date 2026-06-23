# Build Khadma Flutter APK with env vars from artifacts/khadma/.env
#
# Usage:
#   .\scripts\build-apk.ps1

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path -Parent $PSScriptRoot
$RepoRoot = Split-Path -Parent $AppRoot
$EnvFile = Join-Path $RepoRoot "artifacts\khadma\.env"

function Import-EnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Host "Missing env file: $Path" -ForegroundColor Red
        exit 1
    }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            if ($value) { Set-Item -Path "env:$name" -Value $value }
        }
    }
}

Import-EnvFile $EnvFile

$apiDomain = $env:EXPO_PUBLIC_DOMAIN
$neonAuthUrl = $env:EXPO_PUBLIC_NEON_AUTH_URL
$mapsKey = $env:GOOGLE_MAPS_API_KEY

if (-not $apiDomain) {
    Write-Host "EXPO_PUBLIC_DOMAIN is missing in .env" -ForegroundColor Red
    exit 1
}
if (-not $neonAuthUrl) {
    Write-Host "EXPO_PUBLIC_NEON_AUTH_URL is missing in .env" -ForegroundColor Red
    exit 1
}
if (-not $mapsKey) { $mapsKey = "placeholder" }

Write-Host "API domain:    $apiDomain" -ForegroundColor Cyan
Write-Host "Neon Auth URL: $neonAuthUrl" -ForegroundColor Cyan

$gradleProps = Join-Path $AppRoot "android\gradle.properties"
$propsContent = Get-Content $gradleProps -Raw -ErrorAction SilentlyContinue
if ($propsContent -notmatch "GOOGLE_MAPS_API_KEY=") {
    Add-Content -Path $gradleProps -Value "`nGOOGLE_MAPS_API_KEY=$mapsKey"
} else {
    (Get-Content $gradleProps) -replace 'GOOGLE_MAPS_API_KEY=.*', "GOOGLE_MAPS_API_KEY=$mapsKey" |
        Set-Content $gradleProps
}

$flutter = $env:FLUTTER_BIN
if (-not $flutter) { $flutter = "C:\Users\mix\Downloads\flutter-sdk\bin\flutter.bat" }
if (-not (Test-Path $flutter)) {
    Write-Host "Flutter not found. Set FLUTTER_BIN or install Flutter SDK." -ForegroundColor Red
    exit 1
}

$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = "C:\Users\mix\Downloads\android-sdk" }
$jdkRoot = $env:JAVA_HOME
if (-not $jdkRoot) { $jdkRoot = "C:\Users\mix\Downloads\jdk-17" }

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:JAVA_HOME = $jdkRoot
$env:PATH = "$jdkRoot\bin;$sdkRoot\platform-tools;$env:PATH"
$env:JAVA_TOOL_OPTIONS = "-Djavax.net.ssl.trustStoreType=Windows-ROOT"

Set-Location $AppRoot

& $flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $flutter build apk --release `
    "--dart-define=API_DOMAIN=$apiDomain" `
    "--dart-define=NEON_AUTH_URL=$neonAuthUrl"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$distDir = Join-Path $AppRoot "dist"
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
$outApk = Join-Path $distDir "khadma-release.apk"
Copy-Item (Join-Path $AppRoot "build\app\outputs\flutter-apk\app-release.apk") $outApk -Force

Write-Host ""
Write-Host "APK ready:" -ForegroundColor Green
Write-Host "  $outApk"
Write-Host ""
