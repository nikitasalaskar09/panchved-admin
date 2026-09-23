-- ============================================================================
-- Panchved Complete Ayurved & Physiotherapy Rehab Center
-- Database Schema SQL Script
-- Database: jewrzsmy_panchved / jcwrzsmy_panchved
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ----------------------------------------------------------------------------
-- Table: doctors
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `doctorid` VARCHAR(50) DEFAULT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
  `email` VARCHAR(150) NOT NULL,
  `years_of_experience` INT(11) NOT NULL DEFAULT 0,
  `expertise` VARCHAR(150) NOT NULL,
  `area` VARCHAR(150) NOT NULL,
  `registration_number` VARCHAR(100) NOT NULL,
  `hpr_registration_number` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_doctorid` (`doctorid`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_phone` (`phone_number`),
  UNIQUE KEY `idx_reg_number` (`registration_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed Data for Doctors
INSERT INTO `doctors` (`id`, `doctorid`, `full_name`, `date_of_birth`, `phone_number`, `gender`, `email`, `years_of_experience`, `expertise`, `area`, `registration_number`, `hpr_registration_number`, `status`) VALUES
(1, 'DOC000001', 'Dr. Nidhi Jha', '1986-06-15', '9876543210', 'Female', 'drnidhi@gmail.com', 12, 'Ayurveda Physician', 'Pediatrics & Gynecology', 'AYU1234', 'HPR1234', 'Active'),
(2, 'DOC000002', 'Dr. Rahul Sharma', '1988-04-20', '9823456789', 'Male', 'rahulsharma@gmail.com', 10, 'Physiotherapist', 'Orthopedic & Sports Rehab', 'PHY5678', 'HPR5678', 'Active'),
(3, 'DOC000003', 'Dr. Priya Patel', '1990-11-12', '9811223344', 'Female', 'priyapatel@gmail.com', 8, 'Panchakarma Specialist', 'Detox & Rejuvenation', 'AYU9012', 'HPR9012', 'Active'),
(4, 'DOC000004', 'Dr. Amit Deshmukh', '1982-02-28', '9833445566', 'Male', 'amitdeshmukh@gmail.com', 16, 'Ayurvedic Consultant', 'Chronic Disease Management', 'AYU3456', 'HPR3456', 'Active'),
(5, 'DOC000005', 'Dr. Sneha Kulkarni', '1992-09-05', '9877889900', 'Female', 'snehak@gmail.com', 6, 'Neuro-Physiotherapist', 'Neurological Rehab', 'PHY7890', 'HPR7890', 'Inactive')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);


-- ----------------------------------------------------------------------------
-- Table: patients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `patient_id` VARCHAR(50) DEFAULT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `dob` DATE DEFAULT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
  `email` VARCHAR(150) DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_patient_id` (`patient_id`),
  KEY `idx_patient_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- Table: appointments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` VARCHAR(50) DEFAULT NULL,
  `patient_id` INT(11) NOT NULL,
  `doctor_id` INT(11) NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `service_type` VARCHAR(150) NOT NULL,
  `status` ENUM('Upcoming', 'Completed', 'Cancelled', 'Pending') NOT NULL DEFAULT 'Upcoming',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_appointment_id` (`appointment_id`),
  KEY `fk_appointment_patient` (`patient_id`),
  KEY `fk_appointment_doctor` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- Table: packages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `package_id` VARCHAR(50) DEFAULT NULL,
  `package_name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `duration_days` INT(11) NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `description` TEXT DEFAULT NULL,
  `features` TEXT DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_package_id` (`package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- Table: workshops
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workshops` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `workshop_id` VARCHAR(50) DEFAULT NULL,
  `title` VARCHAR(150) NOT NULL,
  `instructor` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `capacity` INT(11) NOT NULL DEFAULT 50,
  `enrolled` INT(11) NOT NULL DEFAULT 0,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Upcoming', 'Completed', 'Cancelled', 'Active') NOT NULL DEFAULT 'Upcoming',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_workshop_id` (`workshop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- Table: users (Admin & Staff)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'Admin',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
