# Khadma Admin App — تطبيق إدارة المنصة الكامل

تطبيق Flutter **منفصل** عن تطبيق العملاء — صلاحيات أدمن كاملة من الهاتف.

## الأقسام (v1.0.0)

| القسم | الوظيفة |
|-------|---------|
| **لوحة التحكم** | إحصائيات، متصلون الآن، أرباح المنصة |
| **مزودو الخدمة** | مراجعة، قبول/رفض، مستندات، طلب معلومات |
| **الخدمات** | تعديل الأسماء، الصور، الأقسام، اعتماد/رفض |
| **الطلبات** | متابعة، تغيير الحالة، عرض العروض |
| **العمولات** | ربح المنصة، تسجيل تسويات |
| **أداء المزوّدين** | أرباح، تقييم، طلبات مكتملة |
| **المستخدمون** | تفعيل، إيقاف، إغلاق حساب |
| **تواصل معنا** | رسائل + شات الدعم — رد وإغلاق |
| **محادثات** | مراقبة شات العميل ↔ المزوّد |

## التشغيل

```powershell
cd khadma-admin-app
flutter pub get
flutter run `
  --dart-define=API_DOMAIN=khadma-api-server.onrender.com `
  --dart-define=CLERK_PUBLISHABLE_KEY=pk_test_XXXX `
  --dart-define=CLERK_FRONTEND_API=https://YOUR.clerk.accounts.dev
```

## بناء APK

```powershell
flutter build apk --release `
  --dart-define=API_DOMAIN=khadma-api-server.onrender.com `
  --dart-define=CLERK_PUBLISHABLE_KEY=pk_test_XXXX `
  --dart-define=CLERK_FRONTEND_API=https://YOUR.clerk.accounts.dev

copy build\app\outputs\flutter-apk\app-release.apk ..\khadma-admin.apk
```

## تسجيل الدخول

نفس حساب **Clerk** للوحة الويب — `role = admin` في قاعدة البيانات.

## GitHub

```bash
cd khadma-admin-app
git init
git add .
git commit -m "Khadma Admin v1.0.0 — full platform management app"
git remote add origin https://github.com/YOUR/khadma-admin.git
git push -u origin main
```

## متطلبات السيرفر

انشر آخر نسخة من `artifacts/api-server` وتأكد من:
- `CLERK_SECRET_KEY`
- مسارات `/admin/analytics`, `/admin/chat/*`, `/admin/inbox/summary`
