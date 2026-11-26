# TEGEN Market — Avtomatik POS Sinxronizator (`pos-sync`)

Bu papka do'kon kompyuteridagi **Firebird (`D:\SKLAD\Base\Base.FDB`)** bazasidan mahsulot nomi, shtrixkod, narx va qoldiqni **faqat o'qish (Read-Only)** rejimida olib, Telegram Mini App serveriga (**Railway**) avtomatik yuboradi.

> **Xavfsizlik kafolati:**
> - `Base.FDB` bazasiga **HECH QACHON yozmaydi** (faqat `SELECT` + `READ_ONLY` tranzaksiya).
> - Kassa va «Торговля» dasturini sekinlashtirmaydi va qulflamaydi.
> - Mini App ichidagi mahsulot rasmi, kategoriyasi, o'zbekcha nomi, 1–5 ustuvorligi va sotuv tarixiga tegmaydi.

---

## O'rnatish (5 daqiqa)

### 1-qadam: Railway'da maxfiy kalit yaratish
1. [railway.app](https://railway.app) → loyihangiz → **Variables** bo'limini oching.
2. Yangi o'zgaruvchi qo'shing:
   - **Name:** `SYNC_API_KEY`
   - **Value:** istalgan uzun parol (masalan: `tegen_andijan_2026_x9K4mP8q`)
3. Saqlang (server 15–20 soniyada qayta ishga tushadi).
4. Telegram Mini App → **Boshqaruv → Tovarlar → 📥 POS / CSV sinxronlash** bo'limida **🟢 POS API tayyor** yozuvi ko'rinadi va tayyor **API manzil**ni 📋 tugmasi bilan nusxalab olasiz.

### 2-qadam: Do'kon kompyuterida (SKLAD yoki 1-kassa) sozlash
1. Kompyuterga **Node.js LTS** o'rnating (agar yo'q bo'lsa): https://nodejs.org
2. Ushbu `pos-sync` papkasini kompyuterga ko'chiring (masalan: `C:\tegen-pos-sync\`).
3. `config.example.json` faylini nusxalab `config.json` deb nomlang va ichini tahrirlang:
   ```json
   {
     "fbHost": "127.0.0.1",
     "fbPort": 3050,
     "fbDatabase": "D:\\SKLAD\\Base\\Base.FDB",
     "fbUser": "SYSDBA",
     "fbPassword": "masterkey",
     "apiUrl": "https://SIZNING-SAYTINGIZ.up.railway.app",
     "syncApiKey": "RAILWAY_DAGI_KALIT",
     "source": "pos-1kassa",
     "autoActive": true
   }
   ```
   *(Agar skriptni `1-kassa` kompyuterida ishlatsangiz va baza `SKLAD` kompyuterida tursa, `fbHost` ga `SKLAD` kompyuterining lokal IP manzilini yozing, masalan `"192.168.1.10"`, `fbDatabase` esa `"D:\\SKLAD\\Base\\Base.FDB"` qoladi.)*

### 3-qadam: Tekshirish (bazaga yozmaydi!)
- **`1-tekshirish.bat`** faylini 2 marta bosing.
- Skript avtomatik kutubxonani o'rnatadi, `Base.FDB` jadvallarini ko'rsatadi, dastlabki 5 ta mahsulotni ekranga chiqaradi va Railway ulanishini tekshiradi.
- Agar nom/narx/qoldiq to'g'ri chiqsa → 4-qadamga o'ting. (Agar jadval nomi o'zgacha bo'lsa, ekranni rasmga olib yuboring — `sqlQuery` yozib beramiz.)

### 4-qadam: Birinchi sinxronlash va Avto-rejim
1. **`2-sinxronlash.bat`** ni bosib bir marta to'liq sinxronlab ko'ring.
2. Telegram Mini App → **Tovarlar** da oxirgi sinxron vaqti va faol mahsulotlar soni darhol ko'rinadi!
3. **`3-avto-yoqish.bat`** ni bosing — shundan keyin har **10 daqiqada fonda** (qora oyna chiqarmasdan!) narx va qoldiq avtomatik yangilanib turadi.
4. O'chirish kerak bo'lsa **`4-avto-ochirish.bat`** ni bosing.

---

## Foydali fayllar
- `sync.log` — har bir sinxronlash natijasi va vaqti yozib boriladi.
- `config.json` — sizning shaxsiy sozlamalaringiz (GitHub'ga yuklanmaydi).
