import { useState, useEffect } from "react";
import { utils, writeFile } from "xlsx";


type MutasiBarang = {
    nomorMaterial: string;
    namaMaterial: string;
    satuan: string;
    valuationType: string;
    tanggalPergerakan: string;
    tipePergerakan: string;
    noSlip: string;
    mataUang: string;
    kode7: string;
    petugas: string;
    karantina: number;
    awal: number;
    masuk: number;
    keluar: number;
    akhir: number;
    harga: number;
    total: number;
};

export default function MutasiBarang() {
    // ================= FILTER =================
    const [filterMaterial, setFilterMaterial] = useState("");
    const [filterNama, setFilterNama] = useState("");
    const [tanggalAwal, setTanggalAwal] = useState("");
    const [tanggalAkhir, setTanggalAkhir] = useState("");

    // ================= DATA STATE =================
    const [data, setData] = useState<MutasiBarang[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ================= PAGINATION STATE =================
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ================= FETCH DATA =================
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // const response = await fetch("http://localhost/gudang-api/get_mutasi_barang.php");
                const response = await fetch("https://web-gudang.42web.io/api/get_mutasi_barang.php");

                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }

                const result = await response.json();

                // Map database fields to component fields
                const mappedData = result.map((item: any) => ({
                    nomorMaterial: item.nomor_material || "",
                    namaMaterial: item.nama_material || "",
                    satuan: item.satuan || "",
                    valuationType: item.valuation_type || "",
                    tanggalPergerakan: item.tanggal_pergerakan || "",
                    tipePergerakan: item.tipe_pergerakan || "",
                    noSlip: item.no_slip || "",
                    mataUang: item.mata_uang || "",
                    kode7: item.nomor_kode_7 || "",
                    petugas: item.petugas || "",
                    karantina: parseFloat(item.persediaan_karantina) || 0,
                    awal: parseFloat(item.persediaan_awal) || 0,
                    masuk: parseFloat(item.mutasi_masuk) || 0,
                    keluar: parseFloat(item.mutasi_keluar) || 0,
                    akhir: parseFloat(item.persediaan_akhir) || 0,
                    harga: parseFloat(item.harga_satuan) || 0,
                    total: parseFloat(item.total_harga) || 0,
                }));

                setData(mappedData);
                setError("");
            } catch (err) {
                setError("Gagal mengambil data. Silakan coba lagi.");
                console.error("Error fetching mutasi barang data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ================= FILTER LOGIC =================
    const filteredData = data.filter((item) => {
        const cocokMaterial = (item.nomorMaterial || "")
            .toString()
            .toLowerCase()
            .includes(filterMaterial.toLowerCase());

        const cocokNama = (item.namaMaterial || "")
            .toString()
            .toLowerCase()
            .includes(filterNama.toLowerCase());

        const cocokTanggal =
            (!tanggalAwal || item.tanggalPergerakan >= tanggalAwal) &&
            (!tanggalAkhir || item.tanggalPergerakan <= tanggalAkhir);

        return cocokMaterial && cocokNama && cocokTanggal;
    });

    // ================= PAGINATION LOGIC =================
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
        setter(value);
        setCurrentPage(1);
    };

    // Format number with thousand separators
    const formatNumber = (num: number) => {
        return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID');
    };

    // ================= EXPORT LOGIC =================
    const handleExportExcel = () => {
        const wb = utils.book_new();
        const wsData = filteredData.map(item => ({
            "No Material": item.nomorMaterial,
            "Nama Material": item.namaMaterial,
            "Satuan": item.satuan,
            "Valuation": item.valuationType,
            "Tanggal": formatDate(item.tanggalPergerakan),
            "Tipe": item.tipePergerakan,
            "No Slip": item.noSlip,
            "Mata Uang": item.mataUang,
            "Kode 7": item.kode7,
            "Petugas": item.petugas,
            "Karantina": item.karantina,
            "Awal": item.awal,
            "Masuk": item.masuk,
            "Keluar": item.keluar,
            "Akhir": item.akhir,
            "Harga": item.harga,
            "Total": item.total
        }));
        const ws = utils.json_to_sheet(wsData);
        utils.book_append_sheet(wb, ws, "Mutasi Barang");
        writeFile(wb, `Mutasi_Barang_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

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
                            Riwayat pergerakan dan mutasi barang
                        </p>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm font-medium"
                    >
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
                            onChange={(e) => handleFilterChange(setFilterMaterial)(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Nama Material</label>
                        <input
                            type="text"
                            placeholder="Cari Nama Material..."
                            className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={filterNama}
                            onChange={(e) => handleFilterChange(setFilterNama)(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Awal</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={tanggalAwal}
                            onChange={(e) => handleFilterChange(setTanggalAwal)(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Akhir</label>
                        <input
                            type="date"
                            className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={tanggalAkhir}
                            onChange={(e) => handleFilterChange(setTanggalAkhir)(e.target.value)}
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
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Karantina</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Awal</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Masuk</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Keluar</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Akhir</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Harga</th>
                                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap text-right">Total</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={17}
                                        className="text-center py-12 text-slate-400"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p>Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td
                                        colSpan={17}
                                        className="text-center py-12"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2 text-red-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                            </svg>
                                            <p>{error}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
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
                                paginatedData.map((item, index) => (
                                    <tr key={startIndex + index} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                                        <td className="px-4 py-3 border-r border-slate-100 font-medium">{item.nomorMaterial}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.namaMaterial}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-center">{item.satuan}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.valuationType}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{formatDate(item.tanggalPergerakan)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.tipePergerakan}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.noSlip}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-center">{item.mataUang}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.kode7}</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{item.petugas}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right">{formatNumber(item.karantina)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right">{formatNumber(item.awal)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right text-green-600 font-medium">{formatNumber(item.masuk)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right text-red-600 font-medium">{formatNumber(item.keluar)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right font-bold">{formatNumber(item.akhir)}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-right">{formatNumber(item.harga)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/30">{formatNumber(item.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= PAGINATION ================= */}
                {!loading && !error && filteredData.length > 0 && (
                    <div className="p-5 md:p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                            Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Show first page, last page, current page, and nearby pages
                                        return (
                                            page === 1 ||
                                            page === totalPages ||
                                            Math.abs(page - currentPage) <= 1
                                        );
                                    })
                                    .map((page, index, array) => (
                                        <div key={page} className="flex items-center">
                                            {index > 0 && array[index - 1] !== page - 1 && (
                                                <span className="px-2 text-slate-400">...</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
