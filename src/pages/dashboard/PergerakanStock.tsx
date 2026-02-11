import { useState } from "react"

interface PergerakanItem {
  id: number
  tanggal: string
  normalisasi: string
  namaMaterial: string
  masuk: number
  keluar: number
  petugas: string
}

function LaporanPergerakanStok() {
  const [tanggal, setTanggal] = useState("")
  const [sumberTujuan, setSumberTujuan] = useState("")

  const data: PergerakanItem[] = [
    {
      id: 1,
      tanggal: "2026-01-10",
      normalisasi: "MT-001",
      namaMaterial: "Besi Hollow",
      masuk: 50,
      keluar: 0,
      petugas: "Andi",
    },
    {
      id: 2,
      tanggal: "2026-01-11",
      normalisasi: "MT-002",
      namaMaterial: "Paku 5cm",
      masuk: 0,
      keluar: 20,
      petugas: "Budi",
    },
  ]

  return (
    <div className="space-y-6">

      {/* FILTER */}
      <div className="bg-white p-6 rounded shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <input
            placeholder="Sumber / Tujuan"
            value={sumberTujuan}
            onChange={(e) => setSumberTujuan(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <button className="bg-green-600 text-white px-4 py-2 rounded w-full md:w-auto">
            Unduh Data
          </button>
        </div>
      </div>

      {/* TABEL */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <table className="w-full border text-sm md:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Tanggal</th>
              <th className="border px-3 py-2">Normalisasi</th>
              <th className="border px-3 py-2">Nama Material</th>
              <th className="border px-3 py-2">Masuk</th>
              <th className="border px-3 py-2">Keluar</th>
              <th className="border px-3 py-2">Petugas</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Data kosong
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2">{item.tanggal}</td>
                  <td className="border px-3 py-2">{item.normalisasi}</td>
                  <td className="border px-3 py-2">{item.namaMaterial}</td>
                  <td className="border px-3 py-2 text-right">{item.masuk}</td>
                  <td className="border px-3 py-2 text-right">{item.keluar}</td>
                  <td className="border px-3 py-2">{item.petugas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LaporanPergerakanStok
