<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config.php';

try {
    // Get mutasi barang with JOINs from tbl_master_material and tbl_barang
    $query = "SELECT 
        bd.nomor_material,
        mm.nama_material,
        mm.satuan,
        b.valuation_type,
        bd.tanggal_pergerakan,
        b.tipe_pergerakan,
        bd.no_slip,
        bd.mata_uang,
        bd.nomor_kode_7,
        b.petugas,
        bd.persediaan_karantina,
        bd.persediaan_awal,
        bd.mutasi_masuk,
        bd.mutasi_keluar,
        bd.persediaan_akhir,
        bd.harga_satuan,
        bd.total_harga
    FROM tbl_barang_details bd
    LEFT JOIN tbl_master_material mm ON bd.nomor_material = mm.nomer_material
    LEFT JOIN tbl_barang b ON bd.id_barang = b.id_barang
    ORDER BY bd.tanggal_pergerakan DESC, bd.id_detail DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute();

    $mutasi_barang = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($mutasi_barang);

}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>
