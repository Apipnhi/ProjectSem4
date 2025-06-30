-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Jun 30, 2025 at 01:35 AM
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
  `Id_Pemesanan_Paket` int NOT NULL,
  `Id_Pemesanan_Menu` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MEMESAN_MENU`
--

CREATE TABLE `MEMESAN_MENU` (
  `id_pemesanan_menu` int NOT NULL,
  `id_menu` int NOT NULL,
  `kuantitas` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MEMESAN_PAKET`
--

CREATE TABLE `MEMESAN_PAKET` (
  `id_pemesanan_paket` int NOT NULL,
  `id_paket` int NOT NULL,
  `kuantitas` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `Status` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Paket`
--

CREATE TABLE `Paket` (
  `Id_Paket` int NOT NULL,
  `Id_Menu` int NOT NULL,
  `Status` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `RESTAURANT`
--

CREATE TABLE `RESTAURANT` (
  `id_restaurant` int NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `Id_Customer` int DEFAULT NULL,
  `Id_Menu` int DEFAULT NULL,
  `Id_Paket` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `RESTAURANT`
--

INSERT INTO `RESTAURANT` (`id_restaurant`, `email`, `password`, `Id_Customer`, `Id_Menu`, `Id_Paket`) VALUES
(1, 'admin@restomate.com', 'admin123', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Customer`
--
ALTER TABLE `Customer`
  ADD PRIMARY KEY (`Invoice_Id`),
  ADD KEY `Id_Pemesanan_Menu` (`Id_Pemesanan_Menu`),
  ADD KEY `Id_Pemesanan_Paket` (`Id_Pemesanan_Paket`);

--
-- Indexes for table `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD KEY `id_menu` (`id_menu`);

--
-- Indexes for table `MEMESAN_PAKET`
--
ALTER TABLE `MEMESAN_PAKET`
  ADD KEY `id_paket` (`id_paket`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`Id_Menu`);

--
-- Indexes for table `Paket`
--
ALTER TABLE `Paket`
  ADD PRIMARY KEY (`Id_Paket`),
  ADD KEY `Id_Menu` (`Id_Menu`);

--
-- Indexes for table `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  ADD PRIMARY KEY (`id_restaurant`),
  ADD KEY `Id_Menu` (`Id_Menu`),
  ADD KEY `Id_Paket` (`Id_Paket`),
  ADD KEY `Id_Customer` (`Id_Customer`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `Id_Menu` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  MODIFY `id_restaurant` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Customer`
--
ALTER TABLE `Customer`
  ADD CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`Id_Pemesanan_Menu`) REFERENCES `MEMESAN_MENU` (`id_menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `customer_ibfk_2` FOREIGN KEY (`Id_Pemesanan_Paket`) REFERENCES `MEMESAN_PAKET` (`id_paket`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD CONSTRAINT `memesan_menu_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `MEMESAN_PAKET`
--
ALTER TABLE `MEMESAN_PAKET`
  ADD CONSTRAINT `memesan_paket_ibfk_1` FOREIGN KEY (`id_paket`) REFERENCES `Paket` (`Id_Paket`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `Paket`
--
ALTER TABLE `Paket`
  ADD CONSTRAINT `paket_ibfk_1` FOREIGN KEY (`Id_Menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  ADD CONSTRAINT `restaurant_ibfk_1` FOREIGN KEY (`Id_Menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `restaurant_ibfk_2` FOREIGN KEY (`Id_Paket`) REFERENCES `Paket` (`Id_Paket`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `restaurant_ibfk_3` FOREIGN KEY (`Id_Customer`) REFERENCES `Customer` (`Invoice_Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
