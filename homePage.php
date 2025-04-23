<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekomendasi Paket</title>
    <link rel="stylesheet" href="DhomePage.css">
</head>
<body>
    <header>
        <p>Home</p>
        <p>Produk</p>
        <p>Order</p>
    </header>

    <section id="rekomendasiPaket">
        <h2>Rekomendasi Paket</h2>
        <div class="paket-container">
            <?php
            // Load data dari CSV
            $csv = array_map('str_getcsv', file('data.csv'));
            $header = array_shift($csv);
            $invoiceIndex = array_search('InvoiceNo', $header);
            $descIndex = array_search('Description', $header);

            $groupedData = [];

            // Kelompokkan berdasarkan InvoiceNo
            foreach ($csv as $row) {
                $invoice = $row[$invoiceIndex];
                $desc = trim($row[$descIndex]);
                if ($desc !== '') {
                    $groupedData[$invoice][] = $desc;
                }
            }

            // Filter invoice yang memiliki minimal 4 item
            $samplePackages = array_values(array_filter($groupedData, fn($items) => count($items) >= 4));
            shuffle($samplePackages);
            $packages = array_slice($samplePackages, 0, 3); // ambil 3 paket acak

            foreach ($packages as $index => $items) {
                echo "<div class='paket'>";
                echo "<div class='paket-title'>Paket " . ($index + 1) . "</div>";
                echo "<ul>";
                foreach (array_slice($items, 0, 4) as $item) {
                    echo "<li>" . htmlspecialchars($item) . "</li>";
                }
                echo "</ul>";
                $btnText = ($index === 1 || $index === 3) ? "Berlangsung" : "Gunakan";
                echo "<button class='paket-btn'>$btnText</button>";
                echo "</div>";
            }
            ?>
        </div>
    </section>

    <footer></footer>
</body>
</html>
