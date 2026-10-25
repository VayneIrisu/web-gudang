// ====================================================================
// Konfigurasi API untuk koneksi ke Google Apps Script Web App
// Dilengkapi High-Performance Client Caching (Memory + SessionStorage)
// ====================================================================

export const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  console.error(
    '[API Config] VITE_API_URL belum diatur! ' +
    'Buat file .env di root project dengan isi:\n' +
    'VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
  );
}

// In-Memory cache fallback
const memoryCache = new Map<string, { data: any; expiry: number }>();

export interface ApiGetOptions {
  bypassCache?: boolean;
  ttlMs?: number; // Default 2 menit (120000ms)
}

/**
 * Buat cache key unik berdasarkan action dan parameters
 */
function buildCacheKey(action: string, params?: Record<string, string>): string {
  const paramKey = params
    ? Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&')
    : '';
  return `gudang_api_cache_${action}_${paramKey}`;
}

/**
 * Ambil data dari cache (SessionStorage atau Memory)
 */
function getFromCache<T>(key: string): T | null {
  const now = Date.now();

  // 1. Cek memory cache
  const memItem = memoryCache.get(key);
  if (memItem && memItem.expiry > now) {
    return memItem.data as T;
  }

  // 2. Cek sessionStorage
  try {
    const sessionItem = sessionStorage.getItem(key);
    if (sessionItem) {
      const parsed = JSON.parse(sessionItem);
      if (parsed && parsed.expiry > now) {
        // Sync ke memory cache
        memoryCache.set(key, { data: parsed.data, expiry: parsed.expiry });
        return parsed.data as T;
      } else {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Abaikan jika sessionStorage dinonaktifkan di browser
  }

  return null;
}

/**
 * Simpan data ke cache
 */
function saveToCache(key: string, data: any, ttlMs: number): void {
  const expiry = Date.now() + ttlMs;

  // 1. Simpan di memory cache
  memoryCache.set(key, { data, expiry });

  // 2. Simpan di sessionStorage
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ data, expiry })
    );
  } catch (e) {
    // Kuota sessionStorage penuh atau storage disabled
  }
}

/**
 * Bersihkan seluruh atau sebagian client API cache
 * @param pattern - Filter opsional untuk key tertentu (misal: 'get_stock')
 */
export function clearApiCache(pattern?: string): void {
  // Clear memory cache
  if (pattern) {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }

  // Clear sessionStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('gudang_api_cache_')) {
        if (!pattern || key.includes(pattern)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (e) {
    // Abaikan error
  }
}

/**
 * GET request ke Google Apps Script (Dengan Caching Pintar)
 * @param action - Nama action (get_stock, get_master_material, get_mutasi_barang)
 * @param params - Query parameters tambahan
 * @param options - Opsi caching { bypassCache: boolean, ttlMs: number }
 */
export async function apiGet<T = any>(
  action: string,
  params?: Record<string, string>,
  options?: ApiGetOptions
): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL belum diatur di file .env. Pastikan URL Web App Google Apps Script sudah diisi.');
  }

  const bypassCache = options?.bypassCache ?? false;
  const ttlMs = options?.ttlMs ?? 120000; // Default cache 2 menit
  const cacheKey = buildCacheKey(action, params);

  // Jika tidak force-refresh, periksa cache terlebih dahulu
  if (!bypassCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const url = new URL(API_URL);
  url.searchParams.set('action', action);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Beritahu Apps Script jika kita ingin force-refresh agar CacheService server juga dibersihkan
  if (bypassCache) {
    url.searchParams.set('refresh', '1');
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Network error: ${res.status} ${res.statusText}`);
  }

  const result: T = await res.json();

  // Simpan hasil ke cache jika sukses
  if (result !== undefined && result !== null) {
    saveToCache(cacheKey, result, ttlMs);
  }

  return result;
}

/**
 * POST request ke Google Apps Script
 * Catatan: Otomatis membersihkan cache terkait setelah data berhasil disimpan
 * 
 * @param action - Nama action (login, insert_barang, insert_barang_detail)
 * @param data - Data yang akan dikirim
 */
export async function apiPost<T = any>(
  action: string,
  data: Record<string, any>
): Promise<T> {
  if (!API_URL) {
    throw new Error('VITE_API_URL belum diatur di file .env. Pastikan URL Web App Google Apps Script sudah diisi.');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ ...data, action }),
  });

  if (!res.ok) {
    throw new Error(`Network error: ${res.status} ${res.statusText}`);
  }

  const result: T = await res.json();

  // Jika aksi mutasi data sukses, otomatis bersihkan cache client
  if (action === 'insert_barang' || action === 'insert_barang_detail') {
    clearApiCache();
  }

  return result;
}
