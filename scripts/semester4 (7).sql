-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Jul 15, 2025 at 03:32 AM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `semester4`
--

-- --------------------------------------------------------

--
-- Table structure for table `Customer`
--

CREATE TABLE `Customer` (
  `Invoice_Id` int NOT NULL,
  `Tanggal_Order` date NOT NULL,
  `Harga_Total` int NOT NULL,
  `id_restaurant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Customer`
--

INSERT INTO `Customer` (`Invoice_Id`, `Tanggal_Order`, `Harga_Total`, `id_restaurant`) VALUES
(1, '2024-07-01', 45000, 1),
(2, '2024-07-01', 35000, 2),
(3, '2024-07-02', 30000, 3),
(4, '2024-07-02', 70000, 4),
(5, '2024-07-03', 25000, 5),
(6, '2024-07-03', 40000, 1),
(7, '2024-07-04', 27000, 2),
(8, '2024-07-04', 36000, 3),
(9, '2024-07-05', 55000, 4),
(10, '2024-07-05', 33000, 5),
(11, '2024-07-06', 20000, 1),
(12, '2024-07-06', 50000, 2),
(13, '2024-07-07', 28000, 3),
(14, '2024-07-07', 32000, 4),
(15, '2024-07-08', 41000, 5),
(16, '2024-07-08', 38000, 1),
(17, '2024-07-09', 29000, 2),
(18, '2024-07-09', 45000, 3),
(19, '2024-07-10', 62000, 4),
(20, '2024-07-10', 26000, 5),
(21, '2024-07-11', 35000, 1),
(22, '2024-07-11', 42000, 2),
(23, '2024-07-12', 31000, 3),
(24, '2024-07-12', 48000, 4),
(25, '2024-07-13', 37000, 5),
(26, '2024-01-15', 85000, 1),
(27, '2024-01-16', 45000, 2),
(28, '2024-01-17', 67000, 3),
(29, '2024-01-18', 120000, 4),
(30, '2024-01-19', 38000, 5),
(31, '2024-01-20', 92000, 1),
(32, '2024-01-21', 55000, 2),
(33, '2024-01-22', 73000, 3),
(34, '2024-01-23', 105000, 4),
(35, '2024-01-24', 41000, 5),
(36, '2024-01-25', 63000, 1),
(37, '2024-01-26', 78000, 2),
(38, '2024-01-27', 52000, 3),
(39, '2024-01-28', 89000, 4),
(40, '2024-01-29', 34000, 5),
(41, '2024-01-30', 76000, 1),
(42, '2024-01-31', 58000, 2),
(43, '2024-02-01', 94000, 3),
(44, '2024-02-02', 126000, 4),
(45, '2024-02-03', 47000, 5),
(46, '2024-02-04', 81000, 1),
(47, '2024-02-05', 59000, 2),
(48, '2024-02-06', 72000, 3),
(49, '2024-02-07', 113000, 4),
(50, '2024-02-08', 43000, 5),
(51, '2024-02-09', 88000, 1),
(52, '2024-02-10', 65000, 2),
(53, '2024-02-11', 77000, 3),
(54, '2024-02-12', 102000, 4),
(55, '2024-02-13', 39000, 5),
(56, '2024-02-14', 91000, 1),
(57, '2024-02-15', 54000, 2),
(58, '2024-02-16', 68000, 3),
(59, '2024-02-17', 118000, 4),
(60, '2024-02-18', 46000, 5),
(61, '2024-02-19', 83000, 1),
(62, '2024-02-20', 57000, 2),
(63, '2024-02-21', 75000, 3),
(64, '2024-02-22', 108000, 4),
(65, '2024-02-23', 42000, 5),
(66, '2024-02-24', 86000, 1),
(67, '2024-02-25', 61000, 2),
(68, '2024-02-26', 79000, 3),
(69, '2024-02-27', 115000, 4),
(70, '2024-02-28', 48000, 5),
(71, '2024-03-01', 87000, 1),
(72, '2024-03-02', 64000, 2),
(73, '2024-03-03', 71000, 3),
(74, '2024-03-04', 109000, 4),
(75, '2024-03-05', 44000, 5),
(76, '2024-03-06', 92000, 1),
(77, '2024-03-07', 56000, 2),
(78, '2024-03-08', 74000, 3),
(79, '2024-03-09', 121000, 4),
(80, '2024-03-10', 49000, 5),
(81, '2024-03-11', 85000, 1),
(82, '2024-03-12', 62000, 2),
(83, '2024-03-13', 78000, 3),
(84, '2024-03-14', 114000, 4),
(85, '2024-03-15', 41000, 5),
(86, '2024-03-16', 89000, 1),
(87, '2024-03-17', 58000, 2),
(88, '2024-03-18', 76000, 3),
(89, '2024-03-19', 117000, 4),
(90, '2024-03-20', 45000, 5),
(91, '2024-03-21', 93000, 1),
(92, '2024-03-22', 67000, 2),
(93, '2024-03-23', 82000, 3),
(94, '2024-03-24', 125000, 4),
(95, '2024-03-25', 51000, 5),
(96, '2024-03-26', 88000, 1),
(97, '2024-03-27', 59000, 2),
(98, '2024-03-28', 73000, 3),
(99, '2024-03-29', 111000, 4),
(100, '2024-03-30', 47000, 5),
(101, '2024-04-01', 96000, 1),
(102, '2024-04-02', 63000, 2),
(103, '2024-04-03', 80000, 3),
(104, '2024-04-04', 128000, 4),
(105, '2024-04-05', 52000, 5),
(106, '2024-04-06', 91000, 1),
(107, '2024-04-07', 65000, 2),
(108, '2024-04-08', 77000, 3),
(109, '2024-04-09', 119000, 4),
(110, '2024-04-10', 48000, 5),
(111, '2024-04-11', 84000, 1),
(112, '2024-04-12', 61000, 2),
(113, '2024-04-13', 75000, 3),
(114, '2024-04-14', 112000, 4),
(115, '2024-04-15', 43000, 5),
(116, '2024-04-16', 87000, 1),
(117, '2024-04-17', 56000, 2),
(118, '2024-04-18', 72000, 3),
(119, '2024-04-19', 116000, 4),
(120, '2024-04-20', 46000, 5),
(121, '2024-04-21', 89000, 1),
(122, '2024-04-22', 64000, 2),
(123, '2024-04-23', 78000, 3),
(124, '2024-04-24', 123000, 4),
(125, '2024-04-25', 49000, 5),
(126, '2024-04-26', 92000, 1),
(127, '2024-04-27', 58000, 2),
(128, '2024-04-28', 74000, 3),
(129, '2024-04-29', 118000, 4),
(130, '2024-04-30', 51000, 5),
(131, '2024-05-01', 95000, 1),
(132, '2024-05-02', 67000, 2),
(133, '2024-05-03', 83000, 3),
(134, '2024-05-04', 131000, 4),
(135, '2024-05-05', 54000, 5),
(136, '2024-05-06', 88000, 1),
(137, '2024-05-07', 62000, 2),
(138, '2024-05-08', 76000, 3),
(139, '2024-05-09', 114000, 4),
(140, '2024-05-10', 45000, 5),
(141, '2024-05-11', 91000, 1),
(142, '2024-05-12', 59000, 2),
(143, '2024-05-13', 73000, 3),
(144, '2024-05-14', 107000, 4),
(145, '2024-05-15', 41000, 5),
(146, '2024-05-16', 86000, 1),
(147, '2024-05-17', 55000, 2),
(148, '2024-05-18', 71000, 3),
(149, '2024-05-19', 113000, 4),
(150, '2024-05-20', 48000, 5),
(151, '2024-05-21', 94000, 1),
(152, '2024-05-22', 66000, 2),
(153, '2024-05-23', 79000, 3),
(154, '2024-05-24', 122000, 4),
(155, '2024-05-25', 52000, 5),
(156, '2024-05-26', 89000, 1),
(157, '2024-05-27', 61000, 2),
(158, '2024-05-28', 75000, 3),
(159, '2024-05-29', 115000, 4),
(160, '2024-05-30', 47000, 5),
(161, '2024-05-31', 93000, 1),
(162, '2024-06-01', 68000, 2),
(163, '2024-06-02', 82000, 3),
(164, '2024-06-03', 127000, 4),
(165, '2024-06-04', 53000, 5),
(166, '2024-06-05', 90000, 1),
(167, '2024-06-06', 64000, 2),
(168, '2024-06-07', 77000, 3),
(169, '2024-06-08', 119000, 4),
(170, '2024-06-09', 46000, 5),
(171, '2024-06-10', 87000, 1),
(172, '2024-06-11', 57000, 2),
(173, '2024-06-12', 72000, 3),
(174, '2024-06-13', 108000, 4),
(175, '2024-06-14', 44000, 5),
(176, '2024-06-15', 92000, 1),
(177, '2024-06-16', 63000, 2),
(178, '2024-06-17', 78000, 3),
(179, '2024-06-18', 124000, 4),
(180, '2024-06-19', 50000, 5),
(181, '2024-06-20', 85000, 1),
(182, '2024-06-21', 60000, 2),
(183, '2024-06-22', 74000, 3),
(184, '2024-06-23', 117000, 4),
(185, '2024-06-24', 42000, 5),
(186, '2024-06-25', 91000, 1),
(187, '2024-06-26', 65000, 2),
(188, '2024-06-27', 80000, 3),
(189, '2024-06-28', 126000, 4),
(190, '2024-06-29', 49000, 5),
(191, '2024-06-30', 88000, 1),
(192, '2024-07-01', 75000, 2),
(193, '2024-07-01', 42000, 3),
(194, '2024-07-01', 89000, 4),
(195, '2024-07-01', 38000, 5),
(196, '2024-07-02', 67000, 1),
(197, '2024-07-02', 54000, 2),
(198, '2024-07-02', 91000, 3),
(199, '2024-07-02', 76000, 4),
(200, '2024-07-02', 43000, 5),
(201, '2024-07-03', 82000, 1),
(202, '2024-07-03', 59000, 2),
(203, '2024-07-03', 95000, 3),
(204, '2024-07-03', 71000, 4),
(205, '2024-07-03', 46000, 5),
(206, '2024-07-04', 88000, 1),
(207, '2024-07-04', 64000, 2),
(208, '2024-07-04', 97000, 3),
(209, '2024-07-04', 73000, 4),
(210, '2024-07-04', 49000, 5),
(211, '2024-07-05', 86000, 1),
(212, '2024-07-05', 62000, 2),
(213, '2024-07-05', 93000, 3),
(214, '2024-07-05', 78000, 4),
(215, '2024-07-05', 52000, 5),
(216, '2024-07-06', 79000, 1),
(217, '2024-07-06', 56000, 2),
(218, '2024-07-06', 84000, 3),
(219, '2024-07-06', 69000, 4),
(220, '2024-07-06', 41000, 5),
(221, '2024-07-07', 92000, 1),
(222, '2024-07-07', 68000, 2),
(223, '2024-07-07', 87000, 3),
(224, '2024-07-07', 75000, 4),
(225, '2024-07-07', 48000, 5),
(226, '2024-07-08', 83000, 1),
(227, '2024-07-08', 61000, 2),
(228, '2024-07-08', 96000, 3),
(229, '2024-07-08', 72000, 4),
(230, '2024-07-08', 47000, 5),
(231, '2024-07-09', 85000, 1),
(232, '2024-07-09', 63000, 2),
(233, '2024-07-09', 89000, 3),
(234, '2024-07-09', 77000, 4),
(235, '2024-07-09', 51000, 5),
(236, '2024-07-10', 81000, 1),
(237, '2024-07-10', 57000, 2),
(238, '2024-07-10', 94000, 3),
(239, '2024-07-10', 74000, 4),
(240, '2024-07-10', 44000, 5),
(241, '2024-07-11', 90000, 1),
(242, '2024-07-11', 66000, 2),
(243, '2024-07-11', 98000, 3),
(244, '2024-07-11', 80000, 4),
(245, '2024-07-11', 53000, 5),
(246, '2024-07-12', 87000, 1),
(247, '2024-07-12', 65000, 2),
(248, '2024-07-12', 91000, 3),
(249, '2024-07-12', 76000, 4),
(250, '2024-07-12', 50000, 5),
(251, '2024-07-13', 88000, 1),
(252, '2024-07-13', 67000, 2),
(253, '2024-07-13', 93000, 3),
(254, '2024-07-13', 79000, 4),
(255, '2024-07-13', 55000, 5),
(301, '2025-07-01', 85000, 1),
(302, '2025-07-01', 65000, 2),
(303, '2025-07-01', 45000, 3),
(304, '2025-07-01', 120000, 4),
(305, '2025-07-01', 55000, 5),
(306, '2025-07-02', 75000, 1),
(307, '2025-07-02', 90000, 2),
(308, '2025-07-02', 38000, 3),
(309, '2025-07-02', 95000, 4),
(310, '2025-07-02', 42000, 5),
(311, '2025-07-03', 68000, 1),
(312, '2025-07-03', 72000, 2),
(313, '2025-07-03', 51000, 3),
(314, '2025-07-03', 110000, 4),
(315, '2025-07-03', 39000, 5),
(316, '2025-07-04', 92000, 1),
(317, '2025-07-04', 58000, 2),
(318, '2025-07-04', 47000, 3),
(319, '2025-07-04', 135000, 4),
(320, '2025-07-04', 61000, 5),
(321, '2025-07-05', 78000, 1),
(322, '2025-07-05', 83000, 2),
(323, '2025-07-05', 43000, 3),
(324, '2025-07-05', 98000, 4),
(325, '2025-07-05', 52000, 5),
(326, '2025-07-06', 115000, 1),
(327, '2025-07-06', 125000, 2),
(328, '2025-07-06', 67000, 3),
(329, '2025-07-06', 145000, 4),
(330, '2025-07-06', 72000, 5),
(331, '2025-07-07', 89000, 1),
(332, '2025-07-07', 94000, 2),
(333, '2025-07-07', 56000, 3),
(334, '2025-07-07', 118000, 4),
(335, '2025-07-07', 48000, 5),
(336, '2025-07-08', 71000, 1),
(337, '2025-07-08', 76000, 2),
(338, '2025-07-08', 41000, 3),
(339, '2025-07-08', 102000, 4),
(340, '2025-07-08', 58000, 5),
(341, '2025-07-09', 84000, 1),
(342, '2025-07-09', 87000, 2),
(343, '2025-07-09', 49000, 3),
(344, '2025-07-09', 125000, 4),
(345, '2025-07-09', 54000, 5),
(346, '2025-07-10', 96000, 1),
(347, '2025-07-10', 69000, 2),
(348, '2025-07-10', 44000, 3),
(349, '2025-07-10', 112000, 4),
(350, '2025-07-10', 59000, 5),
(351, '2025-07-11', 77000, 1),
(352, '2025-07-11', 82000, 2),
(353, '2025-07-11', 53000, 3),
(354, '2025-07-11', 108000, 4),
(355, '2025-07-11', 46000, 5),
(356, '2025-07-12', 128000, 1),
(357, '2025-07-12', 115000, 2),
(358, '2025-07-12', 73000, 3),
(359, '2025-07-12', 155000, 4),
(360, '2025-07-12', 82000, 5),
(361, '2025-07-13', 134000, 1),
(362, '2025-07-13', 121000, 2),
(363, '2025-07-13', 68000, 3),
(364, '2025-07-13', 142000, 4),
(365, '2025-07-13', 75000, 5),
(366, '2025-07-14', 91000, 1),
(367, '2025-07-14', 86000, 2),
(368, '2025-07-14', 57000, 3),
(369, '2025-07-14', 119000, 4),
(370, '2025-07-14', 63000, 5),
(371, '2025-07-15', 88000, 1),
(372, '2025-07-15', 92000, 2),
(373, '2025-07-15', 51000, 3),
(374, '2025-07-15', 127000, 4),
(375, '2025-07-15', 66000, 5),
(376, '2025-06-01', 75000, 1),
(377, '2025-06-01', 62000, 2),
(378, '2025-06-02', 48000, 3),
(379, '2025-06-02', 95000, 4),
(380, '2025-06-03', 53000, 5),
(381, '2025-06-05', 88000, 1),
(382, '2025-06-07', 71000, 2),
(383, '2025-06-10', 44000, 3),
(384, '2025-06-12', 102000, 4),
(385, '2025-06-15', 59000, 5),
(386, '2025-06-18', 84000, 1),
(387, '2025-06-20', 67000, 2),
(388, '2025-06-22', 52000, 3),
(389, '2025-06-25', 115000, 4),
(390, '2025-06-28', 61000, 5),
(391, '2025-06-30', 79000, 1),
(392, '2025-05-05', 82000, 1),
(393, '2025-05-08', 69000, 2),
(394, '2025-05-12', 45000, 3),
(395, '2025-05-15', 108000, 4),
(396, '2025-05-18', 56000, 5),
(397, '2025-05-22', 91000, 1),
(398, '2025-05-25', 73000, 2),
(399, '2025-05-28', 47000, 3),
(400, '2025-05-30', 124000, 4);

-- --------------------------------------------------------

--
-- Table structure for table `CUSTOMER_FEEDBACK`
--

CREATE TABLE `CUSTOMER_FEEDBACK` (
  `id_feedback` int NOT NULL,
  `id_customer` int NOT NULL,
  `id_restaurant` int NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` text,
  `feedback_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','hidden') DEFAULT 'pending',
  `response_from_restaurant` text,
  `response_date` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `CUSTOMER_FEEDBACK`
--

INSERT INTO `CUSTOMER_FEEDBACK` (`id_feedback`, `id_customer`, `id_restaurant`, `rating`, `comment`, `feedback_date`, `status`, `response_from_restaurant`, `response_date`) VALUES
(1, 26, 1, 5, 'Gudeg nya enak banget! Pelayanan juga sangat memuaskan. Pasti akan balik lagi!', '2024-07-01 08:30:00', 'approved', NULL, NULL),
(2, 31, 1, 4, 'Makanan enak, tapi agak lama nunggu. Overall bagus sih.', '2024-07-01 11:45:00', 'approved', NULL, NULL),
(3, 36, 1, 5, 'Ayam goreng kremes nya juara! Renyah dan bumbu meresap sempurna.', '2024-07-02 05:20:00', 'approved', NULL, NULL),
(4, 41, 1, 3, 'Rasa standar aja, tidak terlalu istimewa. Harga sesuai dengan kualitas.', '2024-07-02 12:15:00', 'approved', NULL, NULL),
(5, 46, 1, 5, 'Best gudeg in town! Staff nya ramah-ramah dan tempatnya bersih.', '2024-07-03 07:10:00', 'approved', NULL, NULL),
(6, 51, 1, 4, 'Enak banget! Cuma porsi agak kecil untuk harga segitu.', '2024-07-03 13:30:00', 'approved', NULL, NULL),
(7, 56, 1, 5, 'Authentic taste! Reminds me of my grandmother\'s cooking.', '2024-07-04 06:45:00', 'approved', NULL, NULL),
(8, 61, 1, 2, 'Makanan dingin waktu dihidangkan. Pelayanan kurang responsif.', '2024-07-04 09:20:00', 'approved', NULL, NULL),
(9, 66, 1, 4, 'Good food, reasonable price. Will come back with family.', '2024-07-05 04:30:00', 'approved', NULL, NULL),
(10, 71, 1, 5, 'Outstanding! Everything was perfect from food to service.', '2024-07-05 10:50:00', 'approved', NULL, NULL),
(11, 27, 2, 4, 'Rendang nya mantap! Coffee juga enak. Recommended buat meeting.', '2024-07-01 09:15:00', 'approved', NULL, NULL),
(12, 32, 2, 5, 'Suasana cozy, wifi kenceng, makanan enak. Perfect untuk WFH!', '2024-07-01 14:00:00', 'approved', NULL, NULL),
(13, 37, 2, 3, 'Makanan okay, tapi agak mahal untuk porsi segitu.', '2024-07-02 06:30:00', 'approved', NULL, NULL),
(14, 42, 2, 4, 'Gado-gado nya fresh, pisang goreng crispy. Good place to chill.', '2024-07-02 11:20:00', 'approved', NULL, NULL),
(15, 47, 2, 5, 'Love the ambiance! Food is great and service is excellent.', '2024-07-03 08:45:00', 'approved', NULL, NULL),
(16, 52, 2, 2, 'Kopi tubruk nya terlalu pahit, gado-gado kurang bumbu kacang.', '2024-07-03 12:30:00', 'approved', NULL, NULL),
(17, 57, 2, 4, 'Nice place for hangout. Jus alpukat nya creamy banget!', '2024-07-04 07:15:00', 'approved', NULL, NULL),
(18, 62, 2, 5, 'Best rendang ever! Will definitely bring friends here.', '2024-07-04 13:45:00', 'approved', NULL, NULL),
(19, 67, 2, 3, 'Average food, nice place though. Good for photos.', '2024-07-05 05:10:00', 'approved', NULL, NULL),
(20, 72, 2, 4, 'Good vibes, decent food. Pisang goreng nya recommended!', '2024-07-05 09:30:00', 'approved', NULL, NULL),
(21, 28, 3, 5, 'Nasi liwet nya the best! Ikan bakar fresh dan bumbu nya pas.', '2024-07-01 10:20:00', 'approved', NULL, NULL),
(22, 33, 3, 4, 'Makanan home style banget. Sayur asem nya seger!', '2024-07-01 13:15:00', 'approved', NULL, NULL),
(23, 38, 3, 3, 'Okay lah, tapi nothing special. Harga affordable.', '2024-07-02 07:45:00', 'approved', NULL, NULL),
(24, 43, 3, 5, 'Feels like eating at home! Portion besar dan rasa autentik.', '2024-07-02 12:30:00', 'approved', NULL, NULL),
(25, 48, 3, 4, 'Ikan bakar nya juicy, kerupuk udang crispy. Recommended!', '2024-07-03 09:20:00', 'approved', NULL, NULL),
(26, 53, 3, 2, 'Sayur asem nya hambar, ikan bakar gosong. Disappointed.', '2024-07-03 11:45:00', 'approved', NULL, NULL),
(27, 58, 3, 5, 'Traditional taste yang authentic! Love the nasi liwet.', '2024-07-04 08:30:00', 'approved', NULL, NULL),
(28, 63, 3, 4, 'Good Indonesian food. Simple but tasty.', '2024-07-04 14:15:00', 'approved', NULL, NULL),
(29, 68, 3, 3, 'Standard warung food. Nothing extraordinary but decent.', '2024-07-05 06:20:00', 'approved', NULL, NULL),
(30, 73, 3, 5, 'Best nasi liwet in the area! Fresh ingredients.', '2024-07-05 10:40:00', 'approved', NULL, NULL),
(31, 29, 4, 5, 'Nasi padang terlengkap! Dendeng balado nya spicy and delicious.', '2024-07-01 11:30:00', 'approved', NULL, NULL),
(32, 34, 4, 4, 'Authentic Padang food! Gulai kambing nya rich in flavor.', '2024-07-01 14:45:00', 'approved', NULL, NULL),
(33, 39, 4, 5, 'Spicy level perfect! Semua lauk nya enak banget.', '2024-07-02 08:15:00', 'approved', NULL, NULL),
(34, 44, 4, 3, 'Pedas banget! Mungkin kurang cocok buat yang ga tahan pedes.', '2024-07-02 13:00:00', 'approved', NULL, NULL),
(35, 49, 4, 5, 'Best Padang restaurant! Rendang nya melted in mouth.', '2024-07-03 10:30:00', 'approved', NULL, NULL),
(36, 54, 4, 4, 'Teh tarik nya authentic, makanan pedas tapi enak.', '2024-07-03 12:45:00', 'approved', NULL, NULL),
(37, 59, 4, 2, 'Terlalu pedas, kerupuk jangek nya keras. Not my taste.', '2024-07-04 09:45:00', 'approved', NULL, NULL),
(38, 64, 4, 5, 'Incredible spices! Real Padang taste. Highly recommended!', '2024-07-04 15:20:00', 'approved', NULL, NULL),
(39, 69, 4, 4, 'Rich flavor, generous portion. Good value for money.', '2024-07-05 07:30:00', 'approved', NULL, NULL),
(40, 74, 4, 5, 'Gulai kambing nya top! Spicy but so flavorful.', '2024-07-05 11:50:00', 'approved', NULL, NULL),
(41, 30, 5, 4, 'Nasi pecel nya enak! Tempe mendoan crispy dan fresh.', '2024-07-01 12:15:00', 'approved', NULL, NULL),
(42, 35, 5, 5, 'Traditional Javanese food at its best! Soto ayam nya clear and tasty.', '2024-07-01 15:30:00', 'approved', NULL, NULL),
(43, 40, 5, 3, 'Biasa aja sih. Wedang jahe nya kurang pedes.', '2024-07-02 09:45:00', 'approved', NULL, NULL),
(44, 45, 5, 4, 'Homey atmosphere, good traditional food. Ketan bakar nya sweet!', '2024-07-02 14:15:00', 'approved', NULL, NULL),
(45, 50, 5, 5, 'Love the pecel sauce! Perfect blend of spices.', '2024-07-03 11:20:00', 'approved', NULL, NULL),
(46, 55, 5, 2, 'Tempe mendoan nya berminyak, soto ayam kurang gurih.', '2024-07-03 13:45:00', 'approved', NULL, NULL),
(47, 60, 5, 4, 'Comfort food banget! Reminds me of village food.', '2024-07-04 10:30:00', 'approved', NULL, NULL),
(48, 65, 5, 5, 'Authentic Javanese taste! Everything was perfect.', '2024-07-04 16:15:00', 'approved', NULL, NULL),
(49, 70, 5, 3, 'Decent food, reasonable price. Nothing fancy but okay.', '2024-07-05 08:45:00', 'approved', NULL, NULL),
(50, 75, 5, 4, 'Good traditional menu. Wedang jahe nya warming!', '2024-07-05 12:20:00', 'approved', NULL, NULL),
(51, 192, 2, 5, 'Cafe favorite! Suasana cozy, makanan enak, wifi cepat. Perfect!', '2024-07-01 13:30:00', 'approved', NULL, NULL),
(52, 193, 3, 4, 'Nasi liwet nya authentic banget. Feels like home cooking.', '2024-07-02 07:20:00', 'approved', NULL, NULL),
(53, 194, 4, 5, 'Pedas nya pas! Rendang dan gulai kambing nya juara.', '2024-07-02 12:45:00', 'approved', NULL, NULL),
(54, 195, 5, 3, 'Standard warung food. Tempe mendoan okay, soto biasa aja.', '2024-07-03 06:15:00', 'approved', NULL, NULL),
(55, 196, 1, 5, 'Gudeg legendaris! Texture dan rasa nya perfect.', '2024-07-03 09:50:00', 'approved', NULL, NULL),
(56, 197, 2, 4, 'Good place for work meeting. Food dan coffee quality bagus.', '2024-07-04 04:30:00', 'approved', NULL, NULL),
(57, 198, 3, 2, 'Ikan bakar nya kurang fresh, sayur asem hambar.', '2024-07-04 11:15:00', 'pending', NULL, NULL),
(58, 199, 4, 5, 'Spice level on point! Best Padang food in town.', '2024-07-05 08:40:00', 'approved', NULL, NULL),
(59, 200, 5, 4, 'Traditional taste yang autentik. Pecel sauce nya enak!', '2024-07-05 13:25:00', 'approved', NULL, NULL),
(60, 201, 1, 3, 'Enak sih, tapi agak mahal untuk porsi segitu.', '2024-07-06 05:45:00', 'approved', NULL, NULL),
(61, 202, 2, 5, 'Love this place! Great for both casual and business meeting.', '2024-07-06 10:20:00', 'approved', NULL, NULL),
(62, 203, 3, 4, 'Home style cooking yang comforting. Recommended!', '2024-07-07 07:30:00', 'approved', NULL, NULL),
(63, 204, 4, 5, 'Every dish is flavorful! Can\'t get enough of the rendang.', '2024-07-07 14:10:00', 'approved', NULL, NULL),
(64, 205, 5, 3, 'Okay food, nothing extraordinary. Price is reasonable though.', '2024-07-08 09:15:00', 'approved', NULL, NULL),
(65, 26, 1, 5, 'Gudeg nya enak banget! Pelayanan juga sangat memuaskan. Pasti akan balik lagi!', '2024-07-01 08:30:00', 'approved', NULL, NULL),
(66, 31, 1, 4, 'Makanan enak, tapi agak lama nunggu. Overall bagus sih.', '2024-07-01 11:45:00', 'approved', NULL, NULL),
(67, 36, 1, 5, 'Ayam goreng kremes nya juara! Renyah dan bumbu meresap sempurna.', '2024-07-02 05:20:00', 'approved', NULL, NULL),
(68, 41, 1, 3, 'Rasa standar aja, tidak terlalu istimewa. Harga sesuai dengan kualitas.', '2024-07-02 12:15:00', 'approved', NULL, NULL),
(69, 46, 1, 5, 'Best gudeg in town! Staff nya ramah-ramah dan tempatnya bersih.', '2024-07-03 07:10:00', 'approved', NULL, NULL),
(70, 51, 1, 4, 'Enak banget! Cuma porsi agak kecil untuk harga segitu.', '2024-07-03 13:30:00', 'approved', NULL, NULL),
(71, 56, 1, 5, 'Authentic taste! Reminds me of my grandmother cooking.', '2024-07-04 06:45:00', 'approved', NULL, NULL),
(72, 61, 1, 2, 'Makanan dingin waktu dihidangkan. Pelayanan kurang responsif.', '2024-07-04 09:20:00', 'approved', NULL, NULL),
(73, 66, 1, 4, 'Good food, reasonable price. Will come back with family.', '2024-07-05 04:30:00', 'approved', NULL, NULL),
(74, 71, 1, 5, 'Outstanding! Everything was perfect from food to service.', '2024-07-05 10:50:00', 'approved', NULL, NULL),
(75, 27, 2, 4, 'Rendang nya mantap! Coffee juga enak. Recommended buat meeting.', '2024-07-01 09:15:00', 'approved', NULL, NULL),
(76, 32, 2, 5, 'Suasana cozy, wifi kenceng, makanan enak. Perfect untuk WFH!', '2024-07-01 14:00:00', 'approved', NULL, NULL),
(77, 37, 2, 3, 'Makanan okay, tapi agak mahal untuk porsi segitu.', '2024-07-02 06:30:00', 'approved', NULL, NULL),
(78, 42, 2, 4, 'Gado-gado nya fresh, pisang goreng crispy. Good place to chill.', '2024-07-02 11:20:00', 'approved', NULL, NULL),
(79, 47, 2, 5, 'Love the ambiance! Food is great and service is excellent.', '2024-07-03 08:45:00', 'approved', NULL, NULL),
(80, 52, 2, 2, 'Kopi tubruk nya terlalu pahit, gado-gado kurang bumbu kacang.', '2024-07-03 12:30:00', 'approved', NULL, NULL),
(81, 57, 2, 4, 'Nice place for hangout. Jus alpukat nya creamy banget!', '2024-07-04 07:15:00', 'approved', NULL, NULL),
(82, 62, 2, 5, 'Best rendang ever! Will definitely bring friends here.', '2024-07-04 13:45:00', 'approved', NULL, NULL),
(83, 67, 2, 3, 'Average food, nice place though. Good for photos.', '2024-07-05 05:10:00', 'approved', NULL, NULL),
(84, 72, 2, 4, 'Good vibes, decent food. Pisang goreng nya recommended!', '2024-07-05 09:30:00', 'approved', NULL, NULL),
(85, 28, 3, 5, 'Nasi liwet nya the best! Ikan bakar fresh dan bumbu nya pas.', '2024-07-01 10:20:00', 'approved', NULL, NULL),
(86, 33, 3, 4, 'Makanan home style banget. Sayur asem nya seger!', '2024-07-01 13:15:00', 'approved', NULL, NULL),
(87, 38, 3, 3, 'Okay lah, tapi nothing special. Harga affordable.', '2024-07-02 07:45:00', 'approved', NULL, NULL),
(88, 43, 3, 5, 'Feels like eating at home! Portion besar dan rasa autentik.', '2024-07-02 12:30:00', 'approved', NULL, NULL),
(89, 48, 3, 4, 'Ikan bakar nya juicy, kerupuk udang crispy. Recommended!', '2024-07-03 09:20:00', 'approved', NULL, NULL),
(90, 53, 3, 2, 'Sayur asem nya hambar, ikan bakar gosong. Disappointed.', '2024-07-03 11:45:00', 'approved', NULL, NULL),
(91, 58, 3, 5, 'Traditional taste yang authentic! Love the nasi liwet.', '2024-07-04 08:30:00', 'approved', NULL, NULL),
(92, 63, 3, 4, 'Good Indonesian food. Simple but tasty.', '2024-07-04 14:15:00', 'approved', NULL, NULL),
(93, 68, 3, 3, 'Standard warung food. Nothing extraordinary but decent.', '2024-07-05 06:20:00', 'approved', NULL, NULL),
(94, 73, 3, 5, 'Best nasi liwet in the area! Fresh ingredients.', '2024-07-05 10:40:00', 'approved', NULL, NULL),
(95, 29, 4, 5, 'Nasi padang terlengkap! Dendeng balado nya spicy and delicious.', '2024-07-01 11:30:00', 'approved', NULL, NULL),
(96, 34, 4, 4, 'Authentic Padang food! Gulai kambing nya rich in flavor.', '2024-07-01 14:45:00', 'approved', NULL, NULL),
(97, 39, 4, 5, 'Spicy level perfect! Semua lauk nya enak banget.', '2024-07-02 08:15:00', 'approved', NULL, NULL),
(98, 44, 4, 3, 'Pedas banget! Mungkin kurang cocok buat yang ga tahan pedes.', '2024-07-02 13:00:00', 'approved', NULL, NULL),
(99, 49, 4, 5, 'Best Padang restaurant! Rendang nya melted in mouth.', '2024-07-03 10:30:00', 'approved', NULL, NULL),
(100, 54, 4, 4, 'Teh tarik nya authentic, makanan pedas tapi enak.', '2024-07-03 12:45:00', 'approved', NULL, NULL),
(101, 59, 4, 2, 'Terlalu pedas, kerupuk jangek nya keras. Not my taste.', '2024-07-04 09:45:00', 'approved', NULL, NULL),
(102, 64, 4, 5, 'Incredible spices! Real Padang taste. Highly recommended!', '2024-07-04 15:20:00', 'approved', NULL, NULL),
(103, 69, 4, 4, 'Rich flavor, generous portion. Good value for money.', '2024-07-05 07:30:00', 'approved', NULL, NULL),
(104, 74, 4, 5, 'Gulai kambing nya top! Spicy but so flavorful.', '2024-07-05 11:50:00', 'approved', NULL, NULL),
(105, 30, 5, 4, 'Nasi pecel nya enak! Tempe mendoan crispy dan fresh.', '2024-07-01 12:15:00', 'approved', NULL, NULL),
(106, 35, 5, 5, 'Traditional Javanese food at its best! Soto ayam nya clear and tasty.', '2024-07-01 15:30:00', 'approved', NULL, NULL),
(107, 40, 5, 3, 'Biasa aja sih. Wedang jahe nya kurang pedes.', '2024-07-02 09:45:00', 'approved', NULL, NULL),
(108, 45, 5, 4, 'Homey atmosphere, good traditional food. Ketan bakar nya sweet!', '2024-07-02 14:15:00', 'approved', NULL, NULL),
(109, 50, 5, 5, 'Love the pecel sauce! Perfect blend of spices.', '2024-07-03 11:20:00', 'approved', NULL, NULL),
(110, 55, 5, 2, 'Tempe mendoan nya berminyak, soto ayam kurang gurih.', '2024-07-03 13:45:00', 'approved', NULL, NULL),
(111, 60, 5, 4, 'Comfort food banget! Reminds me of village food.', '2024-07-04 10:30:00', 'approved', NULL, NULL),
(112, 65, 5, 5, 'Authentic Javanese taste! Everything was perfect.', '2024-07-04 16:15:00', 'approved', NULL, NULL),
(113, 70, 5, 3, 'Decent food, reasonable price. Nothing fancy but okay.', '2024-07-05 08:45:00', 'approved', NULL, NULL),
(114, 75, 5, 4, 'Good traditional menu. Wedang jahe nya warming!', '2024-07-05 12:20:00', 'approved', NULL, NULL),
(115, 192, 2, 5, 'Cafe favorite! Suasana cozy, makanan enak, wifi cepat. Perfect!', '2024-07-01 13:30:00', 'approved', NULL, NULL),
(116, 193, 3, 4, 'Nasi liwet nya authentic banget. Feels like home cooking.', '2024-07-02 07:20:00', 'approved', NULL, NULL),
(117, 194, 4, 5, 'Pedas nya pas! Rendang dan gulai kambing nya juara.', '2024-07-02 12:45:00', 'approved', NULL, NULL),
(118, 195, 5, 3, 'Standard warung food. Tempe mendoan okay, soto biasa aja.', '2024-07-03 06:15:00', 'approved', NULL, NULL),
(119, 196, 1, 5, 'Gudeg legendaris! Texture dan rasa nya perfect.', '2024-07-03 09:50:00', 'approved', NULL, NULL),
(120, 197, 2, 4, 'Good place for work meeting. Food dan coffee quality bagus.', '2024-07-04 04:30:00', 'approved', NULL, NULL),
(121, 198, 3, 2, 'Ikan bakar nya kurang fresh, sayur asem hambar.', '2024-07-04 11:15:00', 'pending', NULL, NULL),
(122, 199, 4, 5, 'Spice level on point! Best Padang food in town.', '2024-07-05 08:40:00', 'approved', NULL, NULL),
(123, 200, 5, 4, 'Traditional taste yang autentik. Pecel sauce nya enak!', '2024-07-05 13:25:00', 'approved', NULL, NULL),
(124, 26, 1, 5, 'Gudeg nya enak banget! Pelayanan juga sangat memuaskan. Pasti akan balik lagi!', '2024-07-01 08:30:00', 'approved', NULL, NULL),
(125, 31, 1, 4, 'Makanan enak, tapi agak lama nunggu. Overall bagus sih.', '2024-07-01 11:45:00', 'approved', NULL, NULL),
(126, 36, 1, 5, 'Ayam goreng kremes nya juara! Renyah dan bumbu meresap sempurna.', '2024-07-02 05:20:00', 'approved', NULL, NULL),
(127, 41, 1, 3, 'Rasa standar aja, tidak terlalu istimewa. Harga sesuai dengan kualitas.', '2024-07-02 12:15:00', 'approved', NULL, NULL),
(128, 46, 1, 5, 'Best gudeg in town! Staff nya ramah-ramah dan tempatnya bersih.', '2024-07-03 07:10:00', 'approved', NULL, NULL),
(129, 51, 1, 4, 'Enak banget! Cuma porsi agak kecil untuk harga segitu.', '2024-07-03 13:30:00', 'approved', NULL, NULL),
(130, 56, 1, 5, 'Authentic taste! Reminds me of my grandmother cooking.', '2024-07-04 06:45:00', 'approved', NULL, NULL),
(131, 61, 1, 2, 'Makanan dingin waktu dihidangkan. Pelayanan kurang responsif.', '2024-07-04 09:20:00', 'approved', NULL, NULL),
(132, 66, 1, 4, 'Good food, reasonable price. Will come back with family.', '2024-07-05 04:30:00', 'approved', NULL, NULL),
(133, 71, 1, 5, 'Outstanding! Everything was perfect from food to service.', '2024-07-05 10:50:00', 'approved', NULL, NULL),
(134, 27, 2, 4, 'Rendang nya mantap! Coffee juga enak. Recommended buat meeting.', '2024-07-01 09:15:00', 'approved', NULL, NULL),
(135, 32, 2, 5, 'Suasana cozy, wifi kenceng, makanan enak. Perfect untuk WFH!', '2024-07-01 14:00:00', 'approved', NULL, NULL),
(136, 37, 2, 3, 'Makanan okay, tapi agak mahal untuk porsi segitu.', '2024-07-02 06:30:00', 'approved', NULL, NULL),
(137, 42, 2, 4, 'Gado-gado nya fresh, pisang goreng crispy. Good place to chill.', '2024-07-02 11:20:00', 'approved', NULL, NULL),
(138, 47, 2, 5, 'Love the ambiance! Food is great and service is excellent.', '2024-07-03 08:45:00', 'approved', NULL, NULL),
(139, 52, 2, 2, 'Kopi tubruk nya terlalu pahit, gado-gado kurang bumbu kacang.', '2024-07-03 12:30:00', 'approved', NULL, NULL),
(140, 57, 2, 4, 'Nice place for hangout. Jus alpukat nya creamy banget!', '2024-07-04 07:15:00', 'approved', NULL, NULL),
(141, 62, 2, 5, 'Best rendang ever! Will definitely bring friends here.', '2024-07-04 13:45:00', 'approved', NULL, NULL),
(142, 67, 2, 3, 'Average food, nice place though. Good for photos.', '2024-07-05 05:10:00', 'approved', NULL, NULL),
(143, 72, 2, 4, 'Good vibes, decent food. Pisang goreng nya recommended!', '2024-07-05 09:30:00', 'approved', NULL, NULL),
(144, 28, 3, 5, 'Nasi liwet nya the best! Ikan bakar fresh dan bumbu nya pas.', '2024-07-01 10:20:00', 'approved', NULL, NULL),
(145, 33, 3, 4, 'Makanan home style banget. Sayur asem nya seger!', '2024-07-01 13:15:00', 'approved', NULL, NULL),
(146, 38, 3, 3, 'Okay lah, tapi nothing special. Harga affordable.', '2024-07-02 07:45:00', 'approved', NULL, NULL),
(147, 43, 3, 5, 'Feels like eating at home! Portion besar dan rasa autentik.', '2024-07-02 12:30:00', 'approved', NULL, NULL),
(148, 48, 3, 4, 'Ikan bakar nya juicy, kerupuk udang crispy. Recommended!', '2024-07-03 09:20:00', 'approved', NULL, NULL),
(149, 53, 3, 2, 'Sayur asem nya hambar, ikan bakar gosong. Disappointed.', '2024-07-03 11:45:00', 'approved', NULL, NULL),
(150, 58, 3, 5, 'Traditional taste yang authentic! Love the nasi liwet.', '2024-07-04 08:30:00', 'approved', NULL, NULL),
(151, 63, 3, 4, 'Good Indonesian food. Simple but tasty.', '2024-07-04 14:15:00', 'approved', NULL, NULL),
(152, 68, 3, 3, 'Standard warung food. Nothing extraordinary but decent.', '2024-07-05 06:20:00', 'approved', NULL, NULL),
(153, 73, 3, 5, 'Best nasi liwet in the area! Fresh ingredients.', '2024-07-05 10:40:00', 'approved', NULL, NULL),
(154, 29, 4, 5, 'Nasi padang terlengkap! Dendeng balado nya spicy and delicious.', '2024-07-01 11:30:00', 'approved', NULL, NULL),
(155, 34, 4, 4, 'Authentic Padang food! Gulai kambing nya rich in flavor.', '2024-07-01 14:45:00', 'approved', NULL, NULL),
(156, 39, 4, 5, 'Spicy level perfect! Semua lauk nya enak banget.', '2024-07-02 08:15:00', 'approved', NULL, NULL),
(157, 44, 4, 3, 'Pedas banget! Mungkin kurang cocok buat yang ga tahan pedes.', '2024-07-02 13:00:00', 'approved', NULL, NULL),
(158, 49, 4, 5, 'Best Padang restaurant! Rendang nya melted in mouth.', '2024-07-03 10:30:00', 'approved', NULL, NULL),
(159, 54, 4, 4, 'Teh tarik nya authentic, makanan pedas tapi enak.', '2024-07-03 12:45:00', 'approved', NULL, NULL),
(160, 59, 4, 2, 'Terlalu pedas, kerupuk jangek nya keras. Not my taste.', '2024-07-04 09:45:00', 'approved', NULL, NULL),
(161, 64, 4, 5, 'Incredible spices! Real Padang taste. Highly recommended!', '2024-07-04 15:20:00', 'approved', NULL, NULL),
(162, 69, 4, 4, 'Rich flavor, generous portion. Good value for money.', '2024-07-05 07:30:00', 'approved', NULL, NULL),
(163, 74, 4, 5, 'Gulai kambing nya top! Spicy but so flavorful.', '2024-07-05 11:50:00', 'approved', NULL, NULL),
(164, 30, 5, 4, 'Nasi pecel nya enak! Tempe mendoan crispy dan fresh.', '2024-07-01 12:15:00', 'approved', NULL, NULL),
(165, 35, 5, 5, 'Traditional Javanese food at its best! Soto ayam nya clear and tasty.', '2024-07-01 15:30:00', 'approved', NULL, NULL),
(166, 40, 5, 3, 'Biasa aja sih. Wedang jahe nya kurang pedes.', '2024-07-02 09:45:00', 'approved', NULL, NULL),
(167, 45, 5, 4, 'Homey atmosphere, good traditional food. Ketan bakar nya sweet!', '2024-07-02 14:15:00', 'approved', NULL, NULL),
(168, 50, 5, 5, 'Love the pecel sauce! Perfect blend of spices.', '2024-07-03 11:20:00', 'approved', NULL, NULL),
(169, 55, 5, 2, 'Tempe mendoan nya berminyak, soto ayam kurang gurih.', '2024-07-03 13:45:00', 'approved', NULL, NULL),
(170, 60, 5, 4, 'Comfort food banget! Reminds me of village food.', '2024-07-04 10:30:00', 'approved', NULL, NULL),
(171, 65, 5, 5, 'Authentic Javanese taste! Everything was perfect.', '2024-07-04 16:15:00', 'approved', NULL, NULL),
(172, 70, 5, 3, 'Decent food, reasonable price. Nothing fancy but okay.', '2024-07-05 08:45:00', 'approved', NULL, NULL),
(173, 75, 5, 4, 'Good traditional menu. Wedang jahe nya warming!', '2024-07-05 12:20:00', 'approved', NULL, NULL),
(174, 192, 2, 5, 'Cafe favorite! Suasana cozy, makanan enak, wifi cepat. Perfect!', '2024-07-01 13:30:00', 'approved', NULL, NULL),
(175, 193, 3, 4, 'Nasi liwet nya authentic banget. Feels like home cooking.', '2024-07-02 07:20:00', 'approved', NULL, NULL),
(176, 194, 4, 5, 'Pedas nya pas! Rendang dan gulai kambing nya juara.', '2024-07-02 12:45:00', 'approved', NULL, NULL),
(177, 195, 5, 3, 'Standard warung food. Tempe mendoan okay, soto biasa aja.', '2024-07-03 06:15:00', 'approved', NULL, NULL),
(178, 196, 1, 5, 'Gudeg legendaris! Texture dan rasa nya perfect.', '2024-07-03 09:50:00', 'approved', NULL, NULL),
(179, 197, 2, 4, 'Good place for work meeting. Food dan coffee quality bagus.', '2024-07-04 04:30:00', 'approved', NULL, NULL),
(180, 198, 3, 2, 'Ikan bakar nya kurang fresh, sayur asem hambar.', '2024-07-04 11:15:00', 'pending', NULL, NULL),
(181, 199, 4, 5, 'Spice level on point! Best Padang food in town.', '2024-07-05 08:40:00', 'approved', NULL, NULL),
(182, 200, 5, 4, 'Traditional taste yang autentik. Pecel sauce nya enak!', '2024-07-05 13:25:00', 'approved', NULL, NULL),
(183, 201, 1, 3, 'Enak sih, tapi agak mahal untuk porsi segitu.', '2024-07-06 05:45:00', 'approved', NULL, NULL),
(184, 202, 2, 5, 'Love this place! Great for both casual and business meeting.', '2024-07-06 10:20:00', 'approved', NULL, NULL),
(185, 203, 3, 4, 'Home style cooking yang comforting. Recommended!', '2024-07-07 07:30:00', 'approved', NULL, NULL),
(186, 204, 4, 5, 'Every dish is flavorful! Cannot get enough of the rendang.', '2024-07-07 14:10:00', 'approved', NULL, NULL),
(187, 205, 5, 3, 'Okay food, nothing extraordinary. Price is reasonable though.', '2024-07-08 09:15:00', 'approved', NULL, NULL),
(188, 1, 1, 5, 'Gudeg nya enak banget! Pelayanan sangat memuaskan.', '2024-07-01 08:30:00', 'approved', NULL, NULL),
(189, 2, 1, 4, 'Makanan enak, tapi agak lama nunggu. Overall bagus.', '2024-07-02 11:45:00', 'approved', NULL, NULL),
(190, 3, 2, 5, 'Suasana cozy, wifi kenceng, makanan enak. Perfect!', '2024-07-03 14:00:00', 'approved', NULL, NULL),
(191, 4, 2, 3, 'Makanan okay, tapi agak mahal untuk porsi segitu.', '2024-07-04 06:30:00', 'approved', NULL, NULL),
(192, 5, 3, 5, 'Nasi liwet nya the best! Ikan bakar fresh.', '2024-07-05 10:20:00', 'approved', NULL, NULL),
(193, 6, 3, 4, 'Makanan home style banget. Sayur asem seger!', '2024-07-06 13:15:00', 'approved', NULL, NULL),
(194, 7, 4, 5, 'Nasi padang terlengkap! Dendeng balado spicy.', '2024-07-07 11:30:00', 'approved', NULL, NULL),
(195, 8, 4, 4, 'Authentic Padang food! Gulai kambing rich.', '2024-07-08 14:45:00', 'approved', NULL, NULL),
(196, 9, 5, 4, 'Nasi pecel enak! Tempe mendoan crispy.', '2024-07-09 12:15:00', 'approved', NULL, NULL),
(197, 10, 5, 5, 'Traditional Javanese food at its best!', '2024-07-10 15:30:00', 'approved', NULL, NULL),
(198, 1, 1, 5, 'Gudeg enak banget!', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(199, 2, 1, 4, 'Pelayanan bagus', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(200, 3, 2, 5, 'Tempat cozy', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(201, 4, 2, 3, 'Harga agak mahal', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(202, 5, 3, 5, 'Nasi liwet the best!', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(203, 6, 3, 4, 'Makanan homestyle', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(204, 7, 4, 5, 'Rendang mantap!', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(205, 8, 4, 4, 'Pedas tapi enak', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(206, 9, 5, 4, 'Tempe mendoan crispy', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(207, 10, 5, 5, 'Soto ayam jernih', '2025-07-14 16:46:17', 'approved', NULL, NULL),
(208, 301, 1, 5, 'Gudeg nya mantap! Pelayanan cepat dan ramah.', '2025-07-01 13:30:00', 'approved', NULL, NULL),
(209, 302, 2, 4, 'Cafe nya cozy, wifi kenceng. Cocok untuk WFH!', '2025-07-01 14:15:00', 'approved', NULL, NULL),
(210, 304, 4, 5, 'Rendang nya juara! Authentic banget rasanya.', '2025-07-01 12:45:00', 'approved', NULL, NULL),
(211, 306, 1, 4, 'Makanan enak, porsi cukup. Recommended!', '2025-07-02 13:00:00', 'approved', NULL, NULL),
(212, 308, 3, 5, 'Nasi liwet nya the best! Fresh dan enak.', '2025-07-02 11:30:00', 'approved', NULL, NULL),
(213, 315, 5, 4, 'Pecel sauce nya mantap! Traditional taste.', '2025-07-03 12:20:00', 'approved', NULL, NULL),
(214, 320, 5, 5, 'Soto ayam nya clear dan gurih banget!', '2025-07-04 13:45:00', 'approved', NULL, NULL),
(215, 325, 5, 3, 'Okay lah, standard warung food.', '2025-07-05 11:15:00', 'approved', NULL, NULL),
(216, 330, 5, 5, 'Best traditional food! Portion besar.', '2025-07-06 14:00:00', 'approved', NULL, NULL),
(217, 335, 5, 4, 'Good comfort food. Reminds me of home.', '2025-07-07 12:30:00', 'approved', NULL, NULL),
(218, 340, 5, 2, 'Tempe mendoan berminyak, kurang crispy.', '2025-07-08 13:10:00', 'pending', NULL, NULL),
(219, 345, 5, 5, 'Perfect! Everything was delicious.', '2025-07-09 11:45:00', 'approved', NULL, NULL),
(220, 350, 5, 4, 'Traditional menu yang authentic.', '2025-07-10 12:15:00', 'approved', NULL, NULL),
(221, 355, 5, 5, 'Wedang jahe nya hangat dan enak!', '2025-07-11 13:30:00', 'approved', NULL, NULL),
(222, 365, 5, 4, 'Good Javanese food experience.', '2025-07-13 14:45:00', 'approved', NULL, NULL),
(223, 370, 5, 3, 'Decent food, reasonable price.', '2025-07-14 12:00:00', 'approved', NULL, NULL),
(224, 375, 5, 5, 'Amazing traditional taste! Highly recommended.', '2025-07-15 13:15:00', 'approved', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `MEMESAN_MENU`
--

CREATE TABLE `MEMESAN_MENU` (
  `id_pemesanan_menu` int NOT NULL,
  `id_menu` int NOT NULL,
  `kuantitas` int NOT NULL,
  `id_customer` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `MEMESAN_MENU`
--

INSERT INTO `MEMESAN_MENU` (`id_pemesanan_menu`, `id_menu`, `kuantitas`, `id_customer`) VALUES
(1, 1, 1, 1),
(2, 2, 1, 1),
(3, 6, 1, 2),
(4, 11, 1, 3),
(5, 13, 1, 3),
(6, 16, 1, 4),
(7, 18, 1, 4),
(8, 21, 1, 5),
(9, 23, 1, 5),
(10, 4, 2, 6),
(11, 5, 1, 6),
(12, 7, 1, 7),
(13, 8, 1, 7),
(14, 12, 1, 8),
(15, 14, 1, 8),
(16, 17, 1, 9),
(17, 19, 2, 9),
(18, 22, 1, 10),
(19, 24, 2, 10),
(20, 1, 1, 11),
(21, 9, 2, 12),
(22, 10, 2, 12),
(23, 11, 1, 13),
(24, 15, 1, 13),
(25, 16, 1, 14),
(26, 20, 1, 14),
(27, 21, 1, 15),
(28, 25, 2, 15),
(29, 2, 1, 16),
(30, 3, 2, 16),
(31, 6, 1, 17),
(32, 8, 1, 17),
(33, 12, 1, 18),
(34, 13, 2, 18),
(35, 17, 1, 19),
(36, 18, 2, 19),
(37, 20, 1, 20),
(38, 22, 1, 21),
(39, 24, 1, 22),
(40, 3, 3, 23),
(41, 5, 2, 24),
(42, 7, 1, 25),
(43, 1, 2, 26),
(44, 3, 1, 26),
(45, 2, 1, 27),
(46, 6, 1, 28),
(47, 11, 1, 29),
(48, 13, 1, 29),
(49, 16, 2, 30),
(50, 18, 1, 31),
(51, 21, 1, 32),
(52, 23, 2, 33),
(53, 4, 1, 34),
(54, 5, 1, 35),
(55, 7, 2, 36),
(56, 8, 1, 37),
(57, 9, 1, 38),
(58, 10, 2, 39),
(59, 12, 1, 40),
(60, 14, 1, 41),
(61, 15, 3, 42),
(62, 17, 1, 43),
(63, 19, 2, 44),
(64, 20, 1, 45),
(65, 22, 1, 46),
(66, 24, 1, 47),
(67, 25, 2, 48),
(68, 1, 1, 49),
(69, 2, 2, 50),
(70, 3, 1, 51),
(71, 6, 1, 52),
(72, 7, 1, 53),
(73, 8, 2, 54),
(74, 11, 1, 55),
(75, 12, 1, 56),
(76, 13, 2, 57),
(77, 16, 1, 58),
(78, 17, 1, 59),
(79, 18, 2, 60),
(80, 21, 1, 61),
(81, 22, 1, 62),
(82, 23, 1, 63),
(83, 4, 2, 64),
(84, 5, 1, 65),
(85, 9, 1, 66),
(86, 10, 2, 67),
(87, 14, 1, 68),
(88, 15, 1, 69),
(89, 19, 2, 70),
(90, 20, 1, 71),
(91, 24, 1, 72),
(92, 25, 2, 73),
(93, 1, 1, 74),
(94, 2, 1, 75),
(95, 3, 2, 76),
(96, 6, 1, 77),
(97, 7, 1, 78),
(98, 8, 1, 79),
(99, 11, 2, 80),
(100, 12, 1, 81),
(101, 1, 2, 192),
(102, 3, 1, 192),
(103, 6, 1, 193),
(104, 8, 2, 193),
(105, 11, 1, 194),
(106, 13, 1, 194),
(107, 16, 2, 195),
(108, 18, 1, 195),
(109, 21, 1, 196),
(110, 23, 2, 196),
(111, 2, 1, 197),
(112, 4, 1, 197),
(113, 7, 2, 198),
(114, 9, 1, 198),
(115, 12, 1, 199),
(116, 14, 2, 199),
(117, 17, 1, 200),
(118, 19, 1, 200),
(119, 22, 2, 201),
(120, 24, 1, 201),
(121, 1, 3, 202),
(122, 5, 1, 202),
(123, 6, 2, 203),
(124, 10, 1, 203),
(125, 11, 1, 204),
(126, 15, 2, 204),
(127, 16, 1, 205),
(128, 20, 1, 205),
(129, 21, 2, 206),
(130, 25, 1, 206),
(131, 2, 1, 207),
(132, 3, 3, 207),
(133, 7, 1, 208),
(134, 8, 2, 208),
(135, 12, 1, 209),
(136, 13, 1, 209),
(137, 17, 2, 210),
(138, 18, 1, 210),
(139, 22, 1, 211),
(140, 23, 2, 211),
(141, 1, 1, 212),
(142, 4, 2, 212),
(143, 6, 1, 213),
(144, 9, 1, 213),
(145, 11, 2, 214),
(146, 14, 1, 214),
(147, 16, 1, 215),
(148, 19, 2, 215),
(149, 21, 1, 216),
(150, 24, 1, 216),
(101, 1, 2, 192),
(102, 3, 1, 192),
(103, 6, 1, 193),
(104, 8, 2, 193),
(105, 11, 1, 194),
(106, 13, 1, 194),
(107, 16, 2, 195),
(108, 18, 1, 195),
(109, 21, 1, 196),
(110, 23, 2, 196),
(111, 2, 1, 197),
(112, 4, 1, 197),
(113, 7, 2, 198),
(114, 9, 1, 198),
(115, 12, 1, 199),
(116, 14, 2, 199),
(117, 17, 1, 200),
(118, 19, 1, 200),
(119, 22, 2, 201),
(120, 24, 1, 201),
(121, 1, 3, 202),
(122, 5, 1, 202),
(123, 6, 2, 203),
(124, 10, 1, 203),
(125, 11, 1, 204),
(126, 15, 2, 204),
(127, 16, 1, 205),
(128, 20, 1, 205),
(129, 21, 2, 206),
(130, 25, 1, 206),
(131, 2, 1, 207),
(132, 3, 3, 207),
(133, 7, 1, 208),
(134, 8, 2, 208),
(135, 12, 1, 209),
(136, 13, 1, 209),
(137, 17, 2, 210),
(138, 18, 1, 210),
(139, 22, 1, 211),
(140, 23, 2, 211),
(141, 1, 1, 212),
(142, 4, 2, 212),
(143, 6, 1, 213),
(144, 9, 1, 213),
(145, 11, 2, 214),
(146, 14, 1, 214),
(147, 16, 1, 215),
(148, 19, 2, 215),
(149, 21, 1, 216),
(150, 24, 1, 216),
(151, 2, 2, 217),
(152, 5, 1, 217),
(153, 7, 1, 218),
(154, 9, 1, 218),
(155, 12, 2, 219),
(156, 14, 1, 219),
(157, 17, 1, 220),
(158, 19, 1, 220),
(159, 22, 2, 221),
(160, 25, 1, 221),
(161, 1, 1, 222),
(162, 3, 2, 222),
(163, 6, 1, 223),
(164, 8, 1, 223),
(165, 11, 2, 224),
(166, 13, 1, 224),
(167, 16, 1, 225),
(168, 18, 2, 225),
(169, 21, 1, 226),
(170, 23, 1, 226),
(101, 1, 2, 192),
(102, 3, 1, 192),
(103, 6, 1, 193),
(104, 8, 2, 193),
(105, 11, 1, 194),
(106, 13, 1, 194),
(107, 16, 2, 195),
(108, 18, 1, 195),
(109, 21, 1, 196),
(110, 23, 2, 196),
(111, 2, 1, 197),
(112, 4, 1, 197),
(113, 7, 2, 198),
(114, 9, 1, 198),
(115, 12, 1, 199),
(116, 14, 2, 199),
(117, 17, 1, 200),
(118, 19, 1, 200),
(119, 22, 2, 201),
(120, 24, 1, 201),
(121, 1, 3, 202),
(122, 5, 1, 202),
(123, 6, 2, 203),
(124, 10, 1, 203),
(125, 11, 1, 204),
(126, 15, 2, 204),
(127, 16, 1, 205),
(128, 20, 1, 205),
(129, 21, 2, 206),
(130, 25, 1, 206),
(131, 2, 1, 207),
(132, 3, 3, 207),
(133, 7, 1, 208),
(134, 8, 2, 208),
(135, 12, 1, 209),
(136, 13, 1, 209),
(137, 17, 2, 210),
(138, 18, 1, 210),
(139, 22, 1, 211),
(140, 23, 2, 211),
(141, 1, 1, 212),
(142, 4, 2, 212),
(143, 6, 1, 213),
(144, 9, 1, 213),
(145, 11, 2, 214),
(146, 14, 1, 214),
(147, 16, 1, 215),
(148, 19, 2, 215),
(149, 21, 1, 216),
(150, 24, 1, 216),
(151, 2, 2, 217),
(152, 5, 1, 217),
(153, 7, 1, 218),
(154, 9, 1, 218),
(155, 12, 2, 219),
(156, 14, 1, 219),
(157, 17, 1, 220),
(158, 19, 1, 220),
(159, 22, 2, 221),
(160, 25, 1, 221),
(300, 1, 2, 301),
(301, 2, 1, 301),
(302, 6, 1, 302),
(303, 8, 2, 302),
(304, 11, 1, 303),
(305, 13, 1, 303),
(306, 16, 1, 304),
(307, 18, 1, 304),
(308, 21, 1, 305),
(309, 23, 2, 305),
(310, 1, 1, 306),
(311, 3, 1, 306),
(312, 6, 2, 307),
(313, 9, 1, 307),
(314, 11, 1, 308),
(315, 14, 1, 308),
(316, 16, 2, 309),
(317, 19, 1, 309),
(318, 21, 1, 310),
(319, 24, 1, 310),
(320, 2, 1, 311),
(321, 4, 1, 311),
(322, 7, 1, 312),
(323, 10, 2, 312),
(324, 12, 1, 313),
(325, 15, 1, 313),
(326, 17, 1, 314),
(327, 20, 2, 314),
(328, 22, 1, 315),
(329, 25, 1, 315),
(330, 1, 3, 316),
(331, 5, 1, 316),
(332, 6, 1, 317),
(333, 8, 1, 317),
(334, 11, 2, 318),
(335, 13, 1, 318),
(336, 16, 1, 319),
(337, 18, 2, 319),
(338, 21, 2, 320),
(339, 23, 1, 320),
(340, 2, 2, 321),
(341, 4, 1, 321),
(342, 7, 2, 322),
(343, 9, 1, 322),
(344, 12, 1, 323),
(345, 14, 1, 323),
(346, 17, 2, 324),
(347, 19, 1, 324),
(348, 22, 1, 325),
(349, 24, 2, 325),
(350, 1, 2, 326),
(351, 2, 2, 326),
(352, 3, 1, 326),
(353, 6, 2, 327),
(354, 7, 1, 327),
(355, 10, 2, 327),
(356, 11, 1, 328),
(357, 12, 2, 328),
(358, 16, 2, 329),
(359, 17, 1, 329),
(360, 18, 1, 329),
(361, 21, 2, 330),
(362, 22, 1, 330),
(363, 25, 2, 330);

-- --------------------------------------------------------

--
-- Table structure for table `MEMESAN_PAKET`
--

CREATE TABLE `MEMESAN_PAKET` (
  `id_pemesanan_paket` int NOT NULL,
  `id_menu` int NOT NULL,
  `kuantitas` int NOT NULL,
  `Id_customer` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `MEMESAN_PAKET`
--

INSERT INTO `MEMESAN_PAKET` (`id_pemesanan_paket`, `id_menu`, `kuantitas`, `Id_customer`) VALUES
(1, 1, 2, 26),
(2, 2, 1, 45),
(3, 3, 1, 67),
(4, 4, 2, 89),
(5, 5, 1, 125),
(6, 1, 1, 158),
(7, 2, 1, 172),
(8, 4, 1, 185);

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `Id_Menu` int NOT NULL,
  `Gambar` longblob NOT NULL,
  `Nama_Menu` text NOT NULL,
  `Deskripsi` text NOT NULL,
  `Kategori` text NOT NULL,
  `Harga` int NOT NULL,
  `Status` tinyint(1) NOT NULL,
  `id_restaurant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`Id_Menu`, `Gambar`, `Nama_Menu`, `Deskripsi`, `Kategori`, `Harga`, `Status`, `id_restaurant`) VALUES
(1, 0x474946383961, 'Nasi Gudeg', 'Gudeg khas Yogyakarta dengan kuah santan yang gurih', 'Makanan Utama', 25000, 1, 1),
(2, 0x474946383961, 'Ayam Goreng Kremes', 'Ayam goreng dengan kremes yang renyah', 'Makanan Utama', 20000, 1, 1),
(3, 0x474946383961, 'Es Teh Manis', 'Es teh manis segar', 'Minuman', 5000, 1, 1),
(4, 0x474946383961, 'Sate Ayam', 'Sate ayam dengan bumbu kacang', 'Makanan Utama', 15000, 1, 1),
(5, 0x474946383961, 'Bakso Malang', 'Bakso dengan berbagai isian', 'Makanan Utama', 18000, 1, 1),
(6, 0x474946383961, 'Nasi Rendang', 'Rendang daging sapi dengan nasi putih', 'Makanan Utama', 35000, 1, 2),
(7, 0x474946383961, 'Gado-Gado', 'Salad sayuran dengan bumbu kacang', 'Makanan Utama', 15000, 1, 2),
(8, 0x474946383961, 'Kopi Tubruk', 'Kopi tubruk tradisional', 'Minuman', 8000, 1, 2),
(9, 0x474946383961, 'Pisang Goreng', 'Pisang goreng dengan tepung crispy', 'Snack', 10000, 1, 2),
(10, 0x474946383961, 'Jus Alpukat', 'Jus alpukat segar dengan susu', 'Minuman', 12000, 1, 2),
(11, 0x474946383961, 'Nasi Liwet', 'Nasi liwet dengan lauk lengkap', 'Makanan Utama', 22000, 1, 3),
(12, 0x474946383961, 'Ikan Bakar', 'Ikan bakar dengan sambal', 'Makanan Utama', 28000, 1, 3),
(13, 0x474946383961, 'Sayur Asem', 'Sayur asem segar', 'Sayuran', 8000, 1, 3),
(14, 0x474946383961, 'Kerupuk Udang', 'Kerupuk udang renyah', 'Snack', 5000, 1, 3),
(15, 0x474946383961, 'Air Mineral', 'Air mineral dalam botol', 'Minuman', 3000, 1, 3),
(16, 0x474946383961, 'Nasi Padang', 'Nasi padang dengan berbagai lauk', 'Makanan Utama', 30000, 1, 4),
(17, 0x474946383961, 'Dendeng Balado', 'Dendeng dengan sambal balado', 'Makanan Utama', 25000, 1, 4),
(18, 0x474946383961, 'Gulai Kambing', 'Gulai kambing dengan bumbu rempah', 'Makanan Utama', 40000, 1, 4),
(19, 0x474946383961, 'Teh Tarik', 'Teh tarik hangat', 'Minuman', 6000, 1, 4),
(20, 0x474946383961, 'Kerupuk Jangek', 'Kerupuk kulit sapi khas Padang', 'Snack', 7000, 1, 4),
(21, 0x474946383961, 'Nasi Pecel', 'Nasi pecel dengan sayuran dan bumbu kacang', 'Makanan Utama', 15000, 1, 5),
(22, 0x474946383961, 'Soto Ayam', 'Soto ayam dengan kuah bening', 'Makanan Utama', 18000, 1, 5),
(23, 0x474946383961, 'Tempe Mendoan', 'Tempe goreng mendoan', 'Snack', 8000, 1, 5),
(24, 0x474946383961, 'Wedang Jahe', 'Minuman jahe hangat', 'Minuman', 7000, 1, 5),
(25, 0x474946383961, 'Ketan Bakar', 'Ketan bakar dengan kelapa', 'Dessert', 10000, 1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `PAKET`
--

CREATE TABLE `PAKET` (
  `id_paket` int NOT NULL,
  `id_menu` int NOT NULL,
  `id_restaurant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `PAKET`
--

INSERT INTO `PAKET` (`id_paket`, `id_menu`, `id_restaurant`) VALUES
(1, 1, 1),
(1, 2, 1),
(1, 3, 1),
(2, 6, 2),
(2, 7, 2),
(2, 10, 2),
(3, 11, 3),
(3, 12, 3),
(3, 13, 3),
(4, 16, 4),
(4, 17, 4),
(4, 19, 4),
(5, 21, 5),
(5, 22, 5),
(5, 24, 5);

-- --------------------------------------------------------

--
-- Table structure for table `RESTAURANT`
--

CREATE TABLE `RESTAURANT` (
  `id_restaurant` int NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `RESTAURANT`
--

INSERT INTO `RESTAURANT` (`id_restaurant`, `email`, `password`) VALUES
(1, 'admin@warungmakan.com', 'password123'),
(2, 'owner@cafenusantara.com', 'secure456'),
(3, 'manager@restosederhana.com', 'mypass789'),
(4, 'admin@rumahmakanpadang.com', 'admin2024'),
(5, 'contact@kedaijawa.com', 'jawa1234');

-- --------------------------------------------------------

--
-- Table structure for table `STOK`
--

CREATE TABLE `STOK` (
  `id_stok` int NOT NULL,
  `nama_bahan` text NOT NULL,
  `kuantitas` int NOT NULL,
  `tanggal_pembelian` date NOT NULL,
  `tanggal_exp` date NOT NULL,
  `id_menu` int NOT NULL,
  `id_restaurant` int NOT NULL,
  `pengeluaran` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `STOK`
--

INSERT INTO `STOK` (`id_stok`, `nama_bahan`, `kuantitas`, `tanggal_pembelian`, `tanggal_exp`, `id_menu`, `id_restaurant`, `pengeluaran`) VALUES
(1, 'Nangka Muda', 5, '2024-07-01', '2024-07-15', 1, 1, 75000),
(2, 'Santan Kelapa', 10, '2024-07-01', '2024-07-10', 1, 1, 100000),
(3, 'Ayam Potong', 15, '2024-07-02', '2024-07-12', 2, 1, 300000),
(4, 'Tepung Terigu', 20, '2024-07-01', '2024-08-01', 2, 1, 80000),
(5, 'Teh Celup', 100, '2024-07-01', '2024-12-01', 3, 1, 50000),
(6, 'Gula Pasir', 25, '2024-07-01', '2024-08-01', 3, 1, 75000),
(7, 'Daging Ayam', 8, '2024-07-03', '2024-07-13', 4, 1, 160000),
(8, 'Bumbu Kacang', 5, '2024-07-02', '2024-07-20', 4, 1, 50000),
(9, 'Daging Sapi', 12, '2024-07-02', '2024-07-12', 5, 1, 480000),
(10, 'Mie Bakso', 20, '2024-07-01', '2024-08-01', 5, 1, 100000),
(11, 'Daging Rendang', 10, '2024-07-01', '2024-07-11', 6, 2, 500000),
(12, 'Santan Kental', 8, '2024-07-01', '2024-07-08', 6, 2, 64000),
(13, 'Kacang Tanah', 15, '2024-07-02', '2024-07-25', 7, 2, 75000),
(14, 'Sayur Campur', 20, '2024-07-03', '2024-07-08', 7, 2, 60000),
(15, 'Kopi Bubuk', 5, '2024-07-01', '2024-10-01', 8, 2, 125000),
(16, 'Pisang Raja', 30, '2024-07-04', '2024-07-10', 9, 2, 90000),
(17, 'Tepung Crispy', 10, '2024-07-01', '2024-08-01', 9, 2, 35000),
(18, 'Alpukat', 25, '2024-07-03', '2024-07-08', 10, 2, 125000),
(19, 'Susu Kental Manis', 12, '2024-07-01', '2024-08-01', 10, 2, 72000),
(20, 'Beras Putih', 50, '2024-07-01', '2024-12-01', 11, 3, 400000),
(21, 'Ayam Kampung', 8, '2024-07-04', '2024-07-14', 11, 3, 240000),
(22, 'Ikan Gurame', 5, '2024-07-05', '2024-07-10', 12, 3, 200000),
(23, 'Cabai Merah', 10, '2024-07-04', '2024-07-15', 12, 3, 75000),
(24, 'Asam Jawa', 3, '2024-07-01', '2024-08-01', 13, 3, 15000),
(25, 'Sayur Segar', 15, '2024-07-05', '2024-07-10', 13, 3, 45000),
(26, 'Udang Kering', 8, '2024-07-02', '2024-08-02', 14, 3, 120000),
(27, 'Tepung Tapioka', 20, '2024-07-01', '2024-08-01', 14, 3, 60000),
(28, 'Air Mineral Kemasan', 100, '2024-07-01', '2024-12-01', 15, 3, 100000),
(29, 'Beras Pandan Wangi', 40, '2024-07-01', '2024-12-01', 16, 4, 440000),
(30, 'Rendang Daging', 12, '2024-07-03', '2024-07-13', 16, 4, 600000),
(31, 'Dendeng Sapi', 6, '2024-07-04', '2024-07-20', 17, 4, 480000),
(32, 'Cabai Balado', 8, '2024-07-03', '2024-07-18', 17, 4, 60000),
(33, 'Daging Kambing', 5, '2024-07-05', '2024-07-12', 18, 4, 500000),
(34, 'Santan Murni', 10, '2024-07-04', '2024-07-11', 18, 4, 80000),
(35, 'Teh Hitam', 15, '2024-07-01', '2024-12-01', 19, 4, 60000),
(36, 'Susu Segar', 20, '2024-07-05', '2024-07-12', 19, 4, 100000),
(37, 'Kulit Sapi', 8, '2024-07-02', '2024-07-25', 20, 4, 120000),
(38, 'Beras Merah', 30, '2024-07-01', '2024-12-01', 21, 5, 300000),
(39, 'Sayur Kangkung', 15, '2024-07-06', '2024-07-11', 21, 5, 45000),
(40, 'Ayam Broiler', 10, '2024-07-05', '2024-07-15', 22, 5, 250000),
(41, 'Kunyit', 5, '2024-07-01', '2024-08-01', 22, 5, 25000),
(42, 'Tempe Murni', 25, '2024-07-06', '2024-07-16', 23, 5, 75000),
(43, 'Tepung Beras', 20, '2024-07-01', '2024-08-01', 23, 5, 70000),
(44, 'Jahe Merah', 8, '2024-07-02', '2024-07-30', 24, 5, 64000),
(45, 'Gula Merah', 10, '2024-07-01', '2024-08-01', 24, 5, 50000),
(46, 'Ketan Putih', 15, '2024-07-03', '2024-07-20', 25, 5, 75000),
(47, 'Kelapa Parut', 12, '2024-07-04', '2024-07-14', 25, 5, 60000),
(48, 'Minyak Goreng', 25, '2024-07-01', '2024-08-01', 2, 1, 375000),
(49, 'Bawang Merah', 10, '2024-07-02', '2024-07-20', 4, 1, 75000),
(50, 'Bawang Putih', 8, '2024-07-02', '2024-07-20', 4, 1, 64000),
(51, 'Garam Dapur', 5, '2024-07-01', '2024-12-01', 1, 1, 15000),
(52, 'Nangka Muda', 8, '2024-01-15', '2024-01-30', 1, 1, 96000),
(53, 'Santan Kelapa', 15, '2024-01-15', '2024-01-25', 1, 1, 120000),
(54, 'Ayam Potong', 20, '2024-02-16', '2024-02-26', 2, 1, 400000),
(55, 'Tepung Terigu', 25, '2024-02-16', '2024-03-16', 2, 1, 100000),
(56, 'Daging Sapi', 15, '2024-03-18', '2024-03-28', 6, 2, 750000),
(57, 'Santan Kental', 12, '2024-03-18', '2024-03-25', 6, 2, 96000),
(58, 'Kacang Tanah', 20, '2024-04-19', '2024-05-10', 7, 2, 100000),
(59, 'Sayur Campur', 25, '2024-04-19', '2024-04-24', 7, 2, 87500),
(60, 'Kopi Bubuk', 8, '2024-05-20', '2024-08-20', 8, 2, 160000),
(61, 'Beras Putih', 60, '2024-05-21', '2024-10-21', 11, 3, 480000),
(62, 'Ayam Kampung', 12, '2024-06-21', '2024-07-01', 11, 3, 360000),
(63, 'Ikan Gurame', 8, '2024-06-22', '2024-06-27', 12, 3, 320000),
(64, 'Beras Pandan Wangi', 50, '2024-01-23', '2024-06-23', 16, 4, 550000),
(65, 'Rendang Daging', 18, '2024-02-23', '2024-03-05', 16, 4, 900000),
(66, 'Dendeng Sapi', 10, '2024-03-24', '2024-04-10', 17, 4, 800000),
(67, 'Daging Kambing', 8, '2024-04-24', '2024-05-01', 18, 4, 800000),
(68, 'Beras Merah', 40, '2024-05-25', '2024-10-25', 21, 5, 400000),
(69, 'Ayam Broiler', 15, '2024-06-26', '2024-07-06', 22, 5, 375000),
(70, 'Tempe Murni', 30, '2024-06-26', '2024-07-06', 23, 5, 90000);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Customer`
--
ALTER TABLE `Customer`
  ADD PRIMARY KEY (`Invoice_Id`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- Indexes for table `CUSTOMER_FEEDBACK`
--
ALTER TABLE `CUSTOMER_FEEDBACK`
  ADD PRIMARY KEY (`id_feedback`),
  ADD KEY `id_customer` (`id_customer`),
  ADD KEY `id_restaurant` (`id_restaurant`),
  ADD KEY `rating` (`rating`),
  ADD KEY `feedback_date` (`feedback_date`),
  ADD KEY `idx_feedback_rating_date` (`rating`,`feedback_date`),
  ADD KEY `idx_feedback_restaurant_status` (`id_restaurant`,`status`);

--
-- Indexes for table `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `id_customer` (`id_customer`);

--
-- Indexes for table `MEMESAN_PAKET`
--
ALTER TABLE `MEMESAN_PAKET`
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `Id_customer` (`Id_customer`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`Id_Menu`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- Indexes for table `PAKET`
--
ALTER TABLE `PAKET`
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- Indexes for table `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  ADD PRIMARY KEY (`id_restaurant`);

--
-- Indexes for table `STOK`
--
ALTER TABLE `STOK`
  ADD PRIMARY KEY (`id_stok`),
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `CUSTOMER_FEEDBACK`
--
ALTER TABLE `CUSTOMER_FEEDBACK`
  MODIFY `id_feedback` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `Id_Menu` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  MODIFY `id_restaurant` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Customer`
--
ALTER TABLE `Customer`
  ADD CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `CUSTOMER_FEEDBACK`
--
ALTER TABLE `CUSTOMER_FEEDBACK`
  ADD CONSTRAINT `feedback_customer_fk` FOREIGN KEY (`id_customer`) REFERENCES `Customer` (`Invoice_Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `feedback_restaurant_fk` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD CONSTRAINT `memesan_menu_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `memesan_menu_ibfk_2` FOREIGN KEY (`id_customer`) REFERENCES `Customer` (`Invoice_Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `MEMESAN_PAKET`
--
ALTER TABLE `MEMESAN_PAKET`
  ADD CONSTRAINT `memesan_paket_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `memesan_paket_ibfk_2` FOREIGN KEY (`Id_customer`) REFERENCES `Customer` (`Invoice_Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `PAKET`
--
ALTER TABLE `PAKET`
  ADD CONSTRAINT `paket_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `paket_ibfk_2` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `STOK`
--
ALTER TABLE `STOK`
  ADD CONSTRAINT `stok_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `stok_ibfk_2` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
