#!/usr/bin/env node
'use strict';

/**
 * TEGEN Market — Faqat o'qish (Read-Only) Firebird POS Sinxronizatori
 *
 * Muhim kafolatlar:
 *  - Do'kon bazasiga (Base.FDB) HECH QACHON yozmaydi — faqat ISOLATION_READ_COMMITTED_READ_ONLY + SELECT.
 *  - Mini App'dagi rasm, kategoriya, o'zbekcha nom, 1-5 o'rin va sotuvlarni buzmaydi.
 *  - Rejimlar:
 *      node sync.js --inspect   -> Baza jadvallarini ko'rish + 5 ta namuna + Railway ulanishini tekshirish
 *      node sync.js             -> Barcha tovarlarni bo'lib (batch) Mini App'ga sinxronlash
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const CFG_PATH = path.join(DIR, 'config.json');
const EXAMPLE_PATH = path.join(DIR, 'config.example.json');
const LOG_PATH = path.join(DIR, 'sync.log');
const LOCK_PATH = path.join(DIR, 'sync.lock');
const INSPECT = process.argv.includes('--inspect');

let Firebird;
try {
  Firebird = require('node-firebird');
} catch {
  console.error("XATO: 'node-firebird' o'rnatilmagan. Avval shu papkada 'npm install' bajaring.");
  process.exit(1);
}

const cp1251 = (() => {
  try { return new TextDecoder('windows-1251'); } catch { return null; }
})();
const utf8Fatal = new TextDecoder('utf-8', { fatal: true });

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(msg) {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  try {
    if (fs.existsSync(LOG_PATH) && fs.statSync(LOG_PATH).size > 2 * 1024 * 1024) {
      const tail = fs.readFileSync(LOG_PATH, 'utf8').slice(-200000);
      fs.writeFileSync(LOG_PATH, tail, 'utf8');
    }
    fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
  } catch { /* ignore log errors */ }
}

function decodeVal(val, encoding = 'auto') {
  if (val === null || val === undefined) return '';
  if (Buffer.isBuffer(val)) {
    if (encoding === 'win1251' && cp1251) return cp1251.decode(val).trim();
    if (encoding === 'utf8') return val.toString('utf8').trim();
    try {
      return utf8Fatal.decode(val).trim();
    } catch {
      return (cp1251 ? cp1251.decode(val) : val.toString('latin1')).trim();
    }
  }
  if (typeof val === 'string') return val.trim();
  return String(val).trim();
}

function loadConfig() {
  if (!fs.existsSync(CFG_PATH)) {
    if (fs.existsSync(EXAMPLE_PATH)) {
      fs.copyFileSync(EXAMPLE_PATH, CFG_PATH);
      console.log(`config.json topilmadi — config.example.json dan nusxa olindi:\n  ${CFG_PATH}`);
      console.log("Iltimos, config.json ichiga 'apiUrl' va 'syncApiKey' qiymatlarini yozing.");
    } else {
      throw new Error('config.json topilmadi');
    }
  }
  const raw = fs.readFileSync(CFG_PATH, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function assertReadOnlySql(sql) {
  const clean = String(sql || '').trim();
  if (!/^select\b/i.test(clean)) {
    throw new Error("Xavfsizlik: sqlQuery faqat 'SELECT' bilan boshlanishi shart!");
  }
  if (/\b(insert|update|delete|drop|alter|create|execute|merge|grant|revoke|recreate)\b/i.test(clean)) {
    throw new Error("Xavfsizlik: sqlQuery ichida bazani o'zgartiruvchi buyruq taqiqlangan!");
  }
  return clean;
}

function fbAttach(cfg) {
  const opts = {
    host: cfg.fbHost || '127.0.0.1',
    port: Number(cfg.fbPort) || 3050,
    database: cfg.fbDatabase || 'D:\\SKLAD\\Base\\Base.FDB',
    user: cfg.fbUser || 'SYSDBA',
    password: cfg.fbPassword || 'masterkey',
    lowercase_keys: false,
    pageSize: 4096,
    retryConnectionInterval: 1000
  };
  return new Promise((resolve, reject) => {
    Firebird.attach(opts, (err, db) => (err ? reject(err) : resolve(db)));
  });
}

function fbReadQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    const iso = Firebird.ISOLATION_READ_COMMITTED_READ_ONLY || Firebird.ISOLATION_READ_COMMITTED;
    db.transaction(iso, (tErr, tr) => {
      if (tErr) return reject(tErr);
      tr.query(sql, params, (qErr, rows) => {
        if (qErr) {
          return tr.rollback(() => reject(qErr));
        }
        tr.commit((cErr) => (cErr ? reject(cErr) : resolve(rows || [])));
      });
    });
  });
}

function quoteIdent(name) {
  const s = String(name || '').trim();
  if (/^[A-Z0-9_$]+$/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

async function listSchema(db, enc) {
  const rows = await fbReadQuery(
    db,
    `SELECT TRIM(r.RDB$RELATION_NAME) AS TBL, TRIM(rf.RDB$FIELD_NAME) AS COL
     FROM RDB$RELATIONS r
     JOIN RDB$RELATION_FIELDS rf ON rf.RDB$RELATION_NAME = r.RDB$RELATION_NAME
     WHERE COALESCE(r.RDB$SYSTEM_FLAG, 0) = 0
       AND r.RDB$VIEW_BLR IS NULL
     ORDER BY r.RDB$RELATION_NAME, rf.RDB$FIELD_POSITION`
  );
  const map = new Map();
  for (const r of rows) {
    const t = decodeVal(r.TBL, enc);
    const c = decodeVal(r.COL, enc);
    if (!t || !c) continue;
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(c);
  }
  return map;
}

const COL_PATTERNS = {
  name: [/^(NAME|NAIM|NAIMEN|NAIMENOVANIE|TOVAR|TITLE|GOODS_NAME|TOV_NAME|NOMI|DESCR)$/i, /(NAME|NAIM|TOVAR|TITLE|NOMI)/i],
  price: [/^(PRICE|CENA|PRICE_SELL|PRICE_ROZN|ROZN|SELL_PRICE|PROD_PRICE|CENA_PROD|CENA_ROZN|NARX|SUMMA)$/i, /(PRICE|CENA|ROZN|SELL|NARX)/i],
  stock: [/^(OST|OSTATOK|KOL|KOLVO|QTY|STOCK|COUNT|QUANTITY|QOLDIQ|NALICHIE|BALANCE)$/i, /(OST|KOL|QTY|STOCK|QOLDIQ|NALICH)/i],
  barcode: [/^(BARCODE|SHKOD|SHTRIH|SHTRIHKOD|EAN|EAN13|CODE|KOD|BAR_CODE|ART|ARTIKUL)$/i, /(BARCODE|SHTRIH|SHKOD|EAN|CODE|KOD)/i],
  unit: [/^(UNIT|ED|EDIZM|ED_IZM|MEASURE|VES|IS_WEIGHT)$/i, /(UNIT|ED_?IZM|VES|WEIGHT)/i]
};

function pickCol(cols, patterns) {
  for (const re of patterns) {
    const hit = cols.find((c) => re.test(c));
    if (hit) return hit;
  }
  return null;
}

function detectProductTable(schema, cfg) {
  const customTable = String(cfg.table || '').trim();
  const customCols = cfg.columns || {};
  if (customTable && schema.has(customTable)) {
    const cols = schema.get(customTable);
    return {
      table: customTable,
      cols: {
        name: customCols.name || pickCol(cols, COL_PATTERNS.name),
        price: customCols.price || pickCol(cols, COL_PATTERNS.price),
        stock: customCols.stock || pickCol(cols, COL_PATTERNS.stock),
        barcode: customCols.barcode || pickCol(cols, COL_PATTERNS.barcode),
        unit: customCols.unit || pickCol(cols, COL_PATTERNS.unit)
      }
    };
  }

  let best = null;
  for (const [table, cols] of schema.entries()) {
    const name = pickCol(cols, COL_PATTERNS.name);
    const price = pickCol(cols, COL_PATTERNS.price);
    const stock = pickCol(cols, COL_PATTERNS.stock);
    const barcode = pickCol(cols, COL_PATTERNS.barcode);
    const unit = pickCol(cols, COL_PATTERNS.unit);
    let score = 0;
    if (/(TOVAR|GOOD|PROD|SPRAV|NOMEN|SKLAD|PRICE|ITEM|ART)/i.test(table)) score += 30;
    if (/(LOG|HIST|CHK|CHECK|ZAKAZ|PRODAJ|POKUP|DOC|OPER|USER|KASSA)/i.test(table)) score -= 20;
    if (name) score += 25;
    if (price) score += 25;
    if (stock) score += 15;
    if (barcode) score += 15;
    if (unit) score += 5;
    if (!best || score > best.score) {
      best = { table, score, cols: { name, price, stock, barcode, unit } };
    }
  }
  return best;
}

function normalizeRow(raw, colMap, enc) {
  const get = (key, fallbackKeys) => {
    if (colMap && colMap[key] && raw[colMap[key]] !== undefined) return raw[colMap[key]];
    for (const k of fallbackKeys) {
      if (raw[k] !== undefined) return raw[k];
      const upper = k.toUpperCase();
      if (raw[upper] !== undefined) return raw[upper];
      const lower = k.toLowerCase();
      if (raw[lower] !== undefined) return raw[lower];
    }
    return undefined;
  };

  const name = decodeVal(get('name', ['name', 'NAME', 'NAIM', 'TOVAR']), enc).slice(0, 120);
  const barcode = decodeVal(get('barcode', ['barcode', 'BARCODE', 'SHKOD', 'CODE']), enc).slice(0, 64);
  const rawPrice = get('price', ['price', 'PRICE', 'CENA', 'ROZN']);
  const priceNum = Math.round(Number(String(rawPrice ?? '').replace(',', '.').replace(/[^\d.]/g, '')) || 0);
  const rawStock = get('stock', ['stock', 'STOCK', 'OST', 'OSTATOK', 'QTY']);
  const stockParsed = rawStock === undefined || rawStock === null || rawStock === ''
    ? null
    : Number(String(rawStock).replace(',', '.').replace(/[^\d.-]/g, ''));
  const stock = stockParsed !== null && Number.isFinite(stockParsed) ? Math.max(0, Math.round(stockParsed * 1000) / 1000) : null;
  const rawUnit = decodeVal(get('unit', ['unit', 'UNIT', 'ED', 'EDIZM']), enc);
  const isWeight = /^(weight|kg|кг|вес|весовой|1|true)$/i.test(rawUnit) || /(^|[\s.,(\/])(вес|весов|весовой|кг|kg)\.?$/i.test(name);

  if ((!name && !barcode) || !(priceNum > 0)) return null;
  const item = { barcode, name, price: priceNum, unit: isWeight ? 'weight' : 'piece' };
  if (stock !== null) item.stock = stock;
  return item;
}

async function fetchJson(url, opts, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, opts);
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((res) => setTimeout(res, 3000));
    }
  }
  throw lastErr;
}

async function checkRailway(cfg) {
  const apiUrl = String(cfg.apiUrl || '').replace(/\/+$/, '');
  const key = String(cfg.syncApiKey || '').trim();
  if (!apiUrl || apiUrl.includes('YOUR-RAILWAY-APP') || !key || key === 'YOUR_SYNC_API_KEY') {
    console.log('\n⚠️  Railway API hali sozlanmagan (config.json ichida apiUrl va syncApiKey yozing).');
    return;
  }
  try {
    const res = await fetchJson(`${apiUrl}/api/sync/ping`, {
      method: 'GET',
      headers: { 'X-Sync-Key': key }
    }, 1);
    console.log(`\n✅ Railway Mini App ulanishi OK!`);
    console.log(`   Mini App'da hozir: ${res.totalNow} ta jami · ${res.activeNow} ta faol · ${res.setupNow} ta sozlash kerak`);
    if (res.lastSync?.at) {
      console.log(`   Oxirgi sinxron: ${res.lastSync.at} (${res.lastSync.source || 'pos'})`);
    }
  } catch (e) {
    console.log(`\n❌ Railway ulanish xatosi: ${e.message}`);
  }
}

function acquireLock() {
  if (fs.existsSync(LOCK_PATH)) {
    const age = Date.now() - fs.statSync(LOCK_PATH).mtimeMs;
    if (age < 15 * 60 * 1000) {
      log("Oldingi sinxronizatsiya hali tugamagan (sync.lock bor). O'tkazib yuborildi.");
      process.exit(0);
    }
  }
  fs.writeFileSync(LOCK_PATH, String(process.pid), 'utf8');
}

function releaseLock() {
  try { if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
}

async function main() {
  const cfg = loadConfig();
  const enc = cfg.textEncoding || 'auto';

  if (!INSPECT) acquireLock();
  let db;
  try {
    console.log(`🔌 Firebird bazaga ulanilmoqda (faqat o'qish): ${cfg.fbHost || '127.0.0.1'}:${cfg.fbPort || 3050} -> ${cfg.fbDatabase}`);
    db = await fbAttach(cfg);
    console.log('✅ Firebird baza ochildi (READ-ONLY).');

    const customSql = String(cfg.sqlQuery || '').trim();
    if (INSPECT) {
      const schema = await listSchema(db, enc);
      console.log(`\n📋 Bazada topilgan jadvallar (${schema.size} ta):`);
      for (const [tbl, cols] of schema.entries()) {
        console.log(`  • ${tbl} (${cols.length} ustun): ${cols.slice(0, 12).join(', ')}${cols.length > 12 ? ', ...' : ''}`);
      }

      let sampleSql, colMap = null;
      if (customSql) {
        sampleSql = assertReadOnlySql(customSql);
        console.log('\n🔎 Maxsus sqlQuery ishlatilmoqda...');
      } else {
        const det = detectProductTable(schema, cfg);
        if (!det || !det.cols.name || !det.cols.price) {
          console.log("\n⚠️  Avtomatik mahsulot jadvali aniq topilmadi. Yuqoridagi jadvallar ro'yxatini rasmga olib yuboring!");
        } else {
          colMap = det.cols;
          const selectCols = [det.cols.barcode, det.cols.name, det.cols.price, det.cols.stock, det.cols.unit]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(quoteIdent)
            .join(', ');
          sampleSql = `SELECT FIRST 5 ${selectCols} FROM ${quoteIdent(det.table)}`;
          console.log(`\n🎯 Avto-aniqlangan jadval: ${det.table}`);
          console.log(`   Ustunlar: name=${det.cols.name} | price=${det.cols.price} | stock=${det.cols.stock || '-'} | barcode=${det.cols.barcode || '-'} | unit=${det.cols.unit || '-'}`);
        }
      }

      if (sampleSql) {
        const rows = await fbReadQuery(db, sampleSql);
        console.log(`\n📦 Namuna mahsulotlar (${Math.min(rows.length, 5)} ta):`);
        for (const r of rows.slice(0, 5)) {
          const it = normalizeRow(r, colMap, enc);
          console.log('  ', it || r);
        }
      }

      await checkRailway(cfg);
      return;
    }

    // Normal Sync Mode
    const apiUrl = String(cfg.apiUrl || '').replace(/\/+$/, '');
    const key = String(cfg.syncApiKey || '').trim();
    if (!apiUrl || apiUrl.includes('YOUR-RAILWAY-APP') || !key || key === 'YOUR_SYNC_API_KEY') {
      throw new Error("config.json ichida 'apiUrl' va 'syncApiKey' to'ldirilmagan!");
    }

    let querySql, colMap = null;
    if (customSql) {
      querySql = assertReadOnlySql(customSql);
    } else {
      const schema = await listSchema(db, enc);
      const det = detectProductTable(schema, cfg);
      if (!det || !det.cols.name || !det.cols.price) {
        throw new Error("Mahsulot jadvali avtomatik topilmadi. Avval '1-tekshirish.bat' ni ishga tushiring.");
      }
      colMap = det.cols;
      const selectCols = [det.cols.barcode, det.cols.name, det.cols.price, det.cols.stock, det.cols.unit]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(quoteIdent)
        .join(', ');
      querySql = `SELECT ${selectCols} FROM ${quoteIdent(det.table)}`;
    }

    const rawRows = await fbReadQuery(db, querySql);
    const items = [];
    for (const r of rawRows) {
      const it = normalizeRow(r, colMap, enc);
      if (it) items.push(it);
    }
    log(`Base.FDB dan o'qildi: ${rawRows.length} qator -> yaroqli: ${items.length} ta mahsulot.`);
    if (!items.length) {
      log("Yuboriladigan mahsulot topilmadi — sinxronizatsiya to'xtatildi.");
      return;
    }

    const batchSize = Math.max(200, Math.min(8000, Number(cfg.batchSize) || 4000));
    const runId = `pos_${Date.now().toString(36)}`;
    const tot = { updated: 0, activated: 0, deactivated: 0, created: 0, skipped: 0, activeNow: 0, setupNow: 0 };
    const batches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const chunk = items.slice(i * batchSize, (i + 1) * batchSize);
      const res = await fetchJson(`${apiUrl}/api/sync/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Key': key
        },
        body: JSON.stringify({
          items: chunk,
          autoActive: cfg.autoActive !== false,
          source: cfg.source || 'pos-1kassa',
          runId
        })
      });
      tot.updated += res.updated || 0;
      tot.activated += res.activated || 0;
      tot.deactivated += res.deactivated || 0;
      tot.created += res.created || 0;
      tot.skipped += res.skipped || 0;
      tot.activeNow = res.activeNow ?? tot.activeNow;
      tot.setupNow = res.setupNow ?? tot.setupNow;
      log(`  Partiya ${i + 1}/${batches} (${chunk.length} ta): yangilandi=${res.updated}, yangi=${res.created}`);
    }

    log(`✅ TAYYOR! Jami: ${items.length} | Yangilandi: ${tot.updated} (+${tot.activated} faol / -${tot.deactivated} tugadi) | Yangi: ${tot.created} | Hozir faol: ${tot.activeNow}`);
  } catch (err) {
    log(`❌ XATO: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (db) {
      await new Promise((r) => db.detach(() => r()));
    }
    if (!INSPECT) releaseLock();
  }
}

main();
