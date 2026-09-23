<?php
/**
 * Panchved Admin - Delete Appointment API
 * POST/DELETE: /api/delete_appointment.php
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
$appointment_id = trim((string) ($_GET['appointment_id'] ?? $data['appointment_id'] ?? ''));

if ($id <= 0 && $appointment_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Appointment id or appointment_id is required.']);
    exit;
}

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "DELETE FROM appointments WHERE id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "DELETE FROM appointments WHERE appointment_id = ?");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $appointment_id);
            mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }
    }
}

echo json_encode([
    'status' => '1',
    'message' => 'Appointment deleted successfully.'
]);
