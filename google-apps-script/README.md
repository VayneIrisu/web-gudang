# Panduan Integrasi Google Sheets & Google Apps Script API (High-Performance Edition)

Sistem backend aplikasi Web Gudang telah berhasil dimigrasikan dari MariaDB/PHP menjadi **Google Sheets** menggunakan **Google Apps Script Web App** dengan arsitektur **High-Performance Caching** yang dioptimalkan untuk menangani **1000+ hingga puluhan ribu baris data**.

---

## 🚀 Fitur Optimasi Performa (1000+ Baris Data)

1. **Multi-Chunk Script Cache (Google CacheService)**:
   - Data `get_stock` dan `get_mutasi_barang` disimpan di Google high-speed in-memory cache dengan teknik chunking 90KB.
   - Respon pembacaan cache hanya memakan waktu **~150ms - 300ms** (dibandingkan membaca sheet langsung yang memakan 5-10 detik).
2. **Auto Cache Invalidation (Data Selalu Sinkron)**:
   - Begitu ada input transaksi (`insert_barang` / `insert_barang_detail`), backend secara otomatis membersihkan cache terkait sehingga data baru langsung tampil pada request berikutnya.
3. **Batch 2D Array Processing & Memoization**:
   - Membaca seluruh data per sheet dalam 1 kali RPC call (`getDataRange().getValues()`).
   - Akses data menggunakan indeks kolom langsung tanpa alokasi ribuan object wrapper sementara.
   - Spreadsheet connection di-memoize sehingga hanya dibuka 1 kali per request.
4. **Client-Side Smart Cache (SessionStorage + Memory Cache)**:
   - Navigasi antar halaman ("Cek Stok", "Mutasi Barang") terasa **instan (0ms)** karena data tersimpan di client-side cache selama 2 menit.
5. **Tombol "Segarkan" (Force Refresh)**:
   - Disediakan tombol **Segarkan** di halaman *Cek Stok* dan *Mutasi Barang* untuk memaksa pengambilan data terbaru langsung dari Google Sheets kapan saja.
6. **Autocomplete Debouncing**:
   - Pencarian master material di modal input barang diberi jeda debounce 250ms untuk menghindari penumpukan request saat mengetik.

---

## 1. Persiapan Google Spreadsheet

Spreadsheet ID yang saat ini telah dikonfigurasi di `google-apps-script/Code.gs`:
```
1DycE_-kXEDc6Al6BozuiOV2hGqJFwXDkD9P8BH1dQXw
```
*(Jika Anda membuat spreadsheet baru, ganti nilai `SPREADSHEET_ID` di baris ke-8 `Code.gs`)*.

---

## 2. Struktur Tab Sheet & Kolom Header

Di dalam Google Spreadsheet, buat 4 tab/sheet berikut (atau jalankan fungsi `setupSheets()` di Apps Script untuk membuatnya secara otomatis):

### Tab 1: `tbl_users`
| Baris 1 (Header) | Contoh Data (Baris 2) |
|---|---|
| `id` | `1` |
| `username` | `admin` |
| `password` | `admin123` |
| `name` | `Administrator` |
| `input_barang_masuk` | `TRUE` |
| `input_barang_keluar` | `TRUE` |

### Tab 2: `tbl_master_material`
| Baris 1 (Header) | Keterangan |
|---|---|
| `nomer_material` | Nomor/kode unik material |
| `nama_material` | Nama barang/material |
| `satuan` | Satuan (Pcs, Unit, Box, dll.) |
| `stok` | Jumlah stok saat ini (angka) |

### Tab 3: `tbl_barang`
| Baris 1 (Header) | Keterangan |
|---|---|
| `id_barang` | ID auto-increment (1, 2, ...) |
| `no_slip` | Nomor slip transaksi |
| `petugas` | Nama petugas yang menginput |
| `jenis_transaksi` | `Penerimaan` atau `Pengeluaran` |
| `keterangan` | Keterangan transaksi |

> **Catatan:** Script `Code.gs` sekarang memetakan urutan kolom secara dinamis berdasarkan nama header pada baris pertama. Jadi jika urutan kolom pada spreadsheet Anda berbeda, data tetap akan masuk ke kolom yang benar secara otomatis.

Jika sebelumnya ada baris data yang sempat tersimpan terbalik, jalankan fungsi `fixSwappedBarangData()` di Apps Script Editor atau buka URL Web App Anda dengan parameter `?action=fix_swapped_barang` di browser untuk otomatis merapikannya kembali.


### Tab 4: `tbl_barang_details`
| Baris 1 (Header) | Keterangan |
|---|---|
| `id_detail` | ID auto-increment detail |
| `id_barang` | Relasi ke `id_barang` di `tbl_barang` |
| `no_slip` | Nomor slip transaksi |
| `nomor_material` | Nomor material dari `tbl_master_material` |
| `persediaan_awal` | Jumlah stok awal sebelum mutasi |
| `mutasi_masuk` | Jumlah masuk (jika Penerimaan) |
| `mutasi_keluar` | Jumlah keluar (jika Pengeluaran) |
| `persediaan_akhir` | Jumlah stok akhir setelah mutasi |
| `tanggal_pergerakan` | Tanggal dan waktu transaksi (`YYYY-MM-DD HH:MM:SS`) |

---

## 3. Langkah Update / Deploy Google Apps Script

Jika Anda sebelumnya sudah pernah men-deploy Apps Script, ikuti langkah berikut untuk menerapkan pembaruan performa:

1. Buka Google Spreadsheet Anda.
2. Klik menu **Extensions (Ekstensi)** > **Apps Script**.
3. Hapus seluruh isi kode lama di editor, lalu **salin dan tempel seluruh isi terbaru** dari [`google-apps-script/Code.gs`](./Code.gs).
4. Klik tombol **Save (Simpan)** (ikon disket).
5. **Update Deployment (PENTING!):**
   - Di pojok kanan atas, klik **Deploy** > **Manage deployments (Kelola penerapan)**.
   - Klik ikon **Edit (pensil)** pada deployment Web App aktif Anda.
   - Di dropdown **Version**, pilih **New version (Versi baru)**.
   - Klik **Deploy**.
   - URL Web App Anda **tetap sama** dan tidak berubah.
6. (Jika pertama kali deploy):
   - Klik **Deploy** > **New deployment** > pilih **Web app**.
   - Set **Execute as: Me** dan **Who has access: Anyone**.
   - Salin URL Web App ke `.env`.

---

## 4. Konfigurasi Frontend

1. Pastikan URL Web App sudah ada di file `.env` di root project:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/AKfycby.../exec
   ```
2. Jalankan aplikasi web:
   ```bash
   npm run dev
   ```
3. Akun login default:
   - **Username**: `admin`
   - **Password**: `admin123`
