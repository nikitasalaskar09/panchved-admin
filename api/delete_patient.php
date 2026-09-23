<?php
/**
 * Panchved Admin - Delete / Remove Patient API
 * POST/DELETE: /api/delete_patient.php
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
$patient_id = trim((string) ($_GET['patient_id'] ?? $data['patient_id'] ?? ''));

if ($id <= 0 && $patient_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Patient id or patient_id is required.']);
    exit;
}

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "DELETE FROM patients WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            $affected = mysqli_stmt_affected_rows($stmt);
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "DELETE FROM patients WHERE patient_id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $patient_id);
            mysqli_stmt_execute($stmt);
            $affected = mysqli_stmt_affected_rows($stmt);
            mysqli_stmt_close($stmt);
        }
    }
}

echo json_encode([
    'status' => '1',
    'message' => 'Patient deleted successfully.'
]);
