<?php
/* === WAJIB UNTUK DEBUG === */
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/* === CORS HEADER === */
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

/* === HANDLE PREFLIGHT === */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

/* === DB === */
require "config.php";

/* === READ JSON === */
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
  echo json_encode(["message" => "Request kosong"]);
  exit;
}

$username = $data["username"] ?? "";
$password = $data["password"] ?? "";

/* === CEK USERNAME === */
$stmt = $conn->prepare("SELECT * FROM tbl_users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
  http_response_code(401);
  echo json_encode(["message" => "Username tidak ditemukan"]);
  exit;
}

/* === CEK PASSWORD === */
if ($user["password"] !== $password) {
  http_response_code(401);
  echo json_encode(["message" => "Password salah"]);
  exit;
}

/* === LOGIN SUKSES === */
$payload = [
  "id" => $user["id"],
  "username" => $user["username"],
  "nama" => $user["nama"] ?? $user["username"], // Fallback to username if nama is empty
  "akses" => [
    "inputMasuk" => (bool)$user["input_barang_masuk"],
    "inputKeluar" => (bool)$user["input_barang_keluar"]
  ]
];

echo json_encode([
  "message" => "Login berhasil",
  "user" => $payload
]);
