import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id_restaurant = 1;

    const stok = await query(`
      SELECT s.nama_bahan, s.kuantitas, m.Nama_Menu
      FROM STOK s
      JOIN menu m ON s.id_menu = m.Id_Menu
      WHERE s.id_restaurant = ?
    `, [id_restaurant]);

    const sales = await query(`
      SELECT mm.id_menu, COUNT(*) as total_sold
      FROM MEMESAN_MENU mm
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE c.id_restaurant = ?
      GROUP BY mm.id_menu
    `, [id_restaurant]);

    const menu = await query(`
      SELECT Id_Menu, Nama_Menu, Harga
      FROM menu
      WHERE id_restaurant = ?
    `, [id_restaurant]);

    const dataForLLM = {
      stok,
      sales,
      menu,
      period: body.period || "week",
    };

    const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
Kamu adalah analis stok restoran.

**Tugasmu:**
- Gunakan data stok, penjualan, dan menu untuk menghitung kebutuhan bahan baku periode mendatang.
- Buat rekomendasi pembelian bahan baku, dalam format JSON.
- Jangan berikan teks penjelasan apa pun di luar JSON.
- Hasilkan hanya JSON, tanpa kata pembuka atau penutup.

**Format JSON yang wajib kamu ikuti:**

{
  "summary": {
    "totalIngredients": <number>,
    "highUrgency": <number>,
    "estimatedTotalCost": <number>
  },
  "predictions": [
    {
      "ingredient": "<nama bahan>",
      "currentStock": <number>,
      "predictedNeed": <number>,
      "recommendedOrder": <number>,
      "urgency": "<low|medium|high>",
      "reasoning": "<penjelasan>",
      "estimatedCost": <number>
    }
  ]
}

Gunakan data berikut untuk menganalisis:

${JSON.stringify(dataForLLM, null, 2)}
            `.trim(),
          },
        ],
        temperature: 0.7,
      }),
    });

    const llmData = await llmResponse.json();
    const content = llmData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.log("❌ LLM returned invalid JSON:", content);
      return NextResponse.json({ error: "LLM returned invalid JSON" });
    }

    const outputPath = path.join(process.cwd(), "public", "predictions.json");
    try {
      await fs.writeFile(outputPath, JSON.stringify(parsed, null, 2));
      console.log("✅ predictions.json written:", outputPath);
    } catch (err) {
      console.error("❌ Failed to write predictions.json:", err);
      return NextResponse.json({ error: "Failed to write predictions.json" });
    }

    return NextResponse.json({ message: "Prediction generated", success: true });
  } catch (err) {
    console.error("❌ General error:", err);
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 });
  }
}
