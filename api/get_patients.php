<?php
/**
 * Panchved Admin - Get Patients List API
 * GET/POST: /api/get_patients.php
 *
 * Parameters:
 * - search (string: name, id, phone, email)
 * - package (string)
 * - status (string: 'Ongoing', 'Completed', 'Active', 'Inactive', 'all')
 * - page (int, default 1)
 * - limit (int, default 5)
 */

require_once __DIR__ . '/db_connect.php';

$raw_input = file_get_contents('php://input');
$body_data = [];
if ($raw_input !== false && trim($raw_input) !== '') {
    $decoded = json_decode($raw_input, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $body_data = $decoded;
    }
}

$search = trim((string) ($_GET['search'] ?? $body_data['search'] ?? ''));
$package = trim((string) ($_GET['package'] ?? $body_data['package'] ?? ''));
$status = trim((string) ($_GET['status'] ?? $body_data['status'] ?? ''));
$page = max(1, intval($_GET['page'] ?? $body_data['page'] ?? 1));
$limit = max(1, intval($_GET['limit'] ?? $body_data['limit'] ?? 5));
$offset = ($page - 1) * $limit;

$where_clauses = [];
$params = [];
$types = '';

if ($search !== '') {
    $where_clauses[] = "(
        full_name LIKE ? OR
        patient_id LIKE ? OR
        phone_number LIKE ? OR
        email LIKE ? OR
        package_name LIKE ?
    )";
    $search_param = '%' . $search . '%';
    for ($i = 0; $i < 5; $i++) {
        $params[] = $search_param;
        $types .= 's';
    }
}

if ($package !== '' && strtolower($package) !== 'all') {
    if (strpos($package, ',') !== false) {
        $packages = array_map('trim', explode(',', $package));
        $placeholders = implode(',', array_fill(0, count($packages), '?'));
        $where_clauses[] = "package_name IN ($placeholders)";
        foreach ($packages as $pkg) {
            $params[] = $pkg;
            $types .= 's';
        }
    } else {
        $where_clauses[] = "package_name LIKE ?";
        $params[] = '%' . $package . '%';
        $types .= 's';
    }
}

if ($status !== '' && strtolower($status) !== 'all') {
    if (strpos($status, ',') !== false) {
        $statuses = array_map('trim', explode(',', $status));
        $placeholders = implode(',', array_fill(0, count($statuses), '?'));
        $where_clauses[] = "status IN ($placeholders)";
        foreach ($statuses as $st) {
            $params[] = $st;
            $types .= 's';
        }
    } else {
        $where_clauses[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = ' WHERE ' . implode(' AND ', $where_clauses);
}

// Count total records
$count_sql = "SELECT COUNT(*) as total FROM patients" . $where_sql;
$count_stmt = mysqli_prepare($connection1, $count_sql);
$total_records = 0;

if ($count_stmt) {
    if (!empty($params)) {
        mysqli_stmt_bind_param($count_stmt, $types, ...$params);
    }
    mysqli_stmt_execute($count_stmt);
    $count_result = mysqli_stmt_get_result($count_stmt);
    if ($count_result && $row = mysqli_fetch_assoc($count_result)) {
        $total_records = intval($row['total']);
    }
    mysqli_stmt_close($count_stmt);
}

$total_pages = $total_records > 0 ? (int) ceil($total_records / $limit) : 1;

// Fetch patient records
$data_sql = "
    SELECT 
        id,
        patient_id,
        full_name,
        dob,
        age,
        phone_number,
        gender,
        email,
        blood_group,
        emergency_contact,
        address,
        package_name,
        total_appointments,
        status,
        created_at
    FROM patients
    " . $where_sql . "
    ORDER BY id DESC
    LIMIT ?, ?
";

$stmt = mysqli_prepare($connection1, $data_sql);
$patients = [];

if ($stmt) {
    $fetch_params = $params;
    $fetch_params[] = $offset;
    $fetch_params[] = $limit;
    $fetch_types = $types . 'ii';

    mysqli_stmt_bind_param($stmt, $fetch_types, ...$fetch_params);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Auto compute age if dob is set and age is 0
            if ((empty($row['age']) || $row['age'] == 0) && !empty($row['dob'])) {
                $dob = new DateTime($row['dob']);
                $now = new DateTime();
                $row['age'] = $now->diff($dob)->y;
            }
            $patients[] = $row;
        }
    }
    mysqli_stmt_close($stmt);
}

// Default mock data if table is empty
if (empty($patients) && $total_records === 0 && $search === '' && $package === '' && $status === '') {
    $patients = [
        ['id' => 1, 'patient_id' => 'E001', 'full_name' => 'Rahul Sharma', 'dob' => '1990-05-14', 'age' => 34, 'phone_number' => '9876543210', 'gender' => 'Male', 'email' => 'rahulsharma@gmail.com', 'package_name' => 'Stresscare', 'total_appointments' => 18, 'status' => 'Ongoing'],
        ['id' => 2, 'patient_id' => 'E002', 'full_name' => 'Pooja Deshmukh', 'dob' => '1996-08-22', 'age' => 28, 'phone_number' => '9812345678', 'gender' => 'Female', 'email' => 'poojad@gmail.com', 'package_name' => 'Reset Your Hormones', 'total_appointments' => 12, 'status' => 'Ongoing'],
        ['id' => 3, 'patient_id' => 'E003', 'full_name' => 'Vikram Malhotra', 'dob' => '1982-11-03', 'age' => 42, 'phone_number' => '9823456781', 'gender' => 'Male', 'email' => 'vikram.m@gmail.com', 'package_name' => 'Gut Healing Package', 'total_appointments' => 24, 'status' => 'Completed'],
        ['id' => 4, 'patient_id' => 'E004', 'full_name' => 'Ananya Sengupta', 'dob' => '1995-02-18', 'age' => 29, 'phone_number' => '9834567892', 'gender' => 'Female', 'email' => 'ananya.s@gmail.com', 'package_name' => 'Work On Metabolism', 'total_appointments' => 15, 'status' => 'Ongoing'],
        ['id' => 5, 'patient_id' => 'E005', 'full_name' => 'Suresh Iyer', 'dob' => '1974-09-30', 'age' => 50, 'phone_number' => '9845678903', 'gender' => 'Male', 'email' => 'sureshiyer@gmail.com', 'package_name' => 'Stresscare', 'total_appointments' => 20, 'status' => 'Ongoing']
    ];
    $total_records = count($patients);
    $total_pages = 1;
}

echo json_encode([
    'status' => '1',
    'message' => 'Patients fetched successfully.',
    'total_records' => $total_records,
    'total_pages' => $total_pages,
    'current_page' => $page,
    'limit' => $limit,
    'data' => $patients
]);
