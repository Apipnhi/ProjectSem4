-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Waktu pembuatan: 09 Jul 2025 pada 21.17
-- Versi server: 8.0.40
-- Versi PHP: 8.3.14

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
-- Struktur dari tabel `Customer`
--

CREATE TABLE `Customer` (
  `Invoice_Id` int NOT NULL,
  `Tanggal_Order` date NOT NULL,
  `Harga_Total` int NOT NULL,
  `id_restaurant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `Customer`
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
(25, '2024-07-13', 37000, 5);

-- --------------------------------------------------------

--
-- Struktur dari tabel `MEMESAN_MENU`
--

CREATE TABLE `MEMESAN_MENU` (
  `id_pemesanan_menu` int NOT NULL,
  `id_menu` int NOT NULL,
  `kuantitas` int NOT NULL,
  `id_customer` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `MEMESAN_MENU`
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
(35, 17, 1, 19);

-- --------------------------------------------------------

--
-- Struktur dari tabel `menu`
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
-- Dumping data untuk tabel `menu`
--

INSERT INTO `menu` (`Id_Menu`, `Gambar`, `Nama_Menu`, `Deskripsi`, `Kategori`, `Harga`, `Status`, `id_restaurant`) VALUES
(1, 0x474946383961, 'Nasi Gudeg', 'Gudeg khas Yogyakarta dengan kuah santan yang gurih', 'Makanan Utama', 25000, 1, 1),
(2, 0x474946383961, 'Ayam Goreng Kremes', 'Ayam goreng dengan kremes yang renyah', 'Makanan Utama', 20000, 0, 1),
(3, 0x474946383961, 'Es Teh Manis', 'Es teh manis segar', 'Minuman', 5000, 1, 1),
(4, 0x474946383961, 'Sate Ayam', 'Sate ayam dengan bumbu kacang', 'Makanan Utama', 15000, 0, 1),
(5, 0x474946383961, 'Bakso Malang', 'Bakso dengan berbagai isian', 'Makanan Utama', 18000, 1, 1),
(6, 0x474946383961, 'Nasi Rendang', 'Rendang daging sapi dengan nasi putih', 'Makanan Utama', 35000, 0, 2),
(7, 0x474946383961, 'Gado-Gado', 'Salad sayuran dengan bumbu kacang', 'Makanan Utama', 15000, 1, 2),
(8, 0x474946383961, 'Kopi Tubruk', 'Kopi tubruk tradisional', 'Minuman', 8000, 0, 2),
(9, 0x474946383961, 'Pisang Goreng', 'Pisang goreng dengan tepung crispy', 'Snack', 10000, 1, 2),
(10, 0x474946383961, 'Jus Alpukat', 'Jus alpukat segar dengan susu', 'Minuman', 12000, 1, 2),
(11, 0x474946383961, 'Nasi Liwet', 'Nasi liwet dengan lauk lengkap', 'Makanan Utama', 22000, 1, 3),
(12, 0x474946383961, 'Ikan Bakar', 'Ikan bakar dengan sambal', 'Makanan Utama', 28000, 1, 3),
(13, 0x474946383961, 'Sayur Asem', 'Sayur asem segar', 'Sayuran', 8000, 1, 3),
(14, 0x474946383961, 'Kerupuk Udang', 'Kerupuk udang renyah', 'Snack', 5000, 0, 3),
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
-- Struktur dari tabel `RESTAURANT`
--

CREATE TABLE `RESTAURANT` (
  `id_restaurant` int NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `RESTAURANT`
--

INSERT INTO `RESTAURANT` (`id_restaurant`, `email`, `password`) VALUES
(1, 'admin@warungmakan.com', 'password123'),
(2, 'owner@cafenusantara.com', 'secure456'),
(3, 'manager@restosederhana.com', 'mypass789'),
(4, 'admin@rumahmakanpadang.com', 'admin2024'),
(5, 'contact@kedaijawa.com', 'jawa1234');

-- --------------------------------------------------------

--
-- Struktur dari tabel `STOK`
--

CREATE TABLE `STOK` (
  `id_stok` int NOT NULL,
  `nama_bahan` text NOT NULL,
  `kuantitas` int NOT NULL,
  `tanggal_pembelian` date NOT NULL,
  `tanggal_exp` date NOT NULL,
  `id_menu` int NOT NULL,
  `id_restaurant` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `STOK`
--

INSERT INTO `STOK` (`id_stok`, `nama_bahan`, `kuantitas`, `tanggal_pembelian`, `tanggal_exp`, `id_menu`, `id_restaurant`) VALUES
(1, 'Nangka Muda', 5, '2024-07-01', '2024-07-15', 1, 1),
(2, 'Santan Kelapa', 10, '2024-07-01', '2024-07-10', 1, 1),
(3, 'Ayam Potong', 15, '2024-07-02', '2024-07-12', 2, 1),
(4, 'Tepung Terigu', 20, '2024-07-01', '2024-08-01', 2, 1),
(5, 'Teh Celup', 100, '2024-07-01', '2024-12-01', 3, 1),
(6, 'Gula Pasir', 25, '2024-07-01', '2024-08-01', 3, 1),
(7, 'Daging Ayam', 8, '2024-07-03', '2024-07-13', 4, 1),
(8, 'Bumbu Kacang', 5, '2024-07-02', '2024-07-20', 4, 1),
(9, 'Daging Sapi', 12, '2024-07-02', '2024-07-12', 5, 1),
(10, 'Mie Bakso', 20, '2024-07-01', '2024-08-01', 5, 1),
(11, 'Daging Rendang', 10, '2024-07-01', '2024-07-11', 6, 2),
(12, 'Santan Kental', 8, '2024-07-01', '2024-07-08', 6, 2),
(13, 'Kacang Tanah', 15, '2024-07-02', '2024-07-25', 7, 2),
(14, 'Sayur Campur', 20, '2024-07-03', '2024-07-08', 7, 2),
(15, 'Kopi Bubuk', 5, '2024-07-01', '2024-10-01', 8, 2),
(16, 'Pisang Raja', 30, '2024-07-04', '2024-07-10', 9, 2),
(17, 'Tepung Crispy', 10, '2024-07-01', '2024-08-01', 9, 2),
(18, 'Alpukat', 25, '2024-07-03', '2024-07-08', 10, 2),
(19, 'Susu Kental Manis', 12, '2024-07-01', '2024-08-01', 10, 2),
(20, 'Beras Putih', 50, '2024-07-01', '2024-12-01', 11, 3),
(21, 'Ayam Kampung', 8, '2024-07-04', '2024-07-14', 11, 3),
(22, 'Ikan Gurame', 5, '2024-07-05', '2024-07-10', 12, 3),
(23, 'Cabai Merah', 10, '2024-07-04', '2024-07-15', 12, 3),
(24, 'Asam Jawa', 3, '2024-07-01', '2024-08-01', 13, 3),
(25, 'Sayur Segar', 15, '2024-07-05', '2024-07-10', 13, 3),
(26, 'Udang Kering', 8, '2024-07-02', '2024-08-02', 14, 3),
(27, 'Tepung Tapioka', 20, '2024-07-01', '2024-08-01', 14, 3),
(28, 'Beras Pandan Wangi', 40, '2024-07-01', '2024-12-01', 16, 4),
(29, 'Rendang Daging', 12, '2024-07-03', '2024-07-13', 16, 4),
(30, 'Dendeng Sapi', 6, '2024-07-04', '2024-07-20', 17, 4),
(31, 'Cabai Balado', 8, '2024-07-03', '2024-07-18', 17, 4),
(32, 'Daging Kambing', 5, '2024-07-05', '2024-07-12', 18, 4),
(33, 'Santan Murni', 10, '2024-07-04', '2024-07-11', 18, 4),
(34, 'Teh Hitam', 15, '2024-07-01', '2024-12-01', 19, 4),
(35, 'Susu Segar', 20, '2024-07-05', '2024-07-12', 19, 4),
(36, 'Kulit Sapi', 8, '2024-07-02', '2024-07-25', 20, 4),
(37, 'Beras Merah', 30, '2024-07-01', '2024-12-01', 21, 5),
(38, 'Sayur Kangkung', 15, '2024-07-06', '2024-07-11', 21, 5),
(39, 'Ayam Broiler', 10, '2024-07-05', '2024-07-15', 22, 5),
(40, 'Kunyit', 5, '2024-07-01', '2024-08-01', 22, 5),
(41, 'Tempe Murni', 25, '2024-07-06', '2024-07-16', 23, 5),
(42, 'Tepung Beras', 20, '2024-07-01', '2024-08-01', 23, 5),
(43, 'Jahe Merah', 8, '2024-07-02', '2024-07-30', 24, 5),
(44, 'Gula Merah', 10, '2024-07-01', '2024-08-01', 24, 5),
(45, 'Ketan Putih', 15, '2024-07-03', '2024-07-20', 25, 5),
(46, 'Kelapa Parut', 12, '2024-07-04', '2024-07-14', 25, 5),
(47, 'Minyak Goreng', 25, '2024-07-01', '2024-08-01', 2, 1),
(48, 'Bawang Merah', 10, '2024-07-02', '2024-07-20', 4, 1),
(49, 'Bawang Putih', 8, '2024-07-02', '2024-07-20', 4, 1),
(50, 'Garam Dapur', 5, '2024-07-01', '2024-12-01', 1, 1);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `Customer`
--
ALTER TABLE `Customer`
  ADD PRIMARY KEY (`Invoice_Id`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- Indeks untuk tabel `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `id_customer` (`id_customer`);

--
-- Indeks untuk tabel `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`Id_Menu`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- Indeks untuk tabel `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  ADD PRIMARY KEY (`id_restaurant`);

--
-- Indeks untuk tabel `STOK`
--
ALTER TABLE `STOK`
  ADD PRIMARY KEY (`id_stok`),
  ADD KEY `id_menu` (`id_menu`),
  ADD KEY `id_restaurant` (`id_restaurant`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `menu`
--
ALTER TABLE `menu`
  MODIFY `Id_Menu` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `RESTAURANT`
--
ALTER TABLE `RESTAURANT`
  MODIFY `id_restaurant` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `Customer`
--
ALTER TABLE `Customer`
  ADD CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ketidakleluasaan untuk tabel `MEMESAN_MENU`
--
ALTER TABLE `MEMESAN_MENU`
  ADD CONSTRAINT `memesan_menu_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `memesan_menu_ibfk_2` FOREIGN KEY (`id_customer`) REFERENCES `Customer` (`Invoice_Id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ketidakleluasaan untuk tabel `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Ketidakleluasaan untuk tabel `STOK`
--
ALTER TABLE `STOK`
  ADD CONSTRAINT `stok_ibfk_1` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`Id_Menu`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `stok_ibfk_2` FOREIGN KEY (`id_restaurant`) REFERENCES `RESTAURANT` (`id_restaurant`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
