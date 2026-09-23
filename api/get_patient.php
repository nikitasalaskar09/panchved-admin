<?php
/**
 * Panchved Admin - Get Single Patient Details API
 * GET: /api/get_patient.php?id=1 or ?patient_id=E001
 */

require_once __DIR__ . '/db_connect.php';

$id = intval($_GET['id'] ?? 0);
$patient_id = trim((string) ($_GET['patient_id'] ?? ''));

if ($id <= 0 && $patient_id === '') {
    http_response_code(400);
    echo json_encode([
        'status' => '0',
        'message' => 'Valid patient id or patient_id is required.'
    ]);
    exit;
}

$patient = null;

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM patients WHERE id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $patient = $row;
            }
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM patients WHERE patient_id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $patient_id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $patient = $row;
            }
            mysqli_stmt_close($stmt);
        }
    }
}

if (!$patient) {
    http_response_code(404);
    echo json_encode([
        'status' => '0',
        'message' => 'Patient record not found.'
    ]);
    exit;
}

if ((empty($patient['age']) || $patient['age'] == 0) && !empty($patient['dob'])) {
    $dob = new DateTime($patient['dob']);
    $now = new DateTime();
    $patient['age'] = $now->diff($dob)->y;
}

echo json_encode([
    'status' => '1',
    'message' => 'Patient details fetched successfully.',
    'data' => $patient
]);
