<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'config.php';

$search = isset($_GET['q']) ? $_GET['q'] : '';

if ($search == '') {
    echo json_encode([]);
    exit;
}

try {
    // Search by nomer_material or nama_material
    $query = "SELECT nomer_material, nama_material, satuan FROM tbl_master_material WHERE nomer_material LIKE :search OR nama_material LIKE :search LIMIT 10";
    $stmt = $conn->prepare($query);

    $searchTerm = "%{$search}%";
    $stmt->bindParam(':search', $searchTerm);
    $stmt->execute();

    $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($materials);

}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>
