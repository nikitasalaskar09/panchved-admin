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
$assigned_doctor_1 = trim((string) ($data['assigned_doctor_1'] ?? $data['assign_doctor_1'] ?? $data['addPkgDoctor1'] ?? ''));
$assigned_doctor_2 = trim((string) ($data['assigned_doctor_2'] ?? $data['assign_doctor_2'] ?? $data['addPkgDoctor2'] ?? $data['doctor_2'] ?? ''));

if ($assigned_doctor_1 === '') {
    $raw_doc = trim((string)($data['assigned_doctor'] ?? $data['assign_doctor'] ?? $data['addPkgDoctor'] ?? $data['doctor'] ?? ''));
    if ($raw_doc !== '') {
        if (strpos($raw_doc, ',') !== false) {
            $parts = array_map('trim', explode(',', $raw_doc, 2));
            $assigned_doctor_1 = $parts[0];
            if ($assigned_doctor_2 === '') {
                $assigned_doctor_2 = $parts[1] ?? '';
            }
        } else {
            $assigned_doctor_1 = $raw_doc;
        }
    }
}
$duration = trim((string) ($data['duration'] ?? $data['addPkgDuration'] ?? '1 Month'));
if ($duration === '') {
    $duration = '1 Month';
}
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

// Ensure assigned_doctor and assigned_doctor_2 columns exist in packages table
if ($connection1) {
    $col_res = @mysqli_query($connection1, "SHOW COLUMNS FROM packages");
    $existing_cols = [];
    if ($col_res) {
        while ($col_row = mysqli_fetch_assoc($col_res)) {
            $existing_cols[] = $col_row['Field'];
        }
    }
    if (!in_array('assigned_doctor', $existing_cols) && !in_array('assign_doctor', $existing_cols)) {
        @mysqli_query($connection1, "ALTER TABLE packages ADD COLUMN `assigned_doctor` VARCHAR(150) NULL DEFAULT NULL AFTER `category`");
        $existing_cols[] = 'assigned_doctor';
    }
    if (!in_array('assigned_doctor_2', $existing_cols) && !in_array('assign_doctor_2', $existing_cols)) {
        @mysqli_query($connection1, "ALTER TABLE packages ADD COLUMN `assigned_doctor_2` VARCHAR(150) NULL DEFAULT NULL AFTER `assigned_doctor`");
        $existing_cols[] = 'assigned_doctor_2';
    }
}

// Generate Package ID (e.g. PKG-001)
$new_pkg_code = 'PKG-001';
if ($connection1) {
    $max_res = mysqli_query($connection1, "SELECT MAX(id) as max_id FROM packages");
    if ($max_res && $max_row = mysqli_fetch_assoc($max_res)) {
        $next_id = max(1, intval($max_row['max_id']) + 1);
        $new_pkg_code = 'PKG-' . str_pad((string) $next_id, 3, '0', STR_PAD_LEFT);
    }
    // Check if code already exists to prevent duplicate key error
    $dup_chk = mysqli_query($connection1, "SELECT id FROM packages WHERE package_id = '" . mysqli_real_escape_string($connection1, $new_pkg_code) . "'");
    if ($dup_chk && mysqli_num_rows($dup_chk) > 0) {
        $new_pkg_code = 'PKG-' . str_pad((string) (time() % 10000), 3, '0', STR_PAD_LEFT);
    }
}

$image_url = 'assets/package-thumb.jpg';

// Check which column names are used
$has_assign_doctor = false;
$has_assigned_doctor = false;
$has_assigned_doctor_one = false;
$has_assigned_doctor_1 = false;
$has_assign_doctor_2 = false;
$has_assigned_doctor_2 = false;
$has_assign_doctor_two = false;
$has_assigned_doctor_two = false;
if ($connection1) {
    $col_res2 = @mysqli_query($connection1, "SHOW COLUMNS FROM packages");
    if ($col_res2) {
        while ($c = mysqli_fetch_assoc($col_res2)) {
            if ($c['Field'] === 'assigned_doctor') $has_assigned_doctor = true;
            if ($c['Field'] === 'assign_doctor') $has_assign_doctor = true;
            if ($c['Field'] === 'assigned_doctor_one') $has_assigned_doctor_one = true;
            if ($c['Field'] === 'assigned_doctor_1') $has_assigned_doctor_1 = true;
            if ($c['Field'] === 'assigned_doctor_2') $has_assigned_doctor_2 = true;
            if ($c['Field'] === 'assign_doctor_2') $has_assign_doctor_2 = true;
            if ($c['Field'] === 'assign_doctor_two') $has_assign_doctor_two = true;
            if ($c['Field'] === 'assigned_doctor_two') $has_assigned_doctor_two = true;
        }
    }
}

$doc_col1 = $has_assigned_doctor_one ? 'assigned_doctor_one' : ($has_assigned_doctor_1 ? 'assigned_doctor_1' : ($has_assigned_doctor ? 'assigned_doctor' : ($has_assign_doctor ? 'assign_doctor' : 'assigned_doctor')));
$doc_col2 = $has_assign_doctor_two ? 'assign_doctor_two' : ($has_assigned_doctor_two ? 'assigned_doctor_two' : ($has_assigned_doctor_2 ? 'assigned_doctor_2' : ($has_assign_doctor_2 ? 'assign_doctor_2' : null)));
$doc2_val = ($assigned_doctor_2 !== '') ? $assigned_doctor_2 : null;

if ($doc_col2 !== null) {
    $sql = "
        INSERT INTO packages 
        (package_id, package_name, category, `{$doc_col1}`, `{$doc_col2}`, duration, price, enrollments, protocol_status, image_url, short_description, overview, benefits, included, diet_hydration, yoga_physio, ayurveda_dinacharya, daily_activity, patient_monitoring, followup_review, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Added', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    $stmt = mysqli_prepare($connection1, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param(
            $stmt,
            'ssssssdssssssssssss',
            $new_pkg_code,
            $package_name,
            $category,
            $assigned_doctor_1,
            $doc2_val,
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
    }
} else {
    // Single doctor column fallback
    $combined_doc = $assigned_doctor_2 !== '' ? ($assigned_doctor_1 . ', ' . $assigned_doctor_2) : $assigned_doctor_1;
    $sql = "
        INSERT INTO packages 
        (package_id, package_name, category, `{$doc_col1}`, duration, price, enrollments, protocol_status, image_url, short_description, overview, benefits, included, diet_hydration, yoga_physio, ayurveda_dinacharya, daily_activity, patient_monitoring, followup_review, status)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'Added', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    $stmt = mysqli_prepare($connection1, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param(
            $stmt,
            'sssssdssssssssssss',
            $new_pkg_code,
            $package_name,
            $category,
            $combined_doc,
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
    }
}

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => '0', 'message' => 'Failed to prepare query: ' . mysqli_error($connection1)]);
    exit;
}

if (mysqli_stmt_execute($stmt)) {
    $insert_id = mysqli_insert_id($connection1);
    mysqli_stmt_close($stmt);

    $combined_doctor = ($assigned_doctor_2 !== '' && $assigned_doctor_2 !== null) ? ($assigned_doctor_1 . ', ' . $assigned_doctor_2) : $assigned_doctor_1;

    echo json_encode([
        'status' => '1',
        'message' => 'Package added successfully.',
        'data' => [
            'id' => $insert_id,
            'package_id' => $new_pkg_code,
            'package_name' => $package_name,
            'category' => $category,
            'assigned_doctor' => $assigned_doctor_1,
            'assigned_doctor_2' => $assigned_doctor_2,
            'assigned_doctor_1' => $assigned_doctor_1,
            'assign_doctor' => $assigned_doctor_1,
            'assign_doctor_1' => $assigned_doctor_1,
            'assign_doctor_2' => $assigned_doctor_2,
            'combined_doctor' => $combined_doctor,
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
?>
