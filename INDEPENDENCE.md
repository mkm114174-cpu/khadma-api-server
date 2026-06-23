# Khadma — استقلال كامل بدون Replit

## البنية المستقلة

```
┌─────────────────────────────────────────────────────────────┐
│  جهازك (Windows)                                            │
│  • flutter_app/        → بناء APK العملاء                   │
│  • khadma-admin-app/   → بناء APK الأدمن                    │
│  • artifacts/api-server/ → السيرفر                          │
└────────────────────────────┬────────────────────────────────┘
                             │ git push
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub (مستودعك الخاص) — بديل Replit                       │
└────────────────────────────┬────────────────────────────────┘
                             │ auto deploy
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Render — khadma-api-server.onrender.com                    │
│  السيرفر الوحيد — للتطبيق + الأدمن                          │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Neon DB        Neon Auth       Clerk (أدمن)
```

**لا تحتاج Replit لأي شيء.**

| الخدمة | الدور | البديل عن Replit |
|--------|-------|------------------|
| **GitHub** | تخزين الكود ونشره | بدل Replit كمحرر/مستودع |
| **Render** | السيرفر API | نفسه — تربطه بـ GitHub مباشرة |
| **Neon** | قاعدة البيانات + تسجيل دخول العملاء | نفسه |
| **Clerk** | تسجيل دخول الأدمن | نفسه |
| **جهازك** | بناء APK | بدل بناء Replit |

---

## ما الذي تتخلى عنه؟

| Replit كان يفعل | البديل |
|-----------------|--------|
| استضافة الكود | **GitHub** |
| نشر السيرفر | **Render** ← GitHub مباشرة |
| لوحة أدمن ويب | **تطبيق الأدمن APK** (أو Vercel لاحقاً — اختياري) |
| معاينة Expo | **APK على الهاتف** |

---

## الخطوات — مرة واحدة فقط

### 1. ثبّت Git على Windows

حمّل من: https://git-scm.com/download/win  
أو **GitHub Desktop**: https://desktop.github.com (أسهل)

### 2. أنشئ مستودع على GitHub

1. github.com → **New repository**
2. الاسم مثلاً: `khadma`
3. **Private** إن أردت
4. لا تضف README إن كان عندك مشروع جاهز

### 3. ارفع مشروعك من جهازك

```powershell
cd C:\Users\mix\Downloads\khadma-project

git init
git add .
git commit -m "Khadma full stack — independent from Replit"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/khadma.git
git push -u origin main
```

> استبدل `YOUR_USERNAME` باسمك على GitHub.

### 4. اربط Render بـ GitHub (بدون Replit)

1. [dashboard.render.com](https://dashboard.render.com) → **khadma-api-server**
2. **Settings** → **Build & Deploy**
3. **Repository** → اربط مستودع GitHub الجديد
4. **Branch:** `main`
5. **Root Directory:** اتركه فارغاً (جذر المشروع)
6. **Build Command:** (من `render.yaml`)
   ```
   pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
   ```
7. **Start Command:**
   ```
   node --enable-source-maps artifacts/api-server/dist/index.mjs
   ```

### 5. Environment على Render

```
DATABASE_URL=...
NEON_AUTH_BASE_URL=https://ep-green-brook-aso0ob6f.neonauth.c-4.eu-central-1.aws.neon.tech/neondb/auth
CLERK_SECRET_KEY=sk_test_zMYtEmlFi2saDVrTMRLs8Q9qSh5KH0iVXD7TJxoBaI
CLERK_PUBLISHABLE_KEY=pk_test_Z2xvd2luZy1taW5ub3ctNzguY2xlcmsuYWNjb3VudHMuZGV2JA
NODE_ENV=production
PORT=8080
```

### 6. Deploy

Render → **Manual Deploy** → **Deploy latest commit**

### 7. تحقق

```
https://khadma-api-server.onrender.com/api/healthz/admin
```

يجب: `"clerkConfigured": true`

### 8. التطبيقات — من جهازك فقط

```powershell
# تطبيق العملاء
cd C:\Users\mix\Downloads\khadma-project\flutter_app
flutter build apk --release

# تطبيق الأدمن
cd C:\Users\mix\Downloads\khadma-project\khadma-admin-app
flutter build apk --release --dart-define=API_DOMAIN=khadma-api-server.onrender.com
```

---

## سير العمل اليومي (بعد الإعداد)

```
1. تعدّل الكود على جهازك (Cursor)
2. git add . && git commit -m "..." && git push
3. Render ينشر تلقائياً (أو Manual Deploy)
4. تبني APK عند الحاجة
```

**لا Replit. لا وسيط.**

---

## لوحة الأدمن ويب — هل تحتاجها؟

| الخيار | الوصف |
|--------|-------|
| **APK الأدمن فقط** | كافٍ — `khadma-admin-v1.0.2.apk` |
| **أدمن ويب لاحقاً** | انشر `artifacts/admin` على **Vercel** أو **Netlify** مجاناً |

---

## لماذا لا يعمل الأدمن الآن؟

الكود الجديد على جهازك **لم يُرفع إلى GitHub بعد** — Render ينشر من مصدر قديم (كان Replit).

**الحل:** GitHub + push + Render deploy — مرة واحدة.

---

## ملخص التكاليف (مجاني تقريباً)

| الخدمة | الخطة |
|--------|-------|
| GitHub | مجاني |
| Render | مجاني (قد ينام بعد خمول) |
| Neon | مجاني |
| Clerk | مجاني للتطوير |
| Replit | **0 — لا تستخدمه** |
