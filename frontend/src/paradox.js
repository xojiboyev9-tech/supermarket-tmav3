/* Pure-JS Paradox 4/5/7 (.DB) reader for Store POS 'Butik.exe' (pokupka.DB / Ostatki.db)
 * Reads the file in 2 MB chunks so 80+ MB files parse safely inside Telegram Mobile WebView. */

const cp1251 = (() => {
  try { return new TextDecoder('windows-1251') } catch { return new TextDecoder('utf-8') }
})()

function readCString(bytes, start, maxLen) {
  let end = start
  const lim = Math.min(bytes.length, start + maxLen)
  while (end < lim && bytes[end] !== 0) end++
  return cp1251.decode(bytes.subarray(start, end)).trim()
}

function readPdxShort(bytes, off) {
  const b0 = bytes[off], b1 = bytes[off + 1]
  if (b0 === 0 && b1 === 0) return null
  const u = ((b0 ^ 0x80) << 8) | b1
  return u >= 0x8000 ? u - 0x10000 : u
}

function readPdxLong(bytes, off) {
  const b0 = bytes[off], b1 = bytes[off + 1], b2 = bytes[off + 2], b3 = bytes[off + 3]
  if ((b0 | b1 | b2 | b3) === 0) return null
  return (((b0 ^ 0x80) << 24) | (b1 << 16) | (b2 << 8) | b3)
}

const dblBuf = new ArrayBuffer(8)
const dblU8 = new Uint8Array(dblBuf)
const dblView = new DataView(dblBuf)

function readPdxDouble(bytes, off) {
  let nz = 0
  for (let i = 0; i < 8; i++) nz |= bytes[off + i]
  if (nz === 0) return null
  if ((bytes[off] & 0x80) !== 0) {
    dblU8[0] = bytes[off] ^ 0x80
    for (let i = 1; i < 8; i++) dblU8[i] = bytes[off + i]
  } else {
    for (let i = 0; i < 8; i++) dblU8[i] = bytes[off + i] ^ 0xFF
  }
  const v = dblView.getFloat64(0, false)
  return Number.isFinite(v) ? v : null
}

function readPdxField(bytes, off, type, size) {
  switch (type) {
    case 0x01: return readCString(bytes, off, size)
    case 0x02: return readPdxLong(bytes, off) // Date (days since 0001-01-01, comparable as integer)
    case 0x03: return readPdxShort(bytes, off)
    case 0x04:
    case 0x16: return readPdxLong(bytes, off)
    case 0x05:
    case 0x06: return readPdxDouble(bytes, off)
    case 0x09: return bytes[off] === 0x81 ? true : (bytes[off] === 0x80 ? false : null)
    case 0x14: return readPdxLong(bytes, off)
    case 0x15: return readPdxDouble(bytes, off)
    default: return null
  }
}

export function parseParadoxHeader(hdrBytes) {
  if (hdrBytes.length < 128) throw new Error("Paradox fayli juda kichik")
  const dv = new DataView(hdrBytes.buffer, hdrBytes.byteOffset, hdrBytes.byteLength)
  const recordSize = dv.getUint16(0x00, true)
  const headerSize = dv.getUint16(0x02, true)
  const fileType = hdrBytes[0x04]
  const maxTableSize = hdrBytes[0x05]
  const numRecords = dv.getUint32(0x06, true)
  const numFields = dv.getUint16(0x21, true)
  const version = hdrBytes[0x39]
  const blockSize = maxTableSize * 1024

  if ((fileType !== 0 && fileType !== 2) || !recordSize || !blockSize || !numFields || numFields > 512) {
    throw new Error("Bu fayl to'g'ri Paradox (.DB) jadvali emas")
  }

  const fieldInfoOff = version >= 5 ? 0x78 : 0x58
  const fields = []
  let recOff = 0
  for (let i = 0; i < numFields; i++) {
    const type = hdrBytes[fieldInfoOff + i * 2]
    const size = hdrBytes[fieldInfoOff + i * 2 + 1]
    fields.push({ name: `F${i}`, type, size, offset: recOff })
    recOff += size
  }

  const tableNameLen = version >= 12 ? 261 : 79
  let pos = fieldInfoOff + numFields * 2 + 4 + numFields * 4 + tableNameLen
  const lim = Math.min(hdrBytes.length, headerSize)
  for (let i = 0; i < numFields && pos < lim; i++) {
    let end = pos
    while (end < lim && hdrBytes[end] !== 0) end++
    const nm = cp1251.decode(hdrBytes.subarray(pos, end)).trim()
    if (nm) fields[i].name = nm
    pos = end + 1
  }

  return { recordSize, headerSize, blockSize, numRecords, numFields, version, fields }
}

const pickField = (fields, patterns) => {
  for (const re of patterns) {
    const f = fields.find(x => re.test(x.name))
    if (f) return f
  }
  return null
}

function normBarcode(raw) {
  if (raw === null || raw === undefined) return ''
  let s = typeof raw === 'number' ? String(Math.round(raw)) : String(raw)
  s = s.trim().replace(/\s+/g, '')
  if (/^0+$/.test(s)) return ''
  return s.slice(0, 64)
}

/**
 * Parse a Paradox .DB File (e.g. pokupka.DB) in 2 MB chunks and aggregate into unique Mini App products.
 * @param {File|Blob} file
 * @param {(pct:number)=>void} [onProgress]
 */
export async function parseParadoxDb(file, onProgress) {
  const probe = new Uint8Array(await file.slice(0, Math.min(file.size, 16384)).arrayBuffer())
  const hdr = parseParadoxHeader(probe)
  const fullHdr = hdr.headerSize > probe.length
    ? parseParadoxHeader(new Uint8Array(await file.slice(0, hdr.headerSize).arrayBuffer()))
    : hdr

  const fName = pickField(fullHdr.fields, [/^NAIMENOVANIE$/i, /^(NAIM|NAME|TOVAR|NOMI)$/i, /(NAIM|NAME|TOVAR)/i])
  const fPrice = pickField(fullHdr.fields, [/^CENAPROD$/i, /^(PRICE_?PROD|PRICE_?ROZN|SELL_?PRICE|PRICE|NARX)$/i, /(CENAPROD|ROZN|SELL|PRICE)/i])
  const fQty = pickField(fullHdr.fields, [/^KOLICHESTVO$/i, /^(OSTATOK|OST|QTY|STOCK|KOL)$/i, /(KOLICH|OSTAT|STOCK|QTY)/i])
  const fSold = pickField(fullHdr.fields, [/^PRODANO$/i, /(PRODAN|SOLD)/i])
  const fSpis = pickField(fullHdr.fields, [/^SPISANO$/i, /(SPISAN)/i])
  const fBc = pickField(fullHdr.fields, [/^SHTRIH$/i, /^(BARCODE|SHKOD|SHTRIHKOD|RSHTRIH|EAN)$/i, /(SHTRIH|BARCODE|SHKOD)/i])
  const fBc2 = pickField(fullHdr.fields, [/^RSHTRIH$/i, /^ZSHTRIH$/i, /^ARTIKUL$/i])
  const fIzm = pickField(fullHdr.fields, [/^IZM$/i, /^(UNIT|ED|EDIZM)$/i])
  const fVesy = pickField(fullHdr.fields, [/^VESY$/i, /^(IS_WEIGHT|VES)$/i])
  const fDate = pickField(fullHdr.fields, [/^DATA_POSTAVKI$/i, /^(DATA|DATE)$/i])

  if (!fName || !fPrice) {
    throw new Error(`Faylda mahsulot nomi yoki sotish narxi ustuni topilmadi (topilganlar: ${fullHdr.fields.slice(0, 8).map(f => f.name).join(', ')})`)
  }

  const dataBytes = Math.max(0, file.size - fullHdr.headerSize)
  const totalBlocks = Math.floor(dataBytes / fullHdr.blockSize)
  const blocksPerChunk = Math.max(1, Math.floor((2 * 1024 * 1024) / fullHdr.blockSize))

  // First pass: stream all blocks, collect per-key aggregates for both stock conventions
  const byKey = new Map()
  let rawRows = 0
  let soldRows = 0
  let soldGtQtyRows = 0

  for (let bIdx = 0; bIdx < totalBlocks; bIdx += blocksPerChunk) {
    const count = Math.min(blocksPerChunk, totalBlocks - bIdx)
    const startByte = fullHdr.headerSize + bIdx * fullHdr.blockSize
    const chunk = new Uint8Array(await file.slice(startByte, startByte + count * fullHdr.blockSize).arrayBuffer())
    const cdv = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)

    for (let j = 0; j < count; j++) {
      const bOff = j * fullHdr.blockSize
      const addDataSize = cdv.getInt16(bOff + 4, true)
      if (addDataSize < 0) continue
      const recCount = Math.floor(addDataSize / fullHdr.recordSize) + 1
      const maxRecs = Math.floor((fullHdr.blockSize - 6) / fullHdr.recordSize)
      const nRec = Math.min(recCount, maxRecs)

      for (let r = 0; r < nRec; r++) {
        const rOff = bOff + 6 + r * fullHdr.recordSize
        rawRows++

        const name = String(readPdxField(chunk, rOff + fName.offset, fName.type, fName.size) || '').trim().slice(0, 120)
        const priceRaw = Number(readPdxField(chunk, rOff + fPrice.offset, fPrice.type, fPrice.size)) || 0
        const price = Math.round(priceRaw)
        let bc = fBc ? normBarcode(readPdxField(chunk, rOff + fBc.offset, fBc.type, fBc.size)) : ''
        if (!bc && fBc2 && fBc2 !== fBc) bc = normBarcode(readPdxField(chunk, rOff + fBc2.offset, fBc2.type, fBc2.size))

        if (!name && !bc) continue

        const qty = fQty ? (Number(readPdxField(chunk, rOff + fQty.offset, fQty.type, fQty.size)) || 0) : null
        const sold = fSold ? (Number(readPdxField(chunk, rOff + fSold.offset, fSold.type, fSold.size)) || 0) : 0
        const spis = fSpis ? (Number(readPdxField(chunk, rOff + fSpis.offset, fSpis.type, fSpis.size)) || 0) : 0
        const dt = fDate ? (Number(readPdxField(chunk, rOff + fDate.offset, fDate.type, fDate.size)) || 0) : 0

        if (qty !== null && sold > 0) {
          soldRows++
          if (sold > qty + 0.01) soldGtQtyRows++
        }

        const izm = fIzm ? String(readPdxField(chunk, rOff + fIzm.offset, fIzm.type, fIzm.size) || '').trim() : ''
        const vesyVal = fVesy ? readPdxField(chunk, rOff + fVesy.offset, fVesy.type, fVesy.size) : null
        const isWeight = Boolean(
          vesyVal === true || (typeof vesyVal === 'number' && vesyVal > 0) ||
          /^(кг|kg|вес|weight)\.?$/i.test(izm) ||
          /(^|[\s.,(\/])(вес|весов|весовой|кг|kg)\.?$/i.test(name)
        )

        const key = bc || name.toLowerCase()
        let entry = byKey.get(key)
        if (!entry) {
          entry = {
            barcode: bc,
            name,
            price: price > 0 ? price : 0,
            unit: isWeight ? 'weight' : 'piece',
            qtySum: 0,
            remSum: 0,
            hasQty: qty !== null,
            lastDt: dt,
            lastOrder: rawRows
          }
          byKey.set(key, entry)
        } else {
          if (!entry.name && name) entry.name = name
          if (!entry.barcode && bc) entry.barcode = bc
          if (isWeight) entry.unit = 'weight'
          if (price > 0 && (dt >= entry.lastDt || entry.price <= 0)) {
            entry.price = price
            entry.lastDt = dt
            entry.lastOrder = rawRows
            if (name) entry.name = name
          }
        }

        if (qty !== null) {
          entry.hasQty = true
          entry.qtySum += Math.max(0, qty)
          entry.remSum += Math.max(0, qty - sold - spis)
        }
      }
    }

    if (onProgress) onProgress(Math.min(99, Math.round(((bIdx + count) / Math.max(1, totalBlocks)) * 100)))
  }

  // Auto-detect whether KOLICHESTVO is already remaining stock or purchased qty (minus PRODANO/SPISANO)
  const qtyIsRemaining = !fSold || (soldRows > 10 && (soldGtQtyRows / soldRows) > 0.02)

  const items = []
  for (const e of byKey.values()) {
    if ((!e.name && !e.barcode) || !(e.price > 0)) continue
    const rawStock = e.hasQty ? (qtyIsRemaining ? e.qtySum : e.remSum) : null
    const stock = rawStock !== null ? Math.max(0, Math.round(rawStock * 1000) / 1000) : null
    items.push({
      barcode: e.barcode,
      name: e.name,
      price: e.price,
      stock,
      unit: e.unit
    })
  }

  if (onProgress) onProgress(100)
  return {
    items,
    meta: {
      rawRows,
      uniqueCount: items.length,
      inStockCount: items.filter(x => x.stock === null || x.stock > 0).length,
      stockMode: qtyIsRemaining ? 'KOLICHESTVO' : 'KOLICHESTVO − PRODANO − SPISANO',
      priceCol: fPrice.name,
      barcodeCol: fBc?.name || ''
    }
  }
}
