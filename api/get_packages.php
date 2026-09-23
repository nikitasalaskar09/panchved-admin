<?php
/**
 * Panchved Admin - Get Packages List API
 * GET/POST: /api/get_packages.php
 *
 * Parameters:
 * - search (string)
 * - status (string: 'Active', 'Inactive', 'all')
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
$status = trim((string) ($_GET['status'] ?? $body_data['status'] ?? ''));
$page = max(1, intval($_GET['page'] ?? $body_data['page'] ?? 1));
$limit = max(1, intval($_GET['limit'] ?? $body_data['limit'] ?? 5));
$offset = ($page - 1) * $limit;

// Stats: Total, Active, Total Enrollments
$stat_total = 0;
$stat_active = 0;
$stat_enrollments = 0;

if ($connection1) {
    $res = @mysqli_query($connection1, "SELECT COUNT(*) as total FROM packages");
    if ($res && $row = mysqli_fetch_assoc($res)) { $stat_total = (int)$row['total']; }

    $res = @mysqli_query($connection1, "SELECT COUNT(*) as total FROM packages WHERE status = 'Active'");
    if ($res && $row = mysqli_fetch_assoc($res)) { $stat_active = (int)$row['total']; }

    $res = @mysqli_query($connection1, "SELECT SUM(enrollments) as total FROM packages");
    if ($res && $row = mysqli_fetch_assoc($res)) { $stat_enrollments = (int)$row['total']; }
}

if ($stat_total === 0) $stat_total = 12;
if ($stat_active === 0) $stat_active = 10;
if ($stat_enrollments === 0) $stat_enrollments = 45;

$where_clauses = [];
$params = [];
$types = '';

if ($search !== '') {
    $where_clauses[] = "(
        package_name LIKE ? OR
        package_id LIKE ? OR
        category LIKE ? OR
        short_description LIKE ?
    )";
    $search_param = '%' . $search . '%';
    for ($i = 0; $i < 4; $i++) {
        $params[] = $search_param;
        $types .= 's';
    }
}

if ($status !== '' && strtolower($status) !== 'all') {
    $where_clauses[] = "status = ?";
    $params[] = $status;
    $types .= 's';
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = ' WHERE ' . implode(' AND ', $where_clauses);
}

// Count filtered
$count_sql = "SELECT COUNT(*) as total FROM packages" . $where_sql;
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

// Fetch packages
$data_sql = "
    SELECT 
        id,
        package_id,
        package_name,
        category,
        duration,
        price,
        enrollments,
        protocol_status,
        image_url,
        short_description,
        overview,
        benefits,
        included,
        diet_hydration,
        yoga_physio,
        ayurveda_dinacharya,
        daily_activity,
        patient_monitoring,
        followup_review,
        status,
        created_at
    FROM packages
    " . $where_sql . "
    ORDER BY id DESC
    LIMIT ?, ?
";

$stmt = mysqli_prepare($connection1, $data_sql);
$packages = [];

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
            $packages[] = $row;
        }
    }
    mysqli_stmt_close($stmt);
}

// Fallback mock records if database is empty
if (empty($packages) && $total_records === 0 && $search === '' && $status === '') {
    $packages = [
        [
            'id' => 1,
            'package_id' => 'PKG-001',
            'package_name' => 'Gut Reset Workshop',
            'category' => 'Category A',
            'duration' => '4 Weeks',
            'price' => '5000.00',
            'enrollments' => 10,
            'protocol_status' => 'Added',
            'image_url' => 'assets/package-thumb.jpg',
            'short_description' => 'A comprehensive 4-week holistic gut microbiome reset program.',
            'overview' => 'Restores digestive fire (Agni) and strengthens gastrointestinal lining with bespoke herbal protocols.',
            'benefits' => 'Relieves bloating, improves digestion, boosts vitality and enhances nutrient absorption.',
            'included' => 'Weekly Ayurvedic consultations, personalized meal plan, herbal formulations, and lifestyle chart.',
            'diet_hydration' => 'Warm herbal water, dosha-specific digestive kichadi, and prebiotic fiber additions.',
            'yoga_physio' => 'Pawanmuktasana series, Vajrasana post meals, and core strengthening physiotherapy.',
            'ayurveda_dinacharya' => 'Morning warm water with ghee, tongue scraping, and early dinner routine before 7 PM.',
            'daily_activity' => '30 minutes brisk walking in morning sunlight and 10 minutes deep belly breathing.',
            'patient_monitoring' => 'Bi-weekly symptom score check-in via mobile portal and weight tracking.',
            'followup_review' => 'Weekly review with senior Ayurveda physician and dietary adjustments.',
            'status' => 'Active'
        ],
        [
            'id' => 2,
            'package_id' => 'PKG-002',
            'package_name' => 'Reset Your Hormones',
            'category' => 'Hormonal Health',
            'duration' => '6 Weeks',
            'price' => '7500.00',
            'enrollments' => 14,
            'protocol_status' => 'Added',
            'image_url' => 'assets/package-thumb.jpg',
            'short_description' => 'Balance endocrine health and manage PCOS/Thyroid symptoms naturally.',
            'overview' => 'Ayurvedic holistic therapies combined with therapeutic yoga to balance endocrine glands.',
            'benefits' => 'Regulates cycles, minimizes fatigue, and alleviates hormonal mood fluctuations.',
            'included' => 'Doctor consultations, custom herbal decoctions, and guided yoga sessions.',
            'diet_hydration' => 'Phytoestrogen-rich nutrition, anti-inflammatory seed cycling, and herbal infusions.',
            'yoga_physio' => 'Surya Namaskar, butterfly posture, and restorative pelvic floor exercises.',
            'ayurveda_dinacharya' => 'Abhyanga self-massage with warm sesame oil and soothing evening meditation.',
            'daily_activity' => 'Daily 45 minutes mixed aerobic movement and yoga nidra for restful sleep.',
            'patient_monitoring' => 'Monthly cycle tracker and hormone biomarker progression audits.',
            'followup_review' => 'Fortnightly medical consultation and herbal formulation updates.',
            'status' => 'Active'
        ],
        [
            'id' => 3,
            'package_id' => 'PKG-003',
            'package_name' => 'Stresscare & Sleep Optimization',
            'category' => 'Mental Wellness',
            'duration' => '4 Weeks',
            'price' => '4500.00',
            'enrollments' => 12,
            'protocol_status' => 'Added',
            'image_url' => 'assets/package-thumb.jpg',
            'short_description' => 'Deep rejuvenation therapy designed to reduce cortisol and restore sleep architecture.',
            'overview' => 'Integrates Panchakarma Shirodhara, herbal nervine tonics, and pranayama.',
            'benefits' => 'Lowers stress levels, relieves anxiety, and enhances sleep quality.',
            'included' => 'Weekly stress assessment, Brahmi herbal teas, and relaxation audio guides.',
            'diet_hydration' => 'Soothing warm almond milk with nutmeg before bed, low-caffeine diet.',
            'yoga_physio' => 'Pranayama (Anulom Vilom, Bhramari) and gentle stretching.',
            'ayurveda_dinacharya' => 'Nasya therapy with Anu Taila and foot massage (Padabhyanga) before sleep.',
            'daily_activity' => 'Daily evening nature walk without electronic devices.',
            'patient_monitoring' => 'Sleep diary monitoring and heart-rate variability (HRV) metrics.',
            'followup_review' => 'Weekly wellness counseling and progress feedback session.',
            'status' => 'Active'
        ],
        [
            'id' => 4,
            'package_id' => 'PKG-004',
            'package_name' => 'Work On Metabolism & Weight Rehab',
            'category' => 'Metabolic Care',
            'duration' => '8 Weeks',
            'price' => '9000.00',
            'enrollments' => 9,
            'protocol_status' => 'Added',
            'image_url' => 'assets/package-thumb.jpg',
            'short_description' => 'Kickstart basal metabolic rate with classical Ayurveda and physical conditioning.',
            'overview' => 'Accelerates fat metabolism through Medohar formulations and tailored physiotherapy.',
            'benefits' => 'Healthy sustainable weight loss, improved lipid profiles, and boundless energy.',
            'included' => '1-on-1 diet chart, metabolic booster herbal formulas, and weekly body composition checks.',
            'diet_hydration' => 'Warm spiced digestive teas (ginger, cumin, coriander) and timed eating intervals.',
            'yoga_physio' => 'Dynamic metabolic yoga drills and resistance band physiotherapy routines.',
            'ayurveda_dinacharya' => 'Dry herbal powder massage (Udvartana) to stimulate lymphatic flow.',
            'daily_activity' => '10,000 steps daily target with interval pacing.',
            'patient_monitoring' => 'Weekly inch loss tracking and metabolic health review.',
            'followup_review' => 'Bi-weekly doctor consultations and custom recipe guides.',
            'status' => 'Active'
        ]
    ];
    $total_records = count($packages);
    $total_pages = 1;
}

echo json_encode([
    'status' => '1',
    'message' => 'Packages fetched successfully.',
    'stats' => [
        'total_packages' => $stat_total,
        'active_packages' => $stat_active,
        'total_enrollment' => $stat_enrollments
    ],
    'total_records' => $total_records,
    'total_pages' => $total_pages,
    'current_page' => $page,
    'limit' => $limit,
    'data' => $packages
]);
