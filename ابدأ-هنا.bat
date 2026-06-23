@echo off
chcp 65001 >nul
title خدما — رفع المشروع (أسهل طريقة)
color 0A

echo.
echo  ═══════════════════════════════════════════════════════
echo    خدما — أسهل طريقة (بدون أوامر معقدة)
echo  ═══════════════════════════════════════════════════════
echo.
echo  الخطوة 1: ثبّت GitHub Desktop (مرة واحدة فقط)
echo  ─────────────────────────────────────────────────────
echo    اضغط أي مفتاح لفتح صفحة التحميل...
pause >nul
start https://desktop.github.com

echo.
echo  بعد التثبيت وتسجيل الدخول، اضغط أي مفتاح للمتابعة...
pause >nul

echo.
echo  الخطوة 2: إضافة المشروع
echo  ─────────────────────────────────────────────────────
echo    سأفتح GitHub Desktop الآن...
echo.
echo    في البرنامج:
echo      • File  ثم  Add local repository
echo      • اختر:  C:\Users\mix\Downloads\khadma-project
echo      • Add repository
echo.
pause
start "" "%LOCALAPPDATA%\GitHubDesktop\GitHubDesktop.exe" 2>nul
if errorlevel 1 start "" "C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\GitHubDesktop.exe" 2>nul

echo.
echo  الخطوة 3: رفع المشروع على الإنترنت
echo  ─────────────────────────────────────────────────────
echo    في GitHub Desktop:
echo      • اضغط  Publish repository  (أعلى اليمين)
echo      • الاسم:  khadma
echo      • فعّل  Keep this code private
echo      • Publish repository
echo.
echo  ═══════════════════════════════════════════════════════
echo    بعد النشر — أخبرني: تم الرفع
echo    وسأكمل معك خطوة Render (نقرة واحدة)
echo  ═══════════════════════════════════════════════════════
echo.
pause
