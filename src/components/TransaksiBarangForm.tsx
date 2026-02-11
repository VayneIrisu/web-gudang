import { useState } from "react"

interface DetailBarang {
  normalisasi: string
  namaBarang: string
  satuan: string
  jumlah: number
}

interface Props {
  title: string
  labelSumberTujuan: string
}

function TransaksiBarangForm({ title, labelSumberTujuan }: Props) {
  const [noTransaksi, setNoTransaksi] = useState("")
  const [tanggal, setTanggal] = useState("")
  const [sumberTujuan, setSumberTujuan] = useState("")

  const [lanjut, setLanjut] = useState(false)
  const [items, setItems] = useState<DetailBarang[]>([])
  const [openModal, setOpenModal] = useState(false)

  const [normalisasi, setNormalisasi] = useState("")
  const [namaBarang, setNamaBarang] = useState("")
  const [satuan, setSatuan] = useState("")
  const [jumlah, setJumlah] = useState<number>(0)

  const handleTambah = () => {
    if (!normalisasi || !namaBarang || !satuan || jumlah <= 0) return

    setItems([...items, { normalisasi, namaBarang, satuan, jumlah }])

    setNormalisasi("")
    setNamaBarang("")
    setSatuan("")
    setJumlah(0)
    setOpenModal(false)
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-6 rounded shadow max-w-xl">
        <h2 className="text-xl font-bold mb-6">{title}</h2>

        <input
          placeholder="No. Transaksi"
          value={noTransaksi}
          onChange={(e) => setNoTransaksi(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        />

        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        />

        <input
          placeholder={labelSumberTujuan}
          value={sumberTujuan}
          onChange={(e) => setSumberTujuan(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-6"
        />

        <button
          onClick={() => setLanjut(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Lanjut
        </button>
      </div>

      {/* DETAIL */}
      {lanjut && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Detail Barang</h3>
            <button
              onClick={() => setOpenModal(true)}
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Tambah
            </button>
          </div>

          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Normalisasi</th>
                <th className="border px-3 py-2">Nama Barang</th>
                <th className="border px-3 py-2">Satuan</th>
                <th className="border px-3 py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i}>
                    <td className="border px-3 py-2">{item.normalisasi}</td>
                    <td className="border px-3 py-2">{item.namaBarang}</td>
                    <td className="border px-3 py-2">{item.satuan}</td>
                    <td className="border px-3 py-2 text-right">{item.jumlah}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="font-bold mb-4">Tambah Barang</h3>

            <input
              placeholder="Normalisasi"
              value={normalisasi}
              onChange={(e) => setNormalisasi(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />

            <input
              placeholder="Nama Barang"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />

            <input
              placeholder="Satuan"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />

            <input
              type="number"
              placeholder="Jumlah"
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenModal(false)}
                className="border px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={handleTambah}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TransaksiBarangForm