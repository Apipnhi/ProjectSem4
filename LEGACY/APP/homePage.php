<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Grafik Penjualan & Rekomendasi Paket</title>
    <link rel="stylesheet" href="DesignhomePage.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <header>
        <p>Home</p>
        <p>Produk</p>
        <p>Order</p>
    </header>

    <section id="grafik_penjualan">
        <h2>Grafik Penjualan</h2>
        <form method="GET">
            <label>Pilih Periode: </label>
            <select name="periode">
                <option value="1_bulan_lalu">1 Bulan Lalu</option>
                <option value="3_bulan_lalu">3 Bulan Lalu</option>
                <option value="6_bulan_lalu">6 Bulan Lalu</option>
                <option value="1_tahun_lalu">1 Tahun Lalu</option>
                <option value="1_bulan_mendatang">1 Bulan Mendatang</option>
                <option value="3_bulan_mendatang">3 Bulan Mendatang</option>
                <option value="6_bulan_mendatang">6 Bulan Mendatang</option>
                <option value="1_tahun_mendatang">1 Tahun Mendatang</option>
            </select>
            <button type="submit">Tampilkan</button>
        </form>

        <canvas id="grafikCanvas" style="max-width:800px; margin-top:20px;"></canvas>

        <?php
        $periode = $_GET['periode'] ?? '1_bulan_lalu';
        $dataPoints = [];

        if (($handle = fopen("penjualan_restoran.csv", "r")) !== FALSE) {
            $header = fgetcsv($handle);
            $dateIndex = array_search('InvoiceDate', $header);
            $priceIndex = array_search('UnitPrice', $header);
            $qtyIndex = array_search('Quantity', $header);

            $now = new DateTime();
            $range = match($periode) {
                "1_bulan_lalu" => ['start' => (clone $now)->modify('-1 month'), 'end' => $now],
                "3_bulan_lalu" => ['start' => (clone $now)->modify('-3 month'), 'end' => $now],
                "6_bulan_lalu" => ['start' => (clone $now)->modify('-6 month'), 'end' => $now],
                "1_tahun_lalu" => ['start' => (clone $now)->modify('-1 year'), 'end' => $now],
                "1_bulan_mendatang" => ['start' => $now, 'end' => (clone $now)->modify('+1 month')],
                "3_bulan_mendatang" => ['start' => $now, 'end' => (clone $now)->modify('+3 month')],
                "6_bulan_mendatang" => ['start' => $now, 'end' => (clone $now)->modify('+6 month')],
                "1_tahun_mendatang" => ['start' => $now, 'end' => (clone $now)->modify('+1 year')],
                default => ['start' => (clone $now)->modify('-1 month'), 'end' => $now]
            };

            while (($row = fgetcsv($handle)) !== FALSE) {
                $date = DateTime::createFromFormat('m/d/Y H:i', $row[$dateIndex]) ?: DateTime::createFromFormat('Y-m-d H:i:s', $row[$dateIndex]);
                if (!$date) continue;

                if ($date >= $range['start'] && $date <= $range['end']) {
                    $month = $date->format('Y-m');
                    $amount = floatval($row[$priceIndex]) * intval($row[$qtyIndex]);
                    if (!isset($dataPoints[$month])) {
                        $dataPoints[$month] = 0;
                    }
                    $dataPoints[$month] += $amount;
                }
            }
            fclose($handle);
        }

        $labels = array_keys($dataPoints);
        $values = array_values($dataPoints);

        echo "<script>
            const ctx = document.getElementById('grafikCanvas').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: " . json_encode($labels) . ",
                    datasets: [{
                        label: 'Pendapatan',
                        data: " . json_encode($values) . ",
                        backgroundColor: '#ecc94b'
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        </script>";
        ?>
    </section>

    <section id="rekomendasiPaket">
        <h2>Rekomendasi Paket</h2>
        <div class="paket-container">
            <?php
            $apiKey = "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";
            $groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

            $groupedData = [];
            if (($handle = fopen("penjualan_restoran.csv", "r")) !== FALSE) {
                $header = fgetcsv($handle);
                $invoiceIndex = array_search('InvoiceNo', $header);
                $descIndex = array_search('Description', $header);

                while (($row = fgetcsv($handle)) !== FALSE) {
                    $invoice = $row[$invoiceIndex];
                    $desc = trim($row[$descIndex]);
                    if ($desc !== '') {
                        $groupedData[$invoice][] = $desc;
                    }
                }
                fclose($handle);
            }

            $sample = array_slice(array_values($groupedData), 0, 100);
            $flattened = [];
            foreach ($sample as $group) {
                foreach ($group as $item) {
                    $flattened[] = $item;
                }
            }
            $uniqueItems = array_values(array_unique($flattened));
            $limitedItems = array_slice($uniqueItems, 0, 100);

            $prompt = "Saya memiliki daftar produk terjual dari restoran:\n\n"
                . implode("\n", $limitedItems)
                . "\n\nBuatkan 3 rekomendasi paket makanan. "
                . "Masing-masing paket harus memiliki 4 item berbeda dan tidak ada item yang sama antar paket. "
                . "Jawab hanya dengan format JSON seperti ini:\n"
                . '[{"paket": "Paket 1", "items": ["Item A", "Item B", "Item C", "Item D"]}, {"paket": "Paket 2", "items": [...]}] '
                . "Tanpa penjelasan sebelum atau sesudah JSON.";

            $data = [
                "model" => "llama3-70b-8192",
                "messages" => [
                    ["role" => "system", "content" => "Kamu adalah asisten rekomendasi menu restoran."],
                    ["role" => "user", "content" => $prompt]
                ],
                "temperature" => 0.7
            ];

            $ch = curl_init($groqEndpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Content-Type: application/json",
                "Authorization: Bearer $apiKey"
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            $response = curl_exec($ch);
            curl_close($ch);

            $reply = json_decode($response, true);
            $content = $reply['choices'][0]['message']['content'] ?? "[]";

            $paketList = json_decode($content, true);
            if (!is_array($paketList)) {
                echo "<p>Gagal memuat rekomendasi paket. Format tidak sesuai.</p>";
            } else {
                foreach ($paketList as $paket) {
                    $items = $paket['items'] ?? [];
                    echo "<div class='paket'>";
                    echo "<div class='paket-title'>" . htmlspecialchars($paket['paket']) . "</div>";
                    echo "<ul>";
                    foreach ($items as $item) {
                        echo "<li>" . htmlspecialchars($item) . "</li>";
                    }
                    echo "</ul>";
                    echo "<button class='paket-btn'>Gunakan</button>";
                    echo "</div>";
                }
            }
            ?>
        </div>
    </section>

    <footer></footer>
</body>
</html>
