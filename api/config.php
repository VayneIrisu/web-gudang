<?php
$conn = new PDO(
  "mysql:host=localhost;dbname=gudang2",
  "root",
  "",
[
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]  );
