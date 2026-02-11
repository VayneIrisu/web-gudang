import { useState } from "react";

type Stok = {
  nomorMaterial: string;
  namaMaterial: string;
  satuan: string;
  valuationType: string;
  stokTersedia: number;
  persediaanKarantina: number;
};

export default function CekStok() {
  // ================= FILTER =================
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterNama, setFilterNama] = useState("");

  // ================= DATA DUMMY =================
  const [data] = useState<Stok[]>([
    {
      nomorMaterial: "MAT-001",
      namaMaterial: "Besi Hollow",
      satuan: "Batang",
      valuationType: "STD",
      stokTersedia: 120,
      persediaanKarantina: 5,
    },
    {
      nomorMaterial: "MAT-002",
      namaMaterial: "Paku 5cm",
      satuan: "Dus",
      valuationType: "STD",
      stokTersedia: 50,
      persediaanKarantina: 0,
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

    return cocokMaterial && cocokNama;
  });

  return (
    <div className="p-4 md:p-6 max-w-full text-sm md:text-base animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* ================= HEADER ================= */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Cek Stok
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Informasi ketersediaan stok barang saat ini
            </p>
          </div>

          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Unduh Data
          </button>
        </div>

        {/* ================= FILTER ================= */}
        <div className="p-5 md:p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right font-bold bg-blue-50/50">Stok Tersedia</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right bg-orange-50/50">Persediaan Karantina</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                    <td className="px-4 py-3 border-r border-slate-100 text-right font-bold bg-blue-50/30 text-blue-700">
                      {item.stokTersedia}
                    </td>
                    <td className="px-4 py-3 text-right bg-orange-50/30 text-orange-600">
                      {item.persediaanKarantina}
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
