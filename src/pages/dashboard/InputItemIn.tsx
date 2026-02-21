import { useState } from "react";

type Item = {
  noMaterial: string;
  namaMaterial: string;
  nomerKode7: string;
  satuan: string;
  jumlah: number;
  hargaSatuan: number;
};

export default function InputBarang() {
  // ================= STATE FORM ATAS =================
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const [noSlip, setNoSlip] = useState("");
  const [tipePergerakan, setTipePergerakan] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState(
    user?.akses?.inputMasuk === false ? "Pengeluaran" : ""
  );
  const [noKode, setNoKode] = useState("");

  const [showDetail, setShowDetail] = useState(false);
  const [headerId, setHeaderId] = useState<number | null>(null);

  // ================= STATE TABEL =================
  const [items, setItems] = useState<Item[]>([]);

  // ================= STATE MODAL =================
  const [showModal, setShowModal] = useState(false);
  const [formItem, setFormItem] = useState<Item>({
    noMaterial: "",
    namaMaterial: "",
    nomerKode7: "",
    satuan: "",
    jumlah: 0,
    hargaSatuan: 0,
  });

  // ================= STATE SUGGESTIONS =================
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      // const res = await fetch(`http://localhost/gudang-api/get_master_material.php?q=${query}`);
      const res = await fetch(`https://web-gudang-api-production.up.railway.app/api/get_master_material.php?q=${query}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };


  return (
    <div className="p-4 md:p-6 max-w-full text-sm md:text-base animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* ================= HEADER ================= */}
        <div className="p-5 md:p-6 border-b border-slate-100">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Input Barang
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Catat transaksi barang masuk atau keluar gudang
          </p>
        </div>

        <div className="p-5 md:p-6">
          {/* ================= FORM INPUT ATAS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">No Slip</label>
              <input
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base"
                placeholder="Masukkan No Slip"
                value={noSlip}
                onChange={(e) => setNoSlip(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Jenis Transaksi</label>
              <select
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                value={jenisTransaksi}
                onChange={(e) => setJenisTransaksi(e.target.value)}
                disabled={user?.akses?.inputMasuk === false}
              >
                <option value="">Pilih Jenis</option>
                <option value="Penerimaan">Penerimaan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipe Pergerakan</label>
              <input
                type="number"
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base"
                placeholder="Contoh: 101"
                value={tipePergerakan}
                onChange={(e) => setTipePergerakan(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Valuation Type</label>
              <input
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm md:text-base"
                placeholder="Contoh: STD"
                value={noKode}
                onChange={(e) => setNoKode(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end border-b border-slate-100 pb-6 mb-6">
            <button
              onClick={async () => {
                // Validasi sederhana
                if (!noSlip || !tipePergerakan || !jenisTransaksi || !noKode) {
                  alert("Mohon lengkapi semua data header (No Slip, Jenis Transaksi, Tipe Pergerakan, Valuation Type)");
                  return;
                }

                // Ambil petugas dari user
                const petugasId = user?.id;

                if (!petugasId) {
                  alert("Sesi habis atau user tidak valid, silakan login ulang.");
                  return;
                }

                try {
                  // const res = await fetch("http://localhost/gudang-api/insert_barang.php", {
                  const res = await fetch("https://web-gudang-api-production.up.railway.app/api/insert_barang.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      noSlip,
                      tipePergerakan,
                      jenisTransaksi,
                      valuationType: noKode,
                      petugas: user?.nama || user?.username || "Unknown"
                    })
                  });

                  const data = await res.json();

                  if (res.ok) {
                    setHeaderId(data.id);
                    setShowDetail(true);
                  } else {
                    alert("Gagal menyimpan header: " + data.message);
                  }
                } catch (err) {
                  console.error(err);
                  alert("Terjadi kesalahan koneksi server");
                }
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
            >
              <span>Lanjut ke Detail</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>

          {/* ================= TABEL DETAIL BARANG ================= */}
          {showDetail && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">
                  Detail Barang
                </h2>

                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Tambah Barang
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">No Material</th>
                      <th className="px-4 py-3 border-b border-slate-200">Nama Material</th>
                      <th className="px-4 py-3 border-b border-slate-200">Nomer Kode 7</th>
                      <th className="px-4 py-3 border-b border-slate-200">Satuan</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Jumlah</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Harga</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-8 text-slate-400"
                        >
                          <p>Belum ada item ditambahkan</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                          <td className="px-4 py-3 border-r border-slate-50">{item.noMaterial}</td>
                          <td className="px-4 py-3 border-r border-slate-50">{item.namaMaterial}</td>
                          <td className="px-4 py-3 border-r border-slate-50 text-center">{item.nomerKode7}</td>
                          <td className="px-4 py-3 border-r border-slate-50 text-center">{item.satuan}</td>
                          <td className="px-4 py-3 border-r border-slate-50 text-right font-medium">{item.jumlah}</td>
                          <td className="px-4 py-3 border-r border-slate-50 text-right">{item.hargaSatuan.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {(item.jumlah * item.hargaSatuan).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL TAMBAH BARANG ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                Tambah Barang
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-500 uppercase">No Material</label>
                  <input
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Contoh: MAT-001"
                    value={formItem.noMaterial}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormItem({ ...formItem, noMaterial: val });
                      fetchSuggestions(val);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    // Delay blur to allow click on suggestion
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            setFormItem({
                              ...formItem,
                              noMaterial: item.nomer_material,
                              namaMaterial: item.nama_material,
                              satuan: item.satuan,
                            });
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-bold">{item.nomer_material}</span> - {item.nama_material}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>


                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Nama Material</label>
                  <input
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Nama Barang"
                    value={formItem.namaMaterial}
                    onChange={(e) =>
                      setFormItem({ ...formItem, namaMaterial: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Nomer Kode 7</label>
                  <input
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Contoh: STD"
                    value={formItem.nomerKode7}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        nomerKode7: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Satuan</label>
                  <input
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Contoh: Pcs, Box"
                    value={formItem.satuan}
                    onChange={(e) =>
                      setFormItem({ ...formItem, satuan: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="0"
                    value={formItem.jumlah}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        jumlah: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Harga Satuan</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="0"
                    value={formItem.hargaSatuan}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        hargaSatuan: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                <span className="text-slate-600 font-medium">Total Harga Item Ini</span>
                <span className="text-lg font-bold text-slate-800">
                  Rp {(formItem.jumlah * formItem.hargaSatuan).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Batal
              </button>

              <button
                onClick={async () => {
                  if (!headerId) {
                    alert("Header belum tersimpan. Silakan simpan header terlebih dahulu.");
                    return;
                  }

                  try {
                    // const res = await fetch("http://localhost/gudang-api/insert_barang_detail.php", {
                    const res = await fetch("https://web-gudang-api-production.up.railway.app/api/insert_barang_detail.php", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id_barang: headerId,
                        nomor_kode_7: formItem.nomerKode7,
                        nomor_material: formItem.noMaterial,
                        jumlah: formItem.jumlah,
                        harga_satuan: formItem.hargaSatuan,
                        jenis_transaksi: jenisTransaksi,
                      }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                      setItems([...items, formItem]);
                      setFormItem({
                        noMaterial: "",
                        namaMaterial: "",
                        nomerKode7: "",
                        satuan: "",
                        jumlah: 0,
                        hargaSatuan: 0,
                      });
                      setShowModal(false);
                      alert("Item berhasil disimpan ke database.");
                    } else {
                      alert("Gagal menyimpan item: " + data.message);
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Terjadi kesalahan saat menyimpan item.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              >
                Simpan Barang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
