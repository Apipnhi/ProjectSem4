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
            // API Key dan endpoint Groq
            $apiKey = "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";
            $groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

            // 1. Baca data CSV
            $csv = array_map('str_getcsv', file('data.csv'));
            $header = array_shift($csv);
            $invoiceIndex = array_search('InvoiceNo', $header);
            $descIndex = array_search('Description', $header);

            $groupedData = [];
            foreach ($csv as $row) {
                $invoice = $row[$invoiceIndex];
                $desc = trim($row[$descIndex]);
                if ($desc !== '') {
                    $groupedData[$invoice][] = $desc;
                }
            }

            // 2. Siapkan prompt untuk Groq
            $prompt = "Berikan 3 paket makanan rekomendasi berdasarkan data penjualan berikut. "
                    . "Setiap paket harus memiliki 4 item makanan dan tidak boleh sama antar paket:\n\n"
                    . json_encode(array_values($groupedData), JSON_PRETTY_PRINT);

            // 3. Kirim ke Groq API
            $data = [
                "model" => "mixtral-8x7b-32768",
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

            // 4. Parsing jawaban Groq
            preg_match_all('/Paket\s*\d+[:\-]?\s*(.*?)(?=\nPaket|\Z)/is', $content, $matches);
            $paketList = $matches[1];

            if (count($paketList) < 3) {
                echo "<p>Gagal memuat rekomendasi paket. Silakan coba lagi.</p>";
            } else {
                foreach ($paketList as $index => $rawText) {
                    $items = array_filter(array_map('trim', preg_split('/[\n\-]+/', $rawText)));
                    $items = array_slice($items, 0, 4); // maksimal 4 item
                    echo "<div class='paket'>";
                    echo "<div class='paket-title'>Paket " . ($index + 1) . "</div>";
                    echo "<ul>";
                    foreach ($items as $item) {
                        echo "<li>" . htmlspecialchars($item) . "</li>";
                    }
                    echo "</ul>";
                    $btnText = ($index === 1 || $index === 3) ? "Berlangsung" : "Gunakan";
                    echo "<button class='paket-btn'>$btnText</button>";
                    echo "</div>";
                }
            }
            ?>
        </div>
    </section>

    <footer></footer>
</body>
</html>
