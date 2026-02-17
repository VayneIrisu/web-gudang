<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validation
if (
!isset($data['id_barang']) ||
!isset($data['nomor_kode_7']) ||
!isset($data['nomor_material']) ||
!isset($data['jumlah']) ||
!isset($data['harga_satuan']) ||
!isset($data['jenis_transaksi'])
) {
    http_response_code(400);
    echo json_encode(["message" => "Data incomplete."]);
    exit;
}

try {
    $id_barang = $data['id_barang'];
    $nomor_kode_7 = $data['nomor_kode_7'];
    $nomor_material = $data['nomor_material'];
    $jumlah = $data['jumlah'];
    $harga_satuan = $data['harga_satuan'];
    $jenis_transaksi = $data['jenis_transaksi'];
    $tanggal_input = date('Y-m-d H:i:s'); // "tanggal_pergerakan terisi berdasarkan tanggal user menginputkan data"

    // 1. Get no_slip from tbl_barang
    $stmtSlip = $conn->prepare("SELECT no_slip FROM tbl_barang WHERE id_barang = ?");
    $stmtSlip->execute([$id_barang]);
    $rowSlip = $stmtSlip->fetch(PDO::FETCH_ASSOC);
    $no_slip = $rowSlip ? $rowSlip['no_slip'] : '';

    if (!$no_slip) {
        throw new Exception("No Slip not found for id_barang: " . $id_barang);
    }

    // 2. Determine ID Detail
    $stmtMax = $conn->query("SELECT MAX(id_detail) as max_id FROM tbl_barang_details");
    $rowMax = $stmtMax->fetch(PDO::FETCH_ASSOC);
    $id_detail = ($rowMax && $rowMax['max_id']) ? (int)$rowMax['max_id'] + 1 : 1;

    // 3. Logic for Mutasi
    $mutasi_masuk = 0;
    $mutasi_keluar = 0;

    if (strtolower($jenis_transaksi) == 'penerimaan') {
        $mutasi_masuk = $jumlah;
    }
    else if (strtolower($jenis_transaksi) == 'pengeluaran') {
        $mutasi_keluar = $jumlah;
    }

    // 4. Fetch Persediaan Awal from tbl_master_material
    $stmtStok = $conn->prepare("SELECT stok FROM tbl_master_material WHERE nomer_material = ?");
    $stmtStok->execute([$nomor_material]);
    $rowStok = $stmtStok->fetch(PDO::FETCH_ASSOC);
    $persediaan_awal = $rowStok ? (float)$rowStok['stok'] : 0;

    // 5. Defaults and Calculations
    $persediaan_karantina = 0;
    //$persediaan_awal = 0;
    $persediaan_akhir = $persediaan_awal + $mutasi_masuk - $mutasi_keluar;
    $mata_uang = "Rupiah";
    $total_harga = $jumlah * $harga_satuan;
    if ($persediaan_akhir < 0) {
        http_response_code(400);
        echo json_encode([
            "message" => "Persediaan akhir tidak boleh minus. Stok saat ini: " . $persediaan_awal,
            "error" => true
        ]);
        exit;
    }

    // 6. Insert
    $query = "INSERT INTO tbl_barang_details (
                id_detail, 
                id_barang, 
                no_slip, 
                nomor_kode_7, 
                nomor_material, 
                persediaan_karantina, 
                persediaan_awal, 
                mutasi_masuk, 
                mutasi_keluar, 
                persediaan_akhir, 
                mata_uang, 
                total_harga, 
                harga_satuan, 
                tanggal_pergerakan
              ) VALUES (
                :id_detail,
                :id_barang,
                :no_slip,
                :nomor_kode_7,
                :nomor_material,
                :persediaan_karantina,
                :persediaan_awal,
                :mutasi_masuk,
                :mutasi_keluar,
                :persediaan_akhir,
                :mata_uang,
                :total_harga,
                :harga_satuan,
                :tanggal_pergerakan
              )";

    $stmt = $conn->prepare($query);

    // Bind parameters
    $stmt->bindParam(":id_detail", $id_detail);
    $stmt->bindParam(":id_barang", $id_barang);
    $stmt->bindParam(":no_slip", $no_slip);
    $stmt->bindParam(":nomor_kode_7", $nomor_kode_7);
    $stmt->bindParam(":nomor_material", $nomor_material);
    $stmt->bindParam(":persediaan_karantina", $persediaan_karantina);
    $stmt->bindParam(":persediaan_awal", $persediaan_awal);
    $stmt->bindParam(":mutasi_masuk", $mutasi_masuk);
    $stmt->bindParam(":mutasi_keluar", $mutasi_keluar);
    $stmt->bindParam(":persediaan_akhir", $persediaan_akhir);
    $stmt->bindParam(":mata_uang", $mata_uang);
    $stmt->bindParam(":total_harga", $total_harga);
    $stmt->bindParam(":harga_satuan", $harga_satuan);
    $stmt->bindParam(":tanggal_pergerakan", $tanggal_input);

    if ($stmt->execute()) {
        // Update stok in tbl_master_material
        $updateStokQuery = "UPDATE tbl_master_material SET stok = :persediaan_akhir WHERE nomer_material = :nomor_material";
        $stmtUpdate = $conn->prepare($updateStokQuery);
        $stmtUpdate->bindParam(":persediaan_akhir", $persediaan_akhir);
        $stmtUpdate->bindParam(":nomor_material", $nomor_material);
        $stmtUpdate->execute();
        echo json_encode(["message" => "Item detail successfully saved.", "id_detail" => $id_detail]);
    }
    else {
        http_response_code(500);
        echo json_encode(["message" => "Unable to save item detail."]);
    }

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error: " . $e->getMessage()]);
}
?>
