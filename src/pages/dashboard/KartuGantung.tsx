import { useState } from "react";

type Mutasi = {
  nomorMaterial: string;
  namaMaterial: string;
  satuan: string;
  valuationType: string;
  tanggal: string;
  tipePergerakan: string;
  noSlip: string;
  mataUang: string;
  nomorKode7: string;
  petugas: string;
  persediaanKarantina: number;
  persediaanAwal: number;
  mutasiMasuk: number;
  mutasiKeluar: number;
  persediaanAkhir: number;
  hargaSatuan: number;
};

export default function MutasiBarang() {
  // ================= FILTER =================
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterNama, setFilterNama] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");

  // ================= DATA DUMMY =================
  const [data] = useState<Mutasi[]>([
    {
      nomorMaterial: "MAT-001",
      namaMaterial: "Besi Hollow",
      satuan: "Batang",
      valuationType: "STD",
      tanggal: "2026-02-01",
      tipePergerakan: "Masuk",
      noSlip: "SLP-001",
      mataUang: "IDR",
      nomorKode7: "7001234",
      petugas: "Admin",
      persediaanKarantina: 0,
      persediaanAwal: 100,
      mutasiMasuk: 20,
      mutasiKeluar: 0,
      persediaanAkhir: 120,
      hargaSatuan: 50000,
    },
  ]);

  // ================= FILTER LOGIC =================
  const filteredData = data.filter((item) => {
    const cocokMaterial = item.nomorMaterial
      .toLowerCase()
      .includes(filterMaterial.toLowerCase());

    const cocokNama = item.namaMaterial
      .toLowerCase()
      .includes(filterNama.toLowerCase());

    const cocokTanggal =
      (!tanggalAwal || item.tanggal >= tanggalAwal) &&
      (!tanggalAkhir || item.tanggal <= tanggalAkhir);

    return cocokMaterial && cocokNama && cocokTanggal;
  });

  return (
    <div className="p-4 md:p-6 max-w-full text-sm md:text-base animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* ================= HEADER ================= */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Mutasi Barang
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor pergerakan stok barang masuk dan keluar
            </p>
          </div>

          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Unduh Data
          </button>
        </div>

        {/* ================= FILTER ================= */}
        <div className="p-5 md:p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">No Material</label>
            <input
              type="text"
              placeholder="Cari No Material..."
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Nama Material</label>
            <input
              type="text"
              placeholder="Cari Nama Material..."
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Awal</label>
            <input
              type="date"
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={tanggalAwal}
              onChange={(e) => setTanggalAwal(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Akhir</label>
            <input
              type="date"
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              value={tanggalAkhir}
              onChange={(e) => setTanggalAkhir(e.target.value)}
            />
          </div>
        </div>

        {/* ================= TABEL ================= */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No Material</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Nama Material</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Satuan</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Valuation</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Tipe</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">No Slip</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Mata Uang</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Kode 7</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Petugas</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right bg-orange-50/50">Karantina</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Awal</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right text-green-600">Masuk</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right text-red-600">Keluar</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right font-bold bg-blue-50/50">Akhir</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Harga</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right font-bold">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={17}
                    className="text-center py-12 text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      <p>Data tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                    <td className="px-4 py-3 border-r border-slate-100 font-medium">{item.nomorMaterial}</td>
                    <td className="px-4 py-3 border-r border-slate-100">{item.namaMaterial}</td>
                    <td className="px-4 py-3 border-r border-slate-100 text-center">{item.satuan}</td>
                    <td className="px-4 py-3 border-r border-slate-100 text-center">{item.valuationType}</td>
                    <td className="px-4 py-3 border-r border-slate-100 whitespace-nowrap">{item.tanggal}</td>
                    <td className="px-4 py-3 border-r border-slate-100">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.tipePergerakan === 'Masuk' ? 'bg-green-100 text-green-700' :
                          item.tipePergerakan === 'Keluar' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {item.tipePergerakan}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 font-mono text-xs">{item.noSlip}</td>
                    <td className="px-4 py-3 border-r border-slate-100 text-center">{item.mataUang}</td>
                    <td className="px-4 py-3 border-r border-slate-100 font-mono text-xs">{item.nomorKode7}</td>
                    <td className="px-4 py-3 border-r border-slate-100">{item.petugas}</td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right bg-orange-50/30 text-orange-600">
                      {item.persediaanKarantina}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">
                      {item.persediaanAwal}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right text-green-600 font-medium">
                      {item.mutasiMasuk > 0 ? `+${item.mutasiMasuk}` : '-'}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right text-red-600 font-medium">
                      {item.mutasiKeluar > 0 ? `-${item.mutasiKeluar}` : '-'}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right font-bold bg-blue-50/30 text-blue-700">
                      {item.persediaanAkhir}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 text-right font-mono text-xs">
                      {item.hargaSatuan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono text-xs">
                      {(item.hargaSatuan * item.persediaanAkhir).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
