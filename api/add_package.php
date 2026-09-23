<?php
/**
 * Panchved Admin - Add Package API
 * POST: /api/add_package.php
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

$package_name = trim((string) ($data['package_name'] ?? $data['name'] ?? $data['addPkgName'] ?? ''));
$category = trim((string) ($data['category'] ?? $data['addPkgCategory'] ?? 'General'));
$duration = trim((string) ($data['duration'] ?? $data['addPkgDuration'] ?? '4 Weeks'));
$price_raw = preg_replace('/[^\d.]/', '', (string) ($data['price'] ?? $data['addPkgPrice'] ?? '0'));
$price = floatval($price_raw);
$short_description = trim((string) ($data['short_description'] ?? $data['addPkgShortDesc'] ?? ''));
$overview = trim((string) ($data['overview'] ?? $data['addPkgOverview'] ?? ''));
$benefits = trim((string) ($data['benefits'] ?? $data['addPkgBenefits'] ?? ''));
$included = trim((string) ($data['included'] ?? $data['addPkgIncluded'] ?? ''));
$diet_hydration = trim((string) ($data['diet_hydration'] ?? $data['addDietHydration'] ?? ''));
$yoga_physio = trim((string) ($data['yoga_physio'] ?? $data['addYogaPhysio'] ?? ''));
$ayurveda_dinacharya = trim((string) ($data['ayurveda_dinacharya'] ?? $data['addAyurvedaDinacharya'] ?? ''));
$daily_activity = trim((string) ($data['daily_activity'] ?? $data['addDailyActivity'] ?? ''));
$patient_monitoring = trim((string) ($data['patient_monitoring'] ?? $data['addPatientMonitoring'] ?? ''));
$followup_review = trim((string) ($data['followup_review'] ?? $data['addFollowupReview'] ?? ''));
$status = ucfirst(strtolower(trim((string) ($data['status'] ?? 'Active'))));

if ($package_name === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Package name is required.']);
    exit;
}

if (!in_array($status, ['Active', 'Inactive'], true)) {
    $status = 'Active';
}

// Generate Package ID (e.g. PKG-001)
$new_pkg_code = 'PKG-001';
if ($connection1) {
    $max_res = mysqli_query($connection1, "SELECT MAX(id) as max_id FROM packages");
    if ($max_res && $max_row = mysqli_fetch_assoc($max_res)) {
        $next_id = intval($max_row['max_id']) + 1;
        $new_pkg_code = 'PKG-' . str_pad((string) $next_id, 3, '0', STR_PAD_LEFT);
    }
}

$image_url = 'assets/package-thumb.jpg';

$sql = "
    INSERT INTO packages 
    (package_id, package_name, category, duration, price, enrollments, protocol_status, image_url, short_description, overview, benefits, included, diet_hydration, yoga_physio, ayurveda_dinacharya, daily_activity, patient_monitoring, followup_review, status)
    VALUES (?, ?, ?, ?, ?, 0, 'Added', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
";

$stmt = mysqli_prepare($connection1, $sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to prepare query: ' . mysqli_error($connection1)]);
    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    'ssssdsssssssssssss',
    $new_pkg_code,
    $package_name,
    $category,
    $duration,
    $price,
    $image_url,
    $short_description,
    $overview,
    $benefits,
    $included,
    $diet_hydration,
    $yoga_physio,
    $ayurveda_dinacharya,
    $daily_activity,
    $patient_monitoring,
    $followup_review,
    $status
);

if (mysqli_stmt_execute($stmt)) {
    $insert_id = mysqli_insert_id($connection1);
    mysqli_stmt_close($stmt);

    echo json_encode([
        'status' => '1',
        'message' => 'Package added successfully.',
        'data' => [
            'id' => $insert_id,
            'package_id' => $new_pkg_code,
            'package_name' => $package_name,
            'category' => $category,
            'duration' => $duration,
            'price' => $price,
            'status' => $status
        ]
    ]);
} else {
    $err = mysqli_stmt_error($stmt);
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to add package.', 'error' => $err]);
}
