# بلّشها — النسخة المجمّعة الحديثة

هذا المستودع يحتوي **نسخة واحدة كاملة** من ملفات بلّشها، بدون مجلدات Bundle أو نسخ مكرّرة من الملفات.

## محتويات المشروع

- `src/`, `public/`, `index.html`, `package.json`: واجهة React + TypeScript وألعاب العرض التجريبي، من النسخة الأصلية `baleshha-main.zip`.
- `.figma/make/`, `vite.config.ts`, `pnpm-lock.yaml`: **إعدادات Figma Make الأصلية** محفوظة، ولم نستبدلها بإعدادات Vite تجريبية.
- `backend/`: أحدث نسخة واحدة من Backend ‏Node.js + Express + TypeScript، مع API، تسجيل دخول، اختبارات، وملفات Neon SQL.
- `backend/migrations/001_initial_schema.sql` و`002_backend_support.sql`: النسخة المعتمدة من ملفات إعداد قاعدة البيانات. حُذفت مسودة SQL الأقدم لتجنب تطبيق نسختين مختلفتين.

## استخدام المشروع داخل Figma Make

استورد **مجلد المشروع كاملًا من الجذر** (أو ملف ZIP المجمّع). لا تنقل ملفات من Bundles قديمة. حافظ على مسارات `src/` و`public/` و`.figma/make/` وعلى ملف `vite.config.ts` الأصلي.

**مهم:** Figma Make يشغّل واجهة React، وليس خادم Express بمجرد نسخ مجلد `backend/`. يحتاج الـBackend إلى تشغيل/استضافة منفصلة ومتغير `DATABASE_URL` سري على الخادم وربط الـFrontend بالـAPI. الواجهة صارت تستخدم الـBackend لتسجيل الحساب عند توفر API شغّالة، لكن بيانات المباريات والأسئلة لا تزال تجريبية ومحلية. تم تطبيق ترحيلات Neon بالفعل. لن نضيف بنك الأسئلة الحقيقي إلا عند موافقتك.

## تشغيل محلي

```bash
# واجهة React
npm install
npm run dev

# الخادم (في طرفية ثانية، بعد إعداد backend/.env سرًّا)
cd backend
npm install
npm run dev
```

اقرأ `backend/README.md` قبل تشغيل الخادم أو إعادة تطبيق الترحيلات. لا ترفع كلمات مرور أو روابط اتصال Neon إلى GitHub أو إلى كود المتصفح.

**هذا المستودع للنسخة المجمّعة والتعديلات. لم نعدّل مستودع `HamzaIbrahim123/baleshha` الأصلي.**

مصدر التصميم: https://www.figma.com/design/F8QbCCsYhe27xaDWFygUlK/Untitled?node-id=127-140


## Neon schema & real account integration (November 15, 2026)

The Neon project `small-bar-10765505` database `baleshha` now has **14 tables**, including `app_users`, `auth_sessions` and `schema_migrations`. Two schema migrations were successfully applied, and four game names seeded. No user account, category, or question data has been inserted by this update.

The browser-only demo account logic has been removed from `src/App.tsx`. The form now calls the Express API via `src/api.ts`; on success, a server-side session authenticates the account. If the backend is not reachable, signup/login fails visibly, without pretending the account is saved. The earlier demo accounts in `localStorage` are not migrated automatically. Current match/seen-question demo state still stays local until the question-bank phase.

### What must be running

- **Backend server:** an HTTPS-hosted Node.js server implementing `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` and using private `DATABASE_URL` for the live Neon database. See `backend/README.md`. This code is not automatically executed by Figma Make.
- **Frontend same-origin proxy:** browsers need session cookies on the *same site*. Locally, Vite proxies `/api` to `http://localhost:4000` (override with `BALESHHA_API_PROXY_TARGET`). In a deployed site, configure the hosting provider to forward `/api/*` to the backend on HTTPS. `VITE_API_BASE_URL` is available for same-site setups where a separate API origin is supported, but using a different third-party domain may block session cookies.
- **Never put `DATABASE_URL` inside Figma Make, React code, a public repository, or client-visible environment variables.** Only the backend holds database credentials.

**Deployment status:** Database schema is live; backend service is NOT deployed and frontend live signup cannot be considered verified until API deployment and an end-to-end registration/login test are completed.
