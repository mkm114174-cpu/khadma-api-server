@echo off
chcp 65001 >nul
title خدما — نقرة واحدة على Render
color 1F
mode con: cols=70 lines=35

echo.
echo   ╔══════════════════════════════════════════════════════════╗
echo   ║          خدما — بقي عليك 3 نقرات فقط                    ║
echo   ╚══════════════════════════════════════════════════════════╝
echo.
echo   GitHub عندك جاهز ✅
echo   الكود عندك جاهز ✅
echo   بقي ربط Render فقط
echo.
echo   ══════════════════════════════════════════════════════════
echo   سأفتح 3 صفحات — اتبع الرقم على كل صفحة:
echo   ══════════════════════════════════════════════════════════
echo.
pause

echo.
echo   [صفحة 1] صلاحيات GitHub لـ Render
echo   ─────────────────────────────────────
echo   • ابحث عن "Render" في القائمة
echo   • اضغط Configure
echo   • اختر "All repositories" أو "khadma-project"
echo   • Save
echo.
start https://github.com/settings/installations
pause

echo.
echo   [صفحة 2] Render — اربط المشروع
echo   ─────────────────────────────────────
echo   • اضغط khadma-api-server
echo   • Settings (يسار)
echo   • Repository → Edit
echo   • اختر: mkm114174-cpu / khadma-project
echo   • Branch: main
echo   • Save Changes
echo.
start https://dashboard.render.com
pause

echo.
echo   [صفحة 3] انشر
echo   ─────────────────────────────────────
echo   • Manual Deploy (أعلى)
echo   • Deploy latest commit
echo   • انتظر 5 دقائق
echo.
start https://dashboard.render.com
pause

echo.
echo   [تحقق] افتح هذا الرابط في المتصفح:
start https://khadma-api-server.onrender.com/api/healthz/admin
echo.
echo   إذا ظهر JSON = نجح ✅
echo   إذا Cannot GET = أرسل لي لقطة شاشة
echo.
pause
