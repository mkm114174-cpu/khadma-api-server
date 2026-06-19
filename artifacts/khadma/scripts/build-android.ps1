# Build Khadma Android APK via EAS (recommended on Windows)
#
# Prerequisites:
#   1. pnpm install (from repo root)
#   2. Copy .env.example to .env and fill values
#   3. eas login
#   4. If EAS project access fails, run: npx eas-cli init
#
# Usage:
#   .\scripts\build-android.ps1              # internal APK (preview)
#   .\scripts\build-android.ps1 -Production # Play Store AAB

param(
    [switch]$Production
)

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path -Parent $PSScriptRoot
Set-Location $AppRoot

$envFile = Join-Path $AppRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Missing .env — copy .env.example to .env and set:" -ForegroundColor Yellow
    Write-Host "  EXPO_PUBLIC_DOMAIN, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, GOOGLE_MAPS_API_KEY"
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        if ($value) { Set-Item -Path "env:$name" -Value $value }
    }
}

$required = @(
    "EXPO_PUBLIC_DOMAIN",
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "GOOGLE_MAPS_API_KEY"
)
foreach ($key in $required) {
    if (-not (Get-Item "env:$key" -ErrorAction SilentlyContinue)) {
        Write-Host "Missing $key in .env" -ForegroundColor Red
        exit 1
    }
}

$profile = if ($Production) { "production" } else { "preview" }
Write-Host "Starting EAS Android build (profile: $profile)..." -ForegroundColor Cyan

npx eas-cli build --platform android --profile $profile @args
