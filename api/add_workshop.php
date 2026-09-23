<?php
/**
 * Panchved Admin - Add Workshop API
 * POST: /api/add_workshop.php
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

$title = trim((string) ($data['title'] ?? $data['name'] ?? $data['workshopName'] ?? ''));
$instructor = trim((string) ($data['instructor'] ?? $data['speaker'] ?? 'Dr. Nidhi Jha'));
$speaker = trim((string) ($data['speaker'] ?? $instructor));
$attendee_type = trim((string) ($data['attendee_type'] ?? $data['attendee'] ?? 'Doctor'));
$date = trim((string) ($data['date'] ?? date('Y-m-d')));
$time = trim((string) ($data['time'] ?? '8:00 AM'));
$capacity = intval($data['capacity'] ?? 50);
$registrations = intval($data['registrations'] ?? $data['enrolled'] ?? 0);
$fee_raw = preg_replace('/[^\d.]/', '', (string) ($data['fee'] ?? $data['price'] ?? '0'));
$fee = floatval($fee_raw);
$about = trim((string) ($data['about'] ?? ''));
$location = trim((string) ($data['location'] ?? 'Panchved Center Hall A'));
$status = ucfirst(strtolower(trim((string) ($data['status'] ?? 'Upcoming'))));

if ($title === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Workshop title/name is required.']);
    exit;
}

if (!in_array($status, ['Upcoming', 'Completed', 'Cancelled', 'Active', 'Past'], true)) {
    $status = 'Upcoming';
}

// Generate Workshop ID (e.g. WS-001)
$new_ws_code = 'WS-001';
if ($connection1) {
    $max_res = mysqli_query($connection1, "SELECT MAX(id) as max_id FROM workshops");
    if ($max_res && $max_row = mysqli_fetch_assoc($max_res)) {
        $next_id = intval($max_row['max_id']) + 1;
        $new_ws_code = 'WS-' . str_pad((string) $next_id, 3, '0', STR_PAD_LEFT);
    }
}

$image_url = 'assets/package-thumb.jpg';

$sql = "
    INSERT INTO workshops 
    (workshop_id, title, instructor, speaker, attendee_type, date, time, location, capacity, enrolled, registrations, price, fee, about, image_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
";

$stmt = mysqli_prepare($connection1, $sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to prepare query: ' . mysqli_error($connection1)]);
    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    'ssssssssiiiddsss',
    $new_ws_code,
    $title,
    $instructor,
    $speaker,
    $attendee_type,
    $date,
    $time,
    $location,
    $capacity,
    $registrations,
    $registrations,
    $fee,
    $fee,
    $about,
    $image_url,
    $status
);

if (mysqli_stmt_execute($stmt)) {
    $insert_id = mysqli_insert_id($connection1);
    mysqli_stmt_close($stmt);

    echo json_encode([
        'status' => '1',
        'message' => 'Workshop created successfully.',
        'data' => [
            'id' => $insert_id,
            'workshop_id' => $new_ws_code,
            'title' => $title,
            'date' => $date,
            'time' => $time,
            'attendee_type' => $attendee_type,
            'registrations' => $registrations,
            'fee' => $fee,
            'status' => $status
        ]
    ]);
} else {
    $err = mysqli_stmt_error($stmt);
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to create workshop.', 'error' => $err]);
}
