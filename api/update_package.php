<?php
/**
 * Panchved Admin - Update Package API
 * POST: /api/update_package.php
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
$package_id = trim((string) ($data['package_id'] ?? ''));

if ($id <= 0 && $package_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Package id or package_id is required.']);
    exit;
}

$package_name = trim((string) ($data['package_name'] ?? $data['name'] ?? ''));
$category = trim((string) ($data['category'] ?? ''));
$duration = trim((string) ($data['duration'] ?? ''));
$price_raw = isset($data['price']) ? preg_replace('/[^\d.]/', '', (string) $data['price']) : null;
$short_description = trim((string) ($data['short_description'] ?? ''));
$overview = trim((string) ($data['overview'] ?? ''));
$benefits = trim((string) ($data['benefits'] ?? ''));
$included = trim((string) ($data['included'] ?? ''));
$diet_hydration = trim((string) ($data['diet_hydration'] ?? ''));
$yoga_physio = trim((string) ($data['yoga_physio'] ?? ''));
$ayurveda_dinacharya = trim((string) ($data['ayurveda_dinacharya'] ?? ''));
$daily_activity = trim((string) ($data['daily_activity'] ?? ''));
$patient_monitoring = trim((string) ($data['patient_monitoring'] ?? ''));
$followup_review = trim((string) ($data['followup_review'] ?? ''));
$status = trim((string) ($data['status'] ?? ''));

$update_fields = [];
$params = [];
$types = '';

if ($package_name !== '') { $update_fields[] = "package_name = ?"; $params[] = $package_name; $types .= 's'; }
if ($category !== '') { $update_fields[] = "category = ?"; $params[] = $category; $types .= 's'; }
if ($duration !== '') { $update_fields[] = "duration = ?"; $params[] = $duration; $types .= 's'; }
if ($price_raw !== null && $price_raw !== '') { $update_fields[] = "price = ?"; $params[] = floatval($price_raw); $types .= 'd'; }
if ($short_description !== '') { $update_fields[] = "short_description = ?"; $params[] = $short_description; $types .= 's'; }
if ($overview !== '') { $update_fields[] = "overview = ?"; $params[] = $overview; $types .= 's'; }
if ($benefits !== '') { $update_fields[] = "benefits = ?"; $params[] = $benefits; $types .= 's'; }
if ($included !== '') { $update_fields[] = "included = ?"; $params[] = $included; $types .= 's'; }
if ($diet_hydration !== '') { $update_fields[] = "diet_hydration = ?"; $params[] = $diet_hydration; $types .= 's'; }
if ($yoga_physio !== '') { $update_fields[] = "yoga_physio = ?"; $params[] = $yoga_physio; $types .= 's'; }
if ($ayurveda_dinacharya !== '') { $update_fields[] = "ayurveda_dinacharya = ?"; $params[] = $ayurveda_dinacharya; $types .= 's'; }
if ($daily_activity !== '') { $update_fields[] = "daily_activity = ?"; $params[] = $daily_activity; $types .= 's'; }
if ($patient_monitoring !== '') { $update_fields[] = "patient_monitoring = ?"; $params[] = $patient_monitoring; $types .= 's'; }
if ($followup_review !== '') { $update_fields[] = "followup_review = ?"; $params[] = $followup_review; $types .= 's'; }
if ($status !== '' && in_array($status, ['Active', 'Inactive'], true)) {
    $update_fields[] = "status = ?"; $params[] = $status; $types .= 's';
}

if (empty($update_fields)) {
    echo json_encode(['status' => '1', 'message' => 'No fields to update.']);
    exit;
}

$sql = "UPDATE packages SET " . implode(', ', $update_fields);
if ($id > 0) {
    $sql .= " WHERE id = ?";
    $params[] = $id;
    $types .= 'i';
} else {
    $sql .= " WHERE package_id = ?";
    $params[] = $package_id;
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
    echo json_encode(['status' => '1', 'message' => 'Package updated successfully.']);
} else {
    $err = mysqli_stmt_error($stmt);
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to update package.', 'error' => $err]);
}
