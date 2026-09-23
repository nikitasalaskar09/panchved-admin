<?php
/**
 * Panchved Admin - Update Workshop API
 * POST: /api/update_workshop.php
 */

require_once __DIR__ . '/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => '0', 'message' => 'Only POST method is allowed.']);
    exit;
}

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

$id = intval($data['id'] ?? 0);
$workshop_id = trim((string) ($data['workshop_id'] ?? ''));

if ($id <= 0 && $workshop_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Workshop id or workshop_id is required.']);
    exit;
}

$title = trim((string) ($data['title'] ?? $data['name'] ?? $data['workshopName'] ?? ''));
$instructor = trim((string) ($data['instructor'] ?? ''));
$speaker = trim((string) ($data['speaker'] ?? $instructor));
$attendee_type = trim((string) ($data['attendee_type'] ?? $data['attendee'] ?? ''));
$date = trim((string) ($data['date'] ?? ''));
$time = trim((string) ($data['time'] ?? ''));
$fee_raw = isset($data['fee']) ? preg_replace('/[^\d.]/', '', (string) $data['fee']) : (isset($data['price']) ? preg_replace('/[^\d.]/', '', (string) $data['price']) : null);
$about = trim((string) ($data['about'] ?? ''));
$status = trim((string) ($data['status'] ?? ''));

$update_fields = [];
$params = [];
$types = '';

if ($title !== '') { $update_fields[] = "title = ?"; $params[] = $title; $types .= 's'; }
if ($instructor !== '') { $update_fields[] = "instructor = ?"; $params[] = $instructor; $types .= 's'; }
if ($speaker !== '') { $update_fields[] = "speaker = ?"; $params[] = $speaker; $types .= 's'; }
if ($attendee_type !== '') { $update_fields[] = "attendee_type = ?"; $params[] = $attendee_type; $types .= 's'; }
if ($date !== '') { $update_fields[] = "date = ?"; $params[] = $date; $types .= 's'; }
if ($time !== '') { $update_fields[] = "time = ?"; $params[] = $time; $types .= 's'; }
if ($fee_raw !== null && $fee_raw !== '') {
    $val = floatval($fee_raw);
    $update_fields[] = "fee = ?"; $params[] = $val; $types .= 'd';
    $update_fields[] = "price = ?"; $params[] = $val; $types .= 'd';
}
if ($about !== '') { $update_fields[] = "about = ?"; $params[] = $about; $types .= 's'; }
if ($status !== '' && in_array($status, ['Upcoming', 'Completed', 'Cancelled', 'Active', 'Past'], true)) {
    $update_fields[] = "status = ?"; $params[] = $status; $types .= 's';
}

if (empty($update_fields)) {
    echo json_encode(['status' => '1', 'message' => 'No fields to update.']);
    exit;
}

$sql = "UPDATE workshops SET " . implode(', ', $update_fields);
if ($id > 0) {
    $sql .= " WHERE id = ?";
    $params[] = $id;
    $types .= 'i';
} else {
    $sql .= " WHERE workshop_id = ?";
    $params[] = $workshop_id;
    $types .= 's';
}

$stmt = mysqli_prepare($connection1, $sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to prepare statement: ' . mysqli_error($connection1)]);
    exit;
}

mysqli_stmt_bind_param($stmt, $types, ...$params);

if (mysqli_stmt_execute($stmt)) {
    mysqli_stmt_close($stmt);
    echo json_encode(['status' => '1', 'message' => 'Workshop updated successfully.']);
} else {
    $err = mysqli_stmt_error($stmt);
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to update workshop.', 'error' => $err]);
}
