# بلّشها — النسخة المجمّعة الحديثة

هذا المستودع يحتوي **نسخة واحدة كاملة** من ملفات بلّشها، بدون مجلدات Bundle أو نسخ مكرّرة من الملفات.

## محتويات المشروع

- `src/`, `public/`, `index.html`, `package.json`: واجهة React + TypeScript وألعاب العرض التجريبي، من النسخة الأصلية `baleshha-main.zip`.
- `.figma/make/`, `vite.config.ts`, `pnpm-lock.yaml`: **إعدادات Figma Make الأصلية** محفوظة، ولم نستبدلها بإعدادات Vite تجريبية.
- `backend/`: أحدث نسخة واحدة من Backend ‏Node.js + Express + TypeScript، مع API، تسجيل دخول، اختبارات، وملفات Neon SQL.
- `backend/migrations/001_initial_schema.sql` و`002_backend_support.sql`: النسخة المعتمدة من ملفات إعداد قاعدة البيانات. حُذفت مسودة SQL الأقدم لتجنب تطبيق نسختين مختلفتين.

## استخدام المشروع داخل Figma Make

استورد **مجلد المشروع كاملًا من الجذر** (أو ملف ZIP المجمّع). لا تنقل ملفات من Bundles قديمة. حافظ على مسارات `src/` و`public/` و`.figma/make/` وعلى ملف `vite.config.ts` الأصلي.

**مهم:** Figma Make يشغّل واجهة React، وليس خادم Express بمجرد نسخ مجلد `backend/`. يحتاج الـBackend إلى تشغيل/استضافة منفصلة ومتغير `DATABASE_URL` سري على الخادم وربط الـFrontend بالـAPI. الواجهة لا تزال تستخدم بيانات وأسئلة تجريبية محلية وليست موصولة بالـBackend، ولم تُطبَّق ترحيلات Neon بعد. لن نضيف بنك الأسئلة الحقيقي إلا عند موافقتك.

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

اقرأ `backend/README.md` قبل تنفيذ الترحيلات أو تشغيل الخادم. لا ترفع كلمات مرور أو روابط اتصال Neon إلى GitHub أو إلى كود المتصفح.

**هذا المستودع للنسخة المجمّعة والتعديلات. لم نعدّل مستودع `HamzaIbrahim123/baleshha` الأصلي.**

مصدر التصميم: https://www.figma.com/design/F8QbCCsYhe27xaDWFygUlK/Untitled?node-id=127-140
