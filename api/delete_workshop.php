<?php
/**
 * Panchved Admin - Delete Workshop API
 * POST/DELETE: /api/delete_workshop.php
 */

require_once __DIR__ . '/db_connect.php';

$raw_data = file_get_contents('php://input');
$data = [];
if ($raw_data !== false && trim($raw_data) !== '') {
    $jsonData = json_decode($raw_data, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($jsonData)) {
        $data = $jsonData;
    }
}
if (empty($data) && !empty($_POST)) {
    $data = $_POST;
}

$id = intval($_GET['id'] ?? $data['id'] ?? 0);
$workshop_id = trim((string) ($_GET['workshop_id'] ?? $data['workshop_id'] ?? ''));

if ($id <= 0 && $workshop_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Workshop id or workshop_id is required.']);
    exit;
}

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "DELETE FROM workshops WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "DELETE FROM workshops WHERE workshop_id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $workshop_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }
}

echo json_encode([
    'status' => '1',
    'message' => 'Workshop deleted successfully.'
]);
