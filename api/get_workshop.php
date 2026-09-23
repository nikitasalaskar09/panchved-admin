<?php
/**
 * Panchved Admin - Get Single Workshop Details API
 * GET: /api/get_workshop.php?id=1 or ?workshop_id=WS-001
 */

require_once __DIR__ . '/db_connect.php';

$id = intval($_GET['id'] ?? 0);
$workshop_id = trim((string) ($_GET['workshop_id'] ?? ''));

if ($id <= 0 && $workshop_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Workshop id or workshop_id is required.']);
    exit;
}

$workshop = null;

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM workshops WHERE id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $workshop = $row;
            }
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM workshops WHERE workshop_id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $workshop_id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $workshop = $row;
            }
            mysqli_stmt_close($stmt);
        }
    }
}

if (!$workshop) {
    http_response_code(404);
    echo json_encode(['status' => '0', 'message' => 'Workshop not found.']);
    exit;
}

if (!empty($workshop['date'])) {
    $workshop['formatted_date'] = date('j M Y', strtotime($workshop['date']));
}
if (empty($workshop['registrations']) && !empty($workshop['enrolled'])) {
    $workshop['registrations'] = $workshop['enrolled'];
}
if (empty($workshop['fee']) && !empty($workshop['price'])) {
    $workshop['fee'] = $workshop['price'];
}

echo json_encode([
    'status' => '1',
    'message' => 'Workshop details fetched successfully.',
    'data' => $workshop
]);
