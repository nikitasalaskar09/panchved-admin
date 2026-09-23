<?php
/**
 * Panchved Admin - Get Single Package Details API
 * GET: /api/get_package.php?id=1 or ?package_id=PKG-001
 */

require_once __DIR__ . '/db_connect.php';

$id = intval($_GET['id'] ?? 0);
$package_id = trim((string) ($_GET['package_id'] ?? ''));

if ($id <= 0 && $package_id === '') {
    http_response_code(400);
    echo json_encode(['status' => '0', 'message' => 'Package id or package_id is required.']);
    exit;
}

$package = null;

if ($connection1) {
    if ($id > 0) {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM packages WHERE id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 'i', $id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $package = $row;
            }
            mysqli_stmt_close($stmt);
        }
    } else {
        $stmt = mysqli_prepare($connection1, "SELECT * FROM packages WHERE package_id = ? LIMIT 1");
        if ($stmt) {
            mysqli_stmt_bind_param($stmt, 's', $package_id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            if ($res && $row = mysqli_fetch_assoc($res)) {
                $package = $row;
            }
            mysqli_stmt_close($stmt);
        }
    }
}

if (!$package) {
    http_response_code(404);
    echo json_encode(['status' => '0', 'message' => 'Package not found.']);
    exit;
}

echo json_encode([
    'status' => '1',
    'message' => 'Package details fetched successfully.',
    'data' => $package
]);
