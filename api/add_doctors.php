<?php

/**
 * Panchved Admin - Add Doctor API
 * POST: /api/add_doctors.php
 */

require_once __DIR__ . '/db_connect.php';

/* =========================================
   CHECK REQUEST METHOD
========================================= */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => '0',
        'message' => 'Only POST method is allowed.'
    ]);
    exit;
}

/* =========================================
   GET REQUEST DATA
========================================= */

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

if (empty($data)) {
    echo json_encode([
        'status' => '0',
        'message' => 'Request body is empty or invalid JSON.'
    ]);
    exit;
}

/* =========================================
   PARSE INPUT FIELDS
========================================= */

$full_name = trim((string) ($data['full_name'] ?? $data['fullName'] ?? ''));
$date_of_birth_input = trim((string) ($data['date_of_birth'] ?? $data['dob'] ?? ''));
$phone_number = trim((string) ($data['phone_number'] ?? $data['phone'] ?? ''));
$gender = trim((string) ($data['gender'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$years_of_experience = $data['years_of_experience'] ?? $data['yoe'] ?? 0;
$expertise = trim((string) ($data['expertise'] ?? ''));
$area = trim((string) ($data['area'] ?? ''));
$registration_number = trim((string) ($data['registration_number'] ?? $data['registrationNumber'] ?? $data['regNumber'] ?? ''));
$hpr_registration_number = trim((string) ($data['hpr_registration_number'] ?? $data['hprNumber'] ?? $data['hprRegNumber'] ?? ''));
$status = trim((string) ($data['status'] ?? 'Active'));

/* =========================================
   REQUIRED FIELD VALIDATION
========================================= */

if (
    $full_name === '' ||
    $date_of_birth_input === '' ||
    $phone_number === '' ||
    $gender === '' ||
    $email === '' ||
    $expertise === '' ||
    $area === '' ||
    $registration_number === ''
) {
    echo json_encode([
        'status' => '0',
        'message' => 'Required fields are missing.'
    ]);
    exit;
}

/* =========================================
   VALIDATE GENDER
========================================= */

$gender = ucfirst(strtolower($gender));
$allowed_gender = ['Male', 'Female', 'Other'];

if (!in_array($gender, $allowed_gender, true)) {
    echo json_encode([
        'status' => '0',
        'message' => 'Invalid gender. Allowed values are Male, Female, Other.'
    ]);
    exit;
}

/* =========================================
   VALIDATE STATUS
========================================= */

$status = ucfirst(strtolower($status));
$allowed_status = ['Active', 'Inactive'];

if (!in_array($status, $allowed_status, true)) {
    $status = 'Active';
}

/* =========================================
   VALIDATE EMAIL
========================================= */

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'status' => '0',
        'message' => 'Invalid email address.'
    ]);
    exit;
}

/* =========================================
   VALIDATE & FORMAT DATE OF BIRTH
========================================= */

$formatted_dob = null;
$date_check = DateTime::createFromFormat('Y-m-d', $date_of_birth_input);

if ($date_check && $date_check->format('Y-m-d') === $date_of_birth_input) {
    $formatted_dob = $date_of_birth_input;
} else {
    $date_check_dmy = DateTime::createFromFormat('d/m/Y', $date_of_birth_input);
    if (!$date_check_dmy) {
        $date_check_dmy = DateTime::createFromFormat('d-m-Y', $date_of_birth_input);
    }
    if ($date_check_dmy) {
        $formatted_dob = $date_check_dmy->format('Y-m-d');
    } else {
        $timestamp = strtotime($date_of_birth_input);
        if ($timestamp !== false && $timestamp > 0) {
            $formatted_dob = date('Y-m-d', $timestamp);
        }
    }
}

if (!$formatted_dob) {
    echo json_encode([
        'status' => '0',
        'message' => 'Invalid date_of_birth. Use YYYY-MM-DD or DD/MM/YYYY format.'
    ]);
    exit;
}

/* =========================================
   VALIDATE YEARS OF EXPERIENCE
========================================= */

if (!is_numeric($years_of_experience) || intval($years_of_experience) < 0) {
    echo json_encode([
        'status' => '0',
        'message' => 'Years of experience must be a non-negative number.'
    ]);
    exit;
}

$years_of_experience = intval($years_of_experience);

/* =========================================
   CHECK DUPLICATE EMAIL
========================================= */

$check_email_stmt = mysqli_prepare($connection1, "SELECT id FROM doctors WHERE email = ? LIMIT 1");
if ($check_email_stmt) {
    mysqli_stmt_bind_param($check_email_stmt, "s", $email);
    mysqli_stmt_execute($check_email_stmt);
    mysqli_stmt_store_result($check_email_stmt);
    if (mysqli_stmt_num_rows($check_email_stmt) > 0) {
        mysqli_stmt_close($check_email_stmt);
        echo json_encode([
            'status' => '0',
            'message' => 'A doctor with this email already exists.'
        ]);
        exit;
    }
    mysqli_stmt_close($check_email_stmt);
}

/* =========================================
   CHECK DUPLICATE PHONE
========================================= */

$check_phone_stmt = mysqli_prepare($connection1, "SELECT id FROM doctors WHERE phone_number = ? LIMIT 1");
if ($check_phone_stmt) {
    mysqli_stmt_bind_param($check_phone_stmt, "s", $phone_number);
    mysqli_stmt_execute($check_phone_stmt);
    mysqli_stmt_store_result($check_phone_stmt);
    if (mysqli_stmt_num_rows($check_phone_stmt) > 0) {
        mysqli_stmt_close($check_phone_stmt);
        echo json_encode([
            'status' => '0',
            'message' => 'A doctor with this phone number already exists.'
        ]);
        exit;
    }
    mysqli_stmt_close($check_phone_stmt);
}

/* =========================================
   CHECK DUPLICATE REGISTRATION NUMBER
========================================= */

$check_reg_stmt = mysqli_prepare($connection1, "SELECT id FROM doctors WHERE registration_number = ? LIMIT 1");
if ($check_reg_stmt) {
    mysqli_stmt_bind_param($check_reg_stmt, "s", $registration_number);
    mysqli_stmt_execute($check_reg_stmt);
    mysqli_stmt_store_result($check_reg_stmt);
    if (mysqli_stmt_num_rows($check_reg_stmt) > 0) {
        mysqli_stmt_close($check_reg_stmt);
        echo json_encode([
            'status' => '0',
            'message' => 'A doctor with this registration number already exists.'
        ]);
        exit;
    }
    mysqli_stmt_close($check_reg_stmt);
}

/* =========================================
   CHECK DUPLICATE HPR REGISTRATION NUMBER
========================================= */

if ($hpr_registration_number !== '') {
    $check_hpr_stmt = mysqli_prepare($connection1, "SELECT id FROM doctors WHERE hpr_registration_number = ? LIMIT 1");
    if ($check_hpr_stmt) {
        mysqli_stmt_bind_param($check_hpr_stmt, "s", $hpr_registration_number);
        mysqli_stmt_execute($check_hpr_stmt);
        mysqli_stmt_store_result($check_hpr_stmt);
        if (mysqli_stmt_num_rows($check_hpr_stmt) > 0) {
            mysqli_stmt_close($check_hpr_stmt);
            echo json_encode([
                'status' => '0',
                'message' => 'A doctor with this HPR registration number already exists.'
            ]);
            exit;
        }
        mysqli_stmt_close($check_hpr_stmt);
    }
} else {
    $hpr_registration_number = null;
}

/* =========================================
   INSERT DOCTOR
========================================= */

$insert_query = "
    INSERT INTO doctors (
        full_name,
        date_of_birth,
        phone_number,
        gender,
        email,
        years_of_experience,
        expertise,
        area,
        registration_number,
        hpr_registration_number,
        status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
";

$stmt = mysqli_prepare($connection1, $insert_query);

if (!$stmt) {
    echo json_encode([
        'status' => '0',
        'message' => 'SQL prepare failed.',
        'error' => mysqli_error($connection1)
    ]);
    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    "sssssisssss",
    $full_name,
    $formatted_dob,
    $phone_number,
    $gender,
    $email,
    $years_of_experience,
    $expertise,
    $area,
    $registration_number,
    $hpr_registration_number,
    $status
);

if (mysqli_stmt_execute($stmt)) {
    $doctor_id = mysqli_insert_id($connection1);
    $doctorid = "DOC" . str_pad((string)$doctor_id, 6, "0", STR_PAD_LEFT);

    // Update doctorid code
    $update_stmt = mysqli_prepare($connection1, "UPDATE doctors SET doctorid = ? WHERE id = ?");
    if ($update_stmt) {
        mysqli_stmt_bind_param($update_stmt, "si", $doctorid, $doctor_id);
        mysqli_stmt_execute($update_stmt);
        mysqli_stmt_close($update_stmt);
    }

    mysqli_stmt_close($stmt);

    echo json_encode([
        'status' => '1',
        'message' => 'Doctor Added Successfully.',
        'id' => $doctor_id,
        'doctorid' => $doctorid,
        'data' => [
            'id' => $doctor_id,
            'doctorid' => $doctorid,
            'full_name' => $full_name,
            'date_of_birth' => $formatted_dob,
            'phone_number' => $phone_number,
            'gender' => $gender,
            'email' => $email,
            'years_of_experience' => $years_of_experience,
            'expertise' => $expertise,
            'area' => $area,
            'registration_number' => $registration_number,
            'hpr_registration_number' => $hpr_registration_number,
            'status' => $status
        ]
    ]);
} else {
    echo json_encode([
        'status' => '0',
        'message' => 'Doctor insert failed.',
        'error' => mysqli_stmt_error($stmt)
    ]);
    mysqli_stmt_close($stmt);
}

mysqli_close($connection1);
?>