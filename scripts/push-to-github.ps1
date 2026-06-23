# رفع المشروع إلى GitHub — شغّل هذا الملف مرة واحدة
# بعد إنشاء مستودع فارغ على github.com باسم khadma

param(
    [Parameter(Mandatory = $true)]
    [string]$GitHubUsername
)

$git = "C:\Program Files\Git\bin\git.exe"
$project = "C:\Users\mix\Downloads\khadma-project"

if (-not (Test-Path $git)) {
    Write-Host "Git غير مثبت. حمّل من: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Set-Location $project

if (-not (Test-Path ".git")) {
    & $git init
    & $git branch -M main
}

& $git add .
& $git commit -m "Khadma — independent stack (API admin login + Flutter apps)" --allow-empty 2>$null
$status = & $git status --porcelain
if ($status) {
    & $git add .
    & $git commit -m "Khadma — independent stack (API admin login + Flutter apps)"
}

$remote = "https://github.com/$GitHubUsername/khadma.git"
$existing = & $git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    & $git remote add origin $remote
} else {
    & $git remote set-url origin $remote
}

Write-Host ""
Write-Host "جاري الرفع إلى: $remote" -ForegroundColor Yellow
Write-Host "قد يُطلب منك تسجيل دخول GitHub..." -ForegroundColor Yellow
Write-Host ""

& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "تم الرفع بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "الخطوة التالية على Render:" -ForegroundColor Cyan
    Write-Host "1. dashboard.render.com -> khadma-api-server -> Settings"
    Write-Host "2. Repository -> اربط $GitHubUsername/khadma"
    Write-Host "3. Environment -> اضف CLERK_SECRET_KEY"
    Write-Host "4. Manual Deploy -> Deploy latest commit"
    Write-Host "5. تحقق: https://khadma-api-server.onrender.com/api/healthz/admin"
} else {
    Write-Host ""
    Write-Host "فشل الرفع. جرّب GitHub Desktop بدلاً:" -ForegroundColor Red
    Write-Host "1. File -> Add local repository -> $project"
    Write-Host "2. Publish repository"
}
