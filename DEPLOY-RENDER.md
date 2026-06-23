# نشر Render — بدون Replit

## المشكلة

Render ينشر من **GitHub** — الكود على جهازك لم يُرفع بعد.

## الحل (3 خطوات)

### 1. GitHub
- أنشئ repo: `khadma`
- ارفع المشروع من `C:\Users\mix\Downloads\khadma-project`

### 2. Render
- اربط الخدمة `khadma-api-server` بالـ repo الجديد
- أضف `CLERK_SECRET_KEY` و `CLERK_PUBLISHABLE_KEY` في Environment
- Deploy

### 3. تحقق
```
https://khadma-api-server.onrender.com/api/healthz/admin
```
→ يجب JSON وليس `Cannot GET`

## الملفات المهمة في السيرفر (موجودة على جهازك)

- `artifacts/api-server/src/routes/adminAuth.ts` — تسجيل دخول الأدمن
- `artifacts/api-server/src/app.ts` — Clerk proxy
- `artifacts/api-server/src/routes/health.ts` — فحص `/healthz/admin`

راجع `INDEPENDENCE.md` للدليل الكامل.
