<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekomendasi Paket</title>
    <link rel="stylesheet" href="DehomePage.css">
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
            $apiKey = "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";
            $groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

            // Baca file CSV dan ambil produk berdasarkan InvoiceNo dan Description
            $groupedData = [];
            if (($handle = fopen("data.csv", "r")) !== FALSE) {
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

            // Ambil 100 item unik
            $sample = array_slice(array_values($groupedData), 0, 100);
            $flattened = [];
            foreach ($sample as $group) {
                foreach ($group as $item) {
                    $flattened[] = $item;
                }
            }
            $uniqueItems = array_values(array_unique($flattened));
            $limitedItems = array_slice($uniqueItems, 0, 100);

            // Prompt eksplisit
            $prompt = "Saya memiliki daftar produk terjual dari restoran:\n\n"
                . implode("\n", $limitedItems)
                . "\n\nBuatkan 3 rekomendasi paket makanan. "
                . "Masing-masing paket harus memiliki 4 item berbeda dan tidak ada item yang sama antar paket. "
                . "Jawab hanya dengan format JSON seperti ini:\n"
                . '[{"paket": "Paket 1", "items": ["Item A", "Item B", "Item C", "Item D"]}, {"paket": "Paket 2", "items": [...]}] '
                . "Tanpa penjelasan sebelum atau sesudah JSON.";

            // Kirim permintaan ke Groq
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

            // Parsing
            $reply = json_decode($response, true);
            $content = $reply['choices'][0]['message']['content'] ?? "[]";

            // Parsing JSON hasil dari Groq
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
