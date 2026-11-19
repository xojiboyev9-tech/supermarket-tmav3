# Supermarket Telegram Mini App v3 (backend + frontend)

Yangi: qizil zamonaviy dizayn (do'kon, boshqaruv paneli, audit), Railway sozlamalari, Telegram `initData` (HMAC) autentifikatsiya, narx serverda hisoblanadi, PostgreSQL, webhook,
og'irlik bo'yicha tovar (mijoz tasdig'i), yetkazib berish qoidalari (summa + km), ombor (faqat Super Admin yoqadi), audit.

## Railway'ga ulash
1. GitHub'ga yuklang (`.env` yuklanmaydi). Railway → New Project → **Deploy from GitHub repo**.
2. Loyihaga **PostgreSQL** qo'shing (Add → Database → PostgreSQL).
3. **Backend servisi**: Settings → Root Directory = `backend`. Variables:
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `BOT_TOKEN`, `SUPER_ADMIN_ID`, `WEBHOOK_SECRET` (uzun tasodifiy matn),
   `WEBAPP_URL` (frontend manzili), `PUBLIC_URL` (backendning Railway manzili, `https://...up.railway.app`). Networking → Generate Domain.
4. **Frontend servisi** (xuddi shu repodan yana bir servis): Root Directory = `frontend`, Variables: `VITE_API_URL` = backend manzili.
   Build: `npm install && npm run build`, Start: `npm start`. Generate Domain, so'ng uni backenddagi `WEBAPP_URL`ga qo'ying.
5. BotFather: /setmenubutton yoki Mini App URL = frontend manzili. Botga /start bosing — birinchi Super Admin `SUPER_ADMIN_ID` bo'ladi.

## Asosiy qoidalar
- Og'irlikli tovar: mijoz summa kiritadi (20 000), admin tortgach haqiqiy summani kiritadi (`POST /api/orders/:id/weigh`);
  narx o'zgarsa mijozga botda "Roziman / Bekor" so'rovi boradi.
- Yetkazib berish: `PUT /api/settings/delivery` — `rules: [{minTotal, maxKm, fee}]`, `baseFee`, `maxKm`, do'kon koordinatasi. Faqat savat darajasida hisoblanadi.
- Ombor: `PUT /api/settings/warehouse` faqat `superadmin`. O'chiq bo'lsa qoldiq tekshirilmaydi.
- Audit: `GET /api/audit`, statistika: `GET /api/stats`.
