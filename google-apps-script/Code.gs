// ====================================================================
// GOOGLE APPS SCRIPT - Backend API untuk Sistem Gudang (HIGH PERFORMANCE)
// Dioptimalkan khusus untuk 1000+ baris data dengan multi-level caching
// dan pemrosesan batch 2D array.
// Ganti SPREADSHEET_ID dengan ID spreadsheet Anda
// Deploy sebagai Web App: Execute as Me, Anyone can access
// ====================================================================

const SPREADSHEET_ID = '1untQngUk1uq3h6ypKJdThNFUk8OcKZyQTb8CpTirrKs';

const SHEET_NAMES = {
  USERS: 'tbl_users',
  MASTER_MATERIAL: 'tbl_master_material',
  BARANG: 'tbl_barang',
  BARANG_DETAILS: 'tbl_barang_details'
};

// ====================================================================
// SPREADSHEET SINGLETON & CACHE HELPERS
// ====================================================================

var _cachedSpreadsheet = null;

/**
 * Get spreadsheet reference with request memoization (opened only once)
 */
function getSpreadsheet() {
  if (!_cachedSpreadsheet) {
    _cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return _cachedSpreadsheet;
}

/**
 * Get sheet by name, throws if not found
 */
function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" tidak ditemukan. Pastikan sheet sudah dibuat.');
  }
  return sheet;
}

// 90KB chunk size to be safely under Apps Script CacheService 100KB limit
const CACHE_CHUNK_SIZE = 90000;

/**
 * Save large content string into CacheService using chunking
 * @param {string} key - Cache key
 * @param {string} contentStr - Stringified JSON to cache
 * @param {number} [ttlSeconds=1800] - Time to live in seconds (default 30 min)
 */
function putLargeCache(key, contentStr, ttlSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    if (!contentStr) return;
    ttlSeconds = ttlSeconds || 1800; // default 30 menit

    var totalLength = contentStr.length;
    var numChunks = Math.ceil(totalLength / CACHE_CHUNK_SIZE);

    var chunksMap = {};
    chunksMap[key + '_meta'] = JSON.stringify({ count: numChunks, updated: new Date().getTime() });

    for (var i = 0; i < numChunks; i++) {
      var start = i * CACHE_CHUNK_SIZE;
      chunksMap[key + '_' + i] = contentStr.substring(start, start + CACHE_CHUNK_SIZE);
    }

    cache.putAll(chunksMap, ttlSeconds);
  } catch (e) {
    Logger.log('putLargeCache error: ' + e.message);
  }
}

/**
 * Retrieve large content string from CacheService
 * @param {string} key - Cache key
 * @returns {string|null} - Combined string or null if cache miss
 */
function getLargeCache(key) {
  try {
    var cache = CacheService.getScriptCache();
    var metaStr = cache.get(key + '_meta');
    if (!metaStr) return null;

    var meta = JSON.parse(metaStr);
    var count = meta.count || 0;
    if (count === 0) return null;

    var keys = [];
    for (var i = 0; i < count; i++) {
      keys.push(key + '_' + i);
    }

    var chunksMap = cache.getAll(keys);
    var fullStr = '';
    for (var j = 0; j < count; j++) {
      var chunk = chunksMap[key + '_' + j];
      if (chunk === undefined || chunk === null) {
        return null; // Missing chunk, cache invalid
      }
      fullStr += chunk;
    }
    return fullStr;
  } catch (e) {
    Logger.log('getLargeCache error: ' + e.message);
    return null;
  }
}

/**
 * Clear cached keys from CacheService
 * @param {string|string[]} keys - Key or array of keys to clear
 */
function clearLargeCache(keys) {
  try {
    var cache = CacheService.getScriptCache();
    if (!Array.isArray(keys)) keys = [keys];

    var allKeysToRemove = [];
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      allKeysToRemove.push(key);
      allKeysToRemove.push(key + '_meta');
      for (var c = 0; c < 25; c++) {
        allKeysToRemove.push(key + '_' + c);
      }
    }
    cache.removeAll(allKeysToRemove);
  } catch (e) {
    Logger.log('clearLargeCache error: ' + e.message);
  }
}

/**
 * Fast date formatter: avoids repeated expensive Date conversions
 */
function fastFormatDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Date && !isNaN(val.getTime())) {
    var y = val.getFullYear();
    var m = val.getMonth() + 1;
    var d = val.getDate();
    var hh = val.getHours();
    var mm = val.getMinutes();
    var ss = val.getSeconds();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d) + ' ' +
           (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
  }
  return String(val);
}

/**
 * Create JSON response from object
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create JSON response directly from pre-serialized string (Fastest!)
 */
function jsonResponseRaw(rawJsonString) {
  return ContentService
    .createTextOutput(rawJsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Read all data from a sheet and return as array of objects (generic fallback)
 */
function readSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol === 0) return [];

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) {
        val = fastFormatDate(val);
      }
      obj[headers[j]] = val;
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * Get 0-based column index by header name
 */
function getColumnIndex(sheet, headerName) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return -1;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === headerName) return i;
  }
  return -1;
}

/**
 * Optimized getNextId: reads ONLY 1 cell or 1 column, NOT the whole table
 */
function getNextId(sheetName, idColumn) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;

  var colIdx = getColumnIndex(sheet, idColumn);
  if (colIdx === -1) return lastRow;

  // Cek nilai baris terakhir (umumnya ID terbesar karena appendRow berurutan)
  var lastVal = parseInt(sheet.getRange(lastRow, colIdx + 1).getValue(), 10);
  if (!isNaN(lastVal) && lastVal > 0) {
    return lastVal + 1;
  }

  // Jika bukan angka (misal teracak), baca hanya kolom ID tersebut
  var colValues = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
  var maxId = 0;
  for (var i = 0; i < colValues.length; i++) {
    var val = parseInt(colValues[i][0], 10);
    if (!isNaN(val) && val > maxId) {
      maxId = val;
    }
  }
  return maxId + 1;
}

/**
 * Find 1-based row index matching value in colIndex
 */
function findRowIndex(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var data = sheet.getRange(1, colIndex + 1, lastRow, 1).getValues();
  var targetVal = String(value).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === targetVal) {
      return i + 1;
    }
  }
  return -1;
}

// ====================================================================
// ROUTE HANDLERS - doGet & doPost
// ====================================================================

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  var forceRefresh = (e && e.parameter && (e.parameter.refresh === '1' || e.parameter.refresh === 'true'));

  try {
    switch (action) {
      case 'get_stock':
        return handleGetStock(forceRefresh);
      case 'get_master_material':
        return handleGetMasterMaterial((e.parameter && e.parameter.q) || '', forceRefresh);
      case 'get_mutasi_barang':
        return handleGetMutasiBarang(forceRefresh);
      case 'clear_cache':
        clearLargeCache(['cache_get_stock', 'cache_get_mutasi_barang', 'cache_master_materials_list']);
        return jsonResponse({ success: true, message: 'Semua cache berhasil dibersihkan' });
      case 'fix_swapped_barang':
        return handleFixSwappedBarang();
      case 'ping':
        return jsonResponse({ success: true, message: 'API is running' });
      default:
        return jsonResponse({ success: false, message: 'Action tidak dikenali: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server Error: ' + err.message });
  }
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Invalid JSON body' });
  }

  var action = body.action || (e && e.parameter && e.parameter.action) || '';

  try {
    switch (action) {
      case 'login':
        return handleLogin(body);
      case 'insert_barang':
        return handleInsertBarang(body);
      case 'insert_barang_detail':
        return handleInsertBarangDetail(body);
      case 'fix_swapped_barang':
        return handleFixSwappedBarang();
      default:
        return jsonResponse({ success: false, message: 'Action tidak dikenali: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Server Error: ' + err.message });
  }
}

// ====================================================================
// HANDLER: LOGIN
// ====================================================================

function handleLogin(body) {
  var username = String(body.username || '').trim();
  var password = String(body.password || '').trim();

  if (!username || !password) {
    return jsonResponse({ success: false, message: 'Username dan password harus diisi' });
  }

  var users = readSheetData(SHEET_NAMES.USERS);
  var user = null;

  for (var i = 0; i < users.length; i++) {
    if (String(users[i].username).trim() === username) {
      user = users[i];
      break;
    }
  }

  if (!user) {
    return jsonResponse({ success: false, message: 'Username tidak ditemukan' });
  }

  if (String(user.password).trim() !== password) {
    return jsonResponse({ success: false, message: 'Password salah' });
  }

  var token = Utilities.getUuid();

  var inputMasuk = (user.input_barang_masuk === true) ||
    (String(user.input_barang_masuk).toUpperCase() === 'TRUE') ||
    (user.input_barang_masuk === 1);

  var inputKeluar = (user.input_barang_keluar === true) ||
    (String(user.input_barang_keluar).toUpperCase() === 'TRUE') ||
    (user.input_barang_keluar === 1);

  return jsonResponse({
    success: true,
    message: 'Login berhasil',
    token: token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      akses: {
        inputMasuk: inputMasuk,
        inputKeluar: inputKeluar
      }
    }
  });
}

// ====================================================================
// HANDLER: GET STOCK (HIGH PERFORMANCE with CacheService & 2D Array)
// ====================================================================

function handleGetStock(forceRefresh) {
  var cacheKey = 'cache_get_stock';

  if (!forceRefresh) {
    var cached = getLargeCache(cacheKey);
    if (cached) {
      return jsonResponseRaw(cached);
    }
  }

  var sheet = getSheet(SHEET_NAMES.MASTER_MATERIAL);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol === 0) {
    var emptyRes = JSON.stringify([]);
    putLargeCache(cacheKey, emptyRes, 1800);
    return jsonResponseRaw(emptyRes);
  }

  // Fast single batch read
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];

  var colNomer = -1, colNama = -1, colSatuan = -1, colStok = -1;
  for (var h = 0; h < headers.length; h++) {
    var header = String(headers[h]).trim();
    if (header === 'nomer_material') colNomer = h;
    else if (header === 'nama_material') colNama = h;
    else if (header === 'satuan') colSatuan = h;
    else if (header === 'stok') colStok = h;
  }

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    result.push({
      nomer_material: colNomer !== -1 ? String(row[colNomer] || '') : '',
      nama_material: colNama !== -1 ? String(row[colNama] || '') : '',
      satuan: colSatuan !== -1 ? String(row[colSatuan] || '') : '',
      stok: colStok !== -1 ? (parseFloat(row[colStok]) || 0) : 0
    });
  }

  // Sort by nomer_material ASC
  result.sort(function(a, b) {
    return a.nomer_material.localeCompare(b.nomer_material);
  });

  var jsonStr = JSON.stringify(result);
  putLargeCache(cacheKey, jsonStr, 1800); // Cache 30 menit

  return jsonResponseRaw(jsonStr);
}

// ====================================================================
// HANDLER: GET MASTER MATERIAL (Search with Cached Index)
// ====================================================================

function handleGetMasterMaterial(query, forceRefresh) {
  if (!query || query.trim() === '') {
    return jsonResponse([]);
  }

  var searchTerm = query.toLowerCase().trim();
  var cacheKey = 'cache_master_materials_list';
  var materialsList = null;

  if (!forceRefresh) {
    var cached = getLargeCache(cacheKey);
    if (cached) {
      try {
        materialsList = JSON.parse(cached);
      } catch (e) {}
    }
  }

  if (!materialsList) {
    var sheet = getSheet(SHEET_NAMES.MASTER_MATERIAL);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow <= 1 || lastCol === 0) {
      return jsonResponse([]);
    }

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0];
    var colNomer = -1, colNama = -1, colSatuan = -1;

    for (var h = 0; h < headers.length; h++) {
      var header = String(headers[h]).trim();
      if (header === 'nomer_material') colNomer = h;
      else if (header === 'nama_material') colNama = h;
      else if (header === 'satuan') colSatuan = h;
    }

    materialsList = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var nomer = colNomer !== -1 ? String(row[colNomer] || '') : '';
      var nama = colNama !== -1 ? String(row[colNama] || '') : '';
      if (nomer || nama) {
        materialsList.push({
          nomer_material: nomer,
          nama_material: nama,
          satuan: colSatuan !== -1 ? String(row[colSatuan] || '') : ''
        });
      }
    }

    putLargeCache(cacheKey, JSON.stringify(materialsList), 3600); // Cache 1 jam
  }

  // Filter with limit 10
  var filtered = [];
  for (var j = 0; j < materialsList.length && filtered.length < 10; j++) {
    var item = materialsList[j];
    var nomerLower = item.nomer_material.toLowerCase();
    var namaLower = item.nama_material.toLowerCase();
    if (nomerLower.indexOf(searchTerm) !== -1 || namaLower.indexOf(searchTerm) !== -1) {
      filtered.push(item);
    }
  }

  return jsonResponse(filtered);
}

// ====================================================================
// HANDLER: GET MUTASI BARANG (HIGH PERFORMANCE with Cache & 2D Arrays)
// ====================================================================

function handleGetMutasiBarang(forceRefresh) {
  var cacheKey = 'cache_get_mutasi_barang';

  if (!forceRefresh) {
    var cached = getLargeCache(cacheKey);
    if (cached) {
      return jsonResponseRaw(cached);
    }
  }

  var ss = getSpreadsheet();
  var detailSheet = ss.getSheetByName(SHEET_NAMES.BARANG_DETAILS);
  var materialSheet = ss.getSheetByName(SHEET_NAMES.MASTER_MATERIAL);
  var barangSheet = ss.getSheetByName(SHEET_NAMES.BARANG);

  if (!detailSheet || !materialSheet || !barangSheet) {
    throw new Error('Salah satu sheet tidak ditemukan');
  }

  // Batch read via getDataRange().getValues() (1 RPC per sheet)
  var detailData = detailSheet.getDataRange().getValues();
  var materialData = materialSheet.getDataRange().getValues();
  var barangData = barangSheet.getDataRange().getValues();

  // 1. Build material lookup map (only necessary fields)
  var materialMap = {};
  if (materialData.length > 1) {
    var mHeaders = materialData[0];
    var mColNomer = -1, mColNama = -1, mColSatuan = -1;
    for (var mh = 0; mh < mHeaders.length; mh++) {
      var mHead = String(mHeaders[mh]).trim();
      if (mHead === 'nomer_material') mColNomer = mh;
      else if (mHead === 'nama_material') mColNama = mh;
      else if (mHead === 'satuan') mColSatuan = mh;
    }

    for (var mi = 1; mi < materialData.length; mi++) {
      var mRow = materialData[mi];
      var nomer = mColNomer !== -1 ? String(mRow[mColNomer]).trim() : '';
      if (nomer) {
        materialMap[nomer] = {
          nama: mColNama !== -1 ? String(mRow[mColNama] || '') : '',
          satuan: mColSatuan !== -1 ? String(mRow[mColSatuan] || '') : ''
        };
      }
    }
  }

  // 2. Build barang header lookup map
  var barangMap = {};
  if (barangData.length > 1) {
    var bHeaders = barangData[0];
    var bColId = -1, bColKet = -1, bColPetugas = -1;
    for (var bh = 0; bh < bHeaders.length; bh++) {
      var bHead = String(bHeaders[bh]).trim().toLowerCase();
      if (bHead === 'id_barang') bColId = bh;
      else if (bHead === 'keterangan') bColKet = bh;
      else if (bHead === 'petugas') bColPetugas = bh;
    }

    for (var bi = 1; bi < barangData.length; bi++) {
      var bRow = barangData[bi];
      var bId = bColId !== -1 ? String(bRow[bColId]).trim() : '';
      if (bId) {
        barangMap[bId] = {
          keterangan: bColKet !== -1 ? String(bRow[bColKet] || '') : '',
          petugas: bColPetugas !== -1 ? String(bRow[bColPetugas] || '') : ''
        };
      }
    }
  }

  // 3. Map details
  var result = [];
  if (detailData.length > 1) {
    var dHeaders = detailData[0];
    var dColIdDetail = -1, dColIdBarang = -1, dColNoSlip = -1, dColNoMat = -1;
    var dColAwal = -1, dColMasuk = -1, dColKeluar = -1, dColAkhir = -1, dColTgl = -1;

    for (var dh = 0; dh < dHeaders.length; dh++) {
      var dHead = String(dHeaders[dh]).trim();
      if (dHead === 'id_detail') dColIdDetail = dh;
      else if (dHead === 'id_barang') dColIdBarang = dh;
      else if (dHead === 'no_slip') dColNoSlip = dh;
      else if (dHead === 'nomor_material') dColNoMat = dh;
      else if (dHead === 'persediaan_awal') dColAwal = dh;
      else if (dHead === 'mutasi_masuk') dColMasuk = dh;
      else if (dHead === 'mutasi_keluar') dColKeluar = dh;
      else if (dHead === 'persediaan_akhir') dColAkhir = dh;
      else if (dHead === 'tanggal_pergerakan') dColTgl = dh;
    }

    for (var di = 1; di < detailData.length; di++) {
      var dRow = detailData[di];
      var noMat = dColNoMat !== -1 ? String(dRow[dColNoMat] || '').trim() : '';
      var idB = dColIdBarang !== -1 ? String(dRow[dColIdBarang] || '').trim() : '';

      var matInfo = materialMap[noMat] || {};
      var bInfo = barangMap[idB] || {};
      var tglVal = dColTgl !== -1 ? dRow[dColTgl] : '';

      result.push({
        id_detail: dColIdDetail !== -1 ? dRow[dColIdDetail] : di,
        nomor_material: noMat,
        nama_material: matInfo.nama || '',
        satuan: matInfo.satuan || '',
        tanggal_pergerakan: fastFormatDate(tglVal),
        no_slip: dColNoSlip !== -1 ? String(dRow[dColNoSlip] || '') : '',
        keterangan: bInfo.keterangan || '',
        petugas: bInfo.petugas || '',
        persediaan_awal: dColAwal !== -1 ? (parseFloat(dRow[dColAwal]) || 0) : 0,
        mutasi_masuk: dColMasuk !== -1 ? (parseFloat(dRow[dColMasuk]) || 0) : 0,
        mutasi_keluar: dColKeluar !== -1 ? (parseFloat(dRow[dColKeluar]) || 0) : 0,
        persediaan_akhir: dColAkhir !== -1 ? (parseFloat(dRow[dColAkhir]) || 0) : 0
      });
    }
  }

  // Sort by tanggal_pergerakan DESC, then id_detail DESC
  result.sort(function(a, b) {
    var dateA = a.tanggal_pergerakan;
    var dateB = b.tanggal_pergerakan;
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (parseInt(b.id_detail, 10) || 0) - (parseInt(a.id_detail, 10) || 0);
  });

  var jsonResult = JSON.stringify(result);
  putLargeCache(cacheKey, jsonResult, 1800); // Cache 30 menit

  return jsonResponseRaw(jsonResult);
}

// ====================================================================
// HANDLER: INSERT BARANG (Header transaksi)
// ====================================================================

function handleInsertBarang(body) {
  var noSlip = String(body.noSlip || '').trim();
  var jenisTransaksi = String(body.jenisTransaksi || '').trim();
  var keterangan = String(body.keterangan || '').trim();
  var petugas = String(body.petugas || '').trim();

  if (!noSlip || !jenisTransaksi || !keterangan || !petugas) {
    return jsonResponse({ success: false, message: 'Data tidak lengkap. Semua field wajib diisi.' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var nextId = getNextId(SHEET_NAMES.BARANG, 'id_barang');
    var sheet = getSheet(SHEET_NAMES.BARANG);

    // Ambil header kolom untuk mapping urutan kolom secara dinamis dan akurat
    var lastCol = sheet.getLastColumn();
    var newRow = [];

    if (lastCol > 0) {
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var hasMatched = false;

      for (var c = 0; c < headers.length; c++) {
        var hName = String(headers[c] || '').trim().toLowerCase();
        if (hName === 'id_barang') {
          newRow.push(nextId);
          hasMatched = true;
        } else if (hName === 'no_slip') {
          newRow.push(noSlip);
          hasMatched = true;
        } else if (hName === 'petugas') {
          newRow.push(petugas);
          hasMatched = true;
        } else if (hName === 'jenis_transaksi') {
          newRow.push(jenisTransaksi);
          hasMatched = true;
        } else if (hName === 'keterangan') {
          newRow.push(keterangan);
          hasMatched = true;
        } else {
          newRow.push('');
        }
      }

      if (!hasMatched) {
        // Fallback jika header tidak cocok sama sekali
        newRow = [nextId, noSlip, petugas, jenisTransaksi, keterangan];
      }
    } else {
      newRow = [nextId, noSlip, petugas, jenisTransaksi, keterangan];
    }

    sheet.appendRow(newRow);

    // Invalidate caches
    clearLargeCache(['cache_get_mutasi_barang', 'cache_get_stock']);

    lock.releaseLock();

    return jsonResponse({
      success: true,
      message: 'Data berhasil disimpan',
      id: nextId
    });
  } catch (err) {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
    return jsonResponse({ success: false, message: 'Gagal menyimpan data: ' + err.message });
  }
}

// ====================================================================
// HANDLER: INSERT BARANG DETAIL
// ====================================================================

function handleInsertBarangDetail(body) {
  var id_barang = body.id_barang;
  var nomor_material = String(body.nomor_material || '').trim();
  var jumlah = parseFloat(body.jumlah);
  var jenis_transaksi = String(body.jenis_transaksi || '').trim();

  if (!id_barang || !nomor_material || isNaN(jumlah) || jumlah <= 0 || !jenis_transaksi) {
    return jsonResponse({ success: false, message: 'Data incomplete. Semua field wajib diisi dengan benar.' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    // 1. Get no_slip from tbl_barang (fast lookup)
    var barangSheet = getSheet(SHEET_NAMES.BARANG);
    var bLastRow = barangSheet.getLastRow();
    var no_slip = '';

    if (bLastRow > 1) {
      var bHeaders = barangSheet.getRange(1, 1, 1, barangSheet.getLastColumn()).getValues()[0];
      var bIdCol = 0, bSlipCol = 1;
      for (var bh = 0; bh < bHeaders.length; bh++) {
        var h = String(bHeaders[bh] || '').trim().toLowerCase();
        if (h === 'id_barang') bIdCol = bh;
        else if (h === 'no_slip') bSlipCol = bh;
      }
      var maxCol = Math.max(bIdCol, bSlipCol) + 1;
      var bValues = barangSheet.getRange(1, 1, bLastRow, maxCol).getValues();
      for (var i = 1; i < bValues.length; i++) {
        if (String(bValues[i][bIdCol]).trim() === String(id_barang).trim()) {
          no_slip = String(bValues[i][bSlipCol] || '');
          break;
        }
      }
    }

    if (!no_slip) {
      lock.releaseLock();
      return jsonResponse({
        success: false,
        message: 'No Slip tidak ditemukan untuk id_barang: ' + id_barang
      });
    }

    // 2. Get next detail ID (optimized)
    var nextDetailId = getNextId(SHEET_NAMES.BARANG_DETAILS, 'id_detail');

    // 3. Calculate mutasi
    var mutasi_masuk = 0;
    var mutasi_keluar = 0;

    if (jenis_transaksi.toLowerCase() === 'penerimaan') {
      mutasi_masuk = jumlah;
    } else if (jenis_transaksi.toLowerCase() === 'pengeluaran') {
      mutasi_keluar = jumlah;
    } else {
      lock.releaseLock();
      return jsonResponse({
        success: false,
        message: 'Jenis transaksi tidak valid. Gunakan "Penerimaan" atau "Pengeluaran".'
      });
    }

    // 4. Get current stok from tbl_master_material
    var materialSheet = getSheet(SHEET_NAMES.MASTER_MATERIAL);
    var stokColIndex = getColumnIndex(materialSheet, 'stok');
    var nomerColIndex = getColumnIndex(materialSheet, 'nomer_material');

    if (stokColIndex === -1 || nomerColIndex === -1) {
      lock.releaseLock();
      return jsonResponse({
        success: false,
        message: 'Struktur sheet tbl_master_material tidak valid.'
      });
    }

    var materialRowIndex = findRowIndex(materialSheet, nomerColIndex, nomor_material);
    var persediaan_awal = 0;

    if (materialRowIndex > 0) {
      persediaan_awal = parseFloat(materialSheet.getRange(materialRowIndex, stokColIndex + 1).getValue()) || 0;
    }

    // 5. Calculate persediaan_akhir
    var persediaan_akhir = persediaan_awal + mutasi_masuk - mutasi_keluar;

    // 6. Timestamp
    var tanggal_pergerakan = fastFormatDate(new Date());

    // 7. Insert row into tbl_barang_details
    var detailSheet = getSheet(SHEET_NAMES.BARANG_DETAILS);
    detailSheet.appendRow([
      nextDetailId,
      id_barang,
      no_slip,
      nomor_material,
      persediaan_awal,
      mutasi_masuk,
      mutasi_keluar,
      persediaan_akhir,
      tanggal_pergerakan
    ]);

    // 8. Update stok in tbl_master_material
    if (materialRowIndex > 0) {
      materialSheet.getRange(materialRowIndex, stokColIndex + 1).setValue(persediaan_akhir);
    }

    SpreadsheetApp.flush();

    // Invalidate all related caches
    clearLargeCache(['cache_get_mutasi_barang', 'cache_get_stock', 'cache_master_materials_list']);

    lock.releaseLock();

    return jsonResponse({
      success: true,
      message: 'Item detail successfully saved.',
      id_detail: nextDetailId
    });
  } catch (err) {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
    return jsonResponse({ success: false, message: 'Error: ' + err.message });
  }
}

// ====================================================================
// UTILITY: Setup Sheets (run once to create sheet structure)
// ====================================================================

function setupSheets() {
  var ss = getSpreadsheet();

  // tbl_users
  var usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_NAMES.USERS);
    usersSheet.getRange(1, 1, 1, 6).setValues([[
      'id', 'username', 'password', 'name', 'input_barang_masuk', 'input_barang_keluar'
    ]]);
    usersSheet.getRange(2, 1, 1, 6).setValues([[
      1, 'admin', 'admin123', 'Administrator', true, true
    ]]);
    usersSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    Logger.log('Sheet "' + SHEET_NAMES.USERS + '" created with default admin user.');
  }

  // tbl_master_material
  var materialSheet = ss.getSheetByName(SHEET_NAMES.MASTER_MATERIAL);
  if (!materialSheet) {
    materialSheet = ss.insertSheet(SHEET_NAMES.MASTER_MATERIAL);
    materialSheet.getRange(1, 1, 1, 4).setValues([[
      'nomer_material', 'nama_material', 'satuan', 'stok'
    ]]);
    materialSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    Logger.log('Sheet "' + SHEET_NAMES.MASTER_MATERIAL + '" created.');
  }

  // tbl_barang
  var barangSheet = ss.getSheetByName(SHEET_NAMES.BARANG);
  if (!barangSheet) {
    barangSheet = ss.insertSheet(SHEET_NAMES.BARANG);
    barangSheet.getRange(1, 1, 1, 5).setValues([[
      'id_barang', 'no_slip', 'petugas', 'jenis_transaksi', 'keterangan'
    ]]);
    barangSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    Logger.log('Sheet "' + SHEET_NAMES.BARANG + '" created.');
  }

  // tbl_barang_details
  var detailSheet = ss.getSheetByName(SHEET_NAMES.BARANG_DETAILS);
  if (!detailSheet) {
    detailSheet = ss.insertSheet(SHEET_NAMES.BARANG_DETAILS);
    detailSheet.getRange(1, 1, 1, 9).setValues([[
      'id_detail', 'id_barang', 'no_slip', 'nomor_material',
      'persediaan_awal', 'mutasi_masuk', 'mutasi_keluar',
      'persediaan_akhir', 'tanggal_pergerakan'
    ]]);
    detailSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    Logger.log('Sheet "' + SHEET_NAMES.BARANG_DETAILS + '" created.');
  }

  Logger.log('=== Setup selesai! Semua sheet telah dibuat. ===');
}

// ====================================================================
// UTILITY: REPAIR DATA TERBALIK DI TBL_BARANG
// ====================================================================

/**
 * Memperbaiki data baris tbl_barang yang kolomnya terbalik:
 * - kolom petugas terisi jenis_transaksi -> dikembalikan ke jenis_transaksi
 * - kolom jenis_transaksi terisi keterangan -> dikembalikan ke keterangan
 * - kolom keterangan terisi petugas -> dikembalikan ke petugas
 */
function handleFixSwappedBarang() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var sheet = getSheet(SHEET_NAMES.BARANG);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow <= 1 || lastCol <= 0) {
      lock.releaseLock();
      return jsonResponse({ success: true, message: 'Tidak ada baris data untuk diperiksa', fixed_count: 0 });
    }

    var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = values[0];

    var colPetugas = -1;
    var colJenis = -1;
    var colKet = -1;

    for (var c = 0; c < headers.length; c++) {
      var h = String(headers[c] || '').trim().toLowerCase();
      if (h === 'petugas') colPetugas = c;
      else if (h === 'jenis_transaksi') colJenis = c;
      else if (h === 'keterangan') colKet = c;
    }

    if (colPetugas === -1 || colJenis === -1 || colKet === -1) {
      lock.releaseLock();
      return jsonResponse({
        success: false,
        message: 'Header tbl_barang tidak lengkap (petugas, jenis_transaksi, keterangan tidak ditemukan).'
      });
    }

    var fixedCount = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var currentPetugas = String(row[colPetugas] || '').trim();
      var currentJenis = String(row[colJenis] || '').trim();
      var currentKet = String(row[colKet] || '').trim();

      // Cek apakah kolom petugas berisi jenis transaksi ("penerimaan" atau "pengeluaran")
      var petugasLower = currentPetugas.toLowerCase();
      if (petugasLower === 'penerimaan' || petugasLower === 'pengeluaran') {
        // Data terbalik:
        // - currentPetugas adalah jenis_transaksi yang sebenarnya
        // - currentJenis adalah keterangan yang sebenarnya
        // - currentKet adalah petugas yang sebenarnya
        row[colPetugas] = currentKet;
        row[colJenis] = currentPetugas;
        row[colKet] = currentJenis;
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      sheet.getRange(2, 1, values.length - 1, lastCol).setValues(values.slice(1));
      SpreadsheetApp.flush();

      // Bersihkan cache agar data terbaru langsung tampil
      clearLargeCache(['cache_get_mutasi_barang', 'cache_get_stock', 'cache_master_materials_list']);
    }

    lock.releaseLock();

    return jsonResponse({
      success: true,
      message: 'Berhasil memperbaiki ' + fixedCount + ' baris data terbalik pada tbl_barang.',
      fixed_count: fixedCount
    });
  } catch (err) {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
    return jsonResponse({ success: false, message: 'Gagal memperbaiki data: ' + err.message });
  }
}

/**
 * Fungsi yang dapat dijalankan langsung melalui tombol Run di Google Apps Script Editor
 */
function fixSwappedBarangData() {
  var res = handleFixSwappedBarang();
  Logger.log(res.getContent());
}

