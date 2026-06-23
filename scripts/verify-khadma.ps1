# Verify Khadma API + Neon deployment
$ErrorActionPreference = "Continue"
$Api = "https://khadma-api-server.onrender.com"
$NeonAuth = "https://ep-green-brook-aso0ob6f.neonauth.c-4.eu-central-1.aws.neon.tech/neondb/auth"

Write-Host "=== Khadma deployment check ===" -ForegroundColor Cyan

function Test-Endpoint($name, $url, $expectStatus = 200) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 90
        $ok = $r.StatusCode -eq $expectStatus
        $color = if ($ok) { "Green" } else { "Yellow" }
        Write-Host "[$name] $($r.StatusCode) OK" -ForegroundColor $color
        if ($r.Content.Length -lt 500) { Write-Host "  $($r.Content)" }
        return $ok
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($status -eq $expectStatus) {
            Write-Host "[$name] $status OK (expected)" -ForegroundColor Green
            return $true
        }
        Write-Host "[$name] FAIL status=$status (expected $expectStatus)" -ForegroundColor Red
        return $false
    }
}

function Test-AuthProxy($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 90
        $code = $r.StatusCode
        if ($code -eq 404) {
            Write-Host "[Auth proxy] FAIL 404 — route not deployed on Render" -ForegroundColor Red
            return $false
        }
        if ($code -eq 200 -or $code -eq 401) {
            Write-Host "[Auth proxy] $code OK" -ForegroundColor Green
            return $true
        }
        Write-Host "[Auth proxy] $code unexpected" -ForegroundColor Yellow
        return $true
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        if ($status -eq 404) {
            Write-Host "[Auth proxy] FAIL 404 — route not deployed on Render" -ForegroundColor Red
            return $false
        }
        if ($status -eq 401 -or $status -eq 200) {
            Write-Host "[Auth proxy] $status OK" -ForegroundColor Green
            return $true
        }
        Write-Host "[Auth proxy] FAIL status=$status" -ForegroundColor Red
        return $false
    }
}

$results = @()
$results += Test-Endpoint "API health" "$Api/api/healthz"
$results += Test-Endpoint "API skills (DB)" "$Api/api/skills"
$results += Test-Endpoint "Neon JWKS" "$NeonAuth/.well-known/jwks.json"
$results += Test-Endpoint "API auth config" "$Api/api/healthz/auth" 200
$results += Test-AuthProxy "$Api/api/auth-proxy/get-session"
$results += Test-Endpoint "Users/me no token" "$Api/api/users/me" 401

$passed = ($results | Where-Object { $_ }).Count
$total = $results.Count
Write-Host ""
Write-Host "Passed $passed / $total checks" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if (-not (Test-AuthProxy "$Api/api/auth-proxy/get-session")) {
    Write-Host ""
    Write-Host "ACTION REQUIRED (OTP 403 fix):" -ForegroundColor Yellow
    Write-Host "  1. Push latest api-server code to GitHub (authProxy.ts + routes/index.ts)"
    Write-Host "  2. Render -> Manual Deploy -> Deploy latest commit"
    Write-Host "  3. Re-run until Auth proxy is NOT 404"
}

if (-not (Test-Endpoint "API auth config" "$Api/api/healthz/auth" 200)) {
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "  1. Set NEON_AUTH_BASE_URL on Render (see README.md)"
    Write-Host "  2. Redeploy API with latest code (JWT issuer fix)"
    Write-Host "  3. Re-run this script until healthz/auth returns 200"
}
