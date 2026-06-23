# Dry-run: verify API health and auth-proxy (no real order created without token)
$base = "https://khadma-api-server.onrender.com"

Write-Host "1. Health check..."
try {
  $h = Invoke-RestMethod -Uri "$base/api/healthz" -TimeoutSec 60
  Write-Host "   OK: $($h | ConvertTo-Json -Compress)"
} catch {
  Write-Host "   FAIL: $($_.Exception.Message)"
}

Write-Host "2. Auth health..."
try {
  $a = Invoke-RestMethod -Uri "$base/api/healthz/auth" -TimeoutSec 60
  Write-Host "   OK: $($a | ConvertTo-Json -Compress)"
} catch {
  Write-Host "   FAIL: $($_.Exception.Message)"
}

Write-Host "3. Skills catalog (public)..."
try {
  $s = Invoke-RestMethod -Uri "$base/api/skills?status=approved" -TimeoutSec 60
  Write-Host "   OK: $($s.Count) approved skills"
} catch {
  Write-Host "   FAIL: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Full order flow requires a logged-in user token in the app."
Write-Host "Steps: Home -> category -> describe -> GPS -> date -> submit -> offers -> accept -> complete."
