<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require "config.php";

$data = json_decode(file_get_contents("php://input"), true);

$noSlip = $data["noSlip"] ?? "";
$tipePergerakan = $data["tipePergerakan"] ?? "";
$jenisTransaksi = $data["jenisTransaksi"] ?? "";
$valuationType = $data["valuationType"] ?? ""; // Maps to noKode from frontend
$petugas = $data["petugas"] ?? "";

if (!$noSlip || !$tipePergerakan || !$jenisTransaksi || !$valuationType || !$petugas) {
    http_response_code(400);
    echo json_encode(["message" => "Data tidak lengkap"]);
    exit;
}

try {
    // Ambil ID Barang terakhir
    $stmtMax = $conn->query("SELECT MAX(id_barang) as max_id FROM tbl_barang");
    $rowMax = $stmtMax->fetch(PDO::FETCH_ASSOC);

    // Jika ada data, tambah 1. Jika tidak, mulai dari 1.
    $nextId = ($rowMax && $rowMax['max_id']) ? (int)$rowMax['max_id'] + 1 : 1;

    // Pastikan nama tabel dan kolom sesuai dengan database Anda
    // Asumsi tabel: tbl_barang
    // Kolom: id_barang, no_slip, tipe_pergerakan, jenis_transaksi, valuation_type, petugas
    $sql = "INSERT INTO tbl_barang (id_barang, no_slip, tipe_pergerakan, jenis_transaksi, valuation_type, petugas) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$nextId, $noSlip, $tipePergerakan, $jenisTransaksi, $valuationType, $petugas]);

    echo json_encode(["message" => "Data berhasil disimpan", "id" => $nextId]);
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Gagal menyimpan data: " . $e->getMessage()]);
}
?>
