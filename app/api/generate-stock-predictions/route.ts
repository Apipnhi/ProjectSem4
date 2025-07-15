// app/api/generate-stock-predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';
import { writeFile } from 'fs/promises';
import path from 'path';

interface StockData {
  id_stok: number;
  nama_bahan: string;
  kuantitas: number;
  tanggal_pembelian: string;
  tanggal_exp: string;
  id_menu: number;
  id_restaurant: number;
  pengeluaran: number;
  nama_menu: string;
  harga_menu: number;
}

interface SalesData {
  tanggal_order: string;
  total_quantity: number;
  total_revenue: number;
  id_menu: number;
  nama_menu: string;
}

async function getStockData(): Promise<StockData[]> {
  const sql = `
    SELECT 
      s.id_stok,
      s.nama_bahan,
      s.kuantitas,
      s.tanggal_pembelian,
      s.tanggal_exp,
      s.id_menu,
      s.id_restaurant,
      s.pengeluaran,
      m.Nama_Menu as nama_menu,
      m.Harga as harga_menu
    FROM STOK s
    JOIN menu m ON s.id_menu = m.Id_Menu
    WHERE s.kuantitas <= 20 OR s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    ORDER BY s.tanggal_exp ASC, s.kuantitas ASC
    LIMIT 20
  `;
  
  const results = await query(sql);
  return results as StockData[];
}

async function getSalesData(): Promise<SalesData[]> {
  const sql = `
    SELECT 
      MAX(c.Tanggal_Order) as tanggal_order,
      SUM(mm.kuantitas) as total_quantity,
      SUM(c.Harga_Total) as total_revenue,
      mm.id_menu,
      m.Nama_Menu as nama_menu
    FROM Customer c
    JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
    JOIN menu m ON mm.id_menu = m.Id_Menu
    WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
    GROUP BY mm.id_menu, m.Nama_Menu
    ORDER BY SUM(mm.kuantitas) DESC
    LIMIT 15
  `;
  
  const results = await query(sql);
  return results as SalesData[];
}

async function generatePredictions(stockData: StockData[], salesData: SalesData[], period: string) {
  const prompt = `
Sebagai AI ahli manajemen inventori restoran, analisis data berikut dan berikan prediksi stok dalam format JSON yang tepat.

DATA STOK PRIORITAS (stok rendah/hampir expired):
${JSON.stringify(stockData.slice(0, 10), null, 2)}

DATA PENJUALAN POPULER (3 bulan terakhir):
${JSON.stringify(salesData.slice(0, 10), null, 2)}

PERIODE PREDIKSI: ${period}

Berdasarkan data, buat prediksi untuk 8-12 bahan yang paling perlu diorder. Pertimbangkan:
1. Stok rendah (kuantitas < 10)
2. Mendekati expired (< 30 hari)
3. Tingkat konsumsi dari data penjualan
4. Estimasi harga berdasarkan pengeluaran historical

WAJIB respond dengan JSON valid format ini (tanpa markdown atau text lain):
{
  "predictions": [
    {
      "ingredient": "Nama Bahan",
      "currentStock": 5,
      "predictedNeed": 20,
      "recommendedOrder": 15,
      "urgency": "high",
      "reasoning": "Stok sangat rendah dengan konsumsi tinggi untuk menu populer",
      "estimatedCost": 150000
    }
  ],
  "summary": {
    "totalIngredients": 10,
    "highUrgency": 3,
    "estimatedTotalCost": 1500000
  }
}

Urgency level: "high" (stok <5 atau expired <7 hari), "medium" (stok 5-10 atau expired <15 hari), "low" (lainnya).
EstimatedCost: hitung berdasarkan historical pengeluaran per unit x recommendedOrder.
`;

  try {
    console.log('Sending prompt to AI...');
    const aiResponse = await callGroqLLM(prompt, 1024, 0.1); // Lower temperature for more consistent JSON
    
    console.log('AI Response received:', aiResponse.substring(0, 200) + '...');
    
    // Clean and parse JSON response
    let cleanedContent = aiResponse.trim();
    
    // Remove any markdown formatting
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find JSON boundaries
    let jsonStart = cleanedContent.indexOf('{');
    let jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.log('No JSON found, creating fallback predictions...');
      return createFallbackPredictions(stockData);
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    console.log('Attempting to parse JSON:', jsonString.substring(0, 100) + '...');
    
    const predictions = JSON.parse(jsonString);
    
    // Validate the response structure
    if (!predictions.predictions || !Array.isArray(predictions.predictions)) {
      throw new Error('Invalid predictions structure');
    }
    
    console.log('Predictions parsed successfully:', predictions.predictions.length, 'items');
    return predictions;
    
  } catch (error) {
    console.error('Error generating/parsing predictions:', error);
    console.log('Creating fallback predictions...');
    return createFallbackPredictions(stockData);
  }
}

function createFallbackPredictions(stockData: StockData[]) {
  console.log('Creating fallback predictions for', stockData.length, 'items');
  
  const predictions = stockData.slice(0, 10).map((item, index) => {
    const urgency = item.kuantitas <= 3 ? 'high' : item.kuantitas <= 8 ? 'medium' : 'low';
    const predictedNeed = Math.max(15, item.kuantitas * 3);
    const recommendedOrder = Math.max(5, predictedNeed - item.kuantitas);
    const costPerUnit = item.pengeluaran / Math.max(item.kuantitas, 1);
    const estimatedCost = Math.round(recommendedOrder * costPerUnit);
    
    return {
      ingredient: item.nama_bahan,
      currentStock: item.kuantitas,
      predictedNeed: predictedNeed,
      recommendedOrder: recommendedOrder,
      urgency: urgency as 'low' | 'medium' | 'high',
      reasoning: urgency === 'high' 
        ? `Stok sangat rendah (${item.kuantitas}) untuk menu ${item.nama_menu}`
        : urgency === 'medium'
        ? `Stok sedang (${item.kuantitas}) perlu diisi ulang untuk menu ${item.nama_menu}`
        : `Stok cukup namun perlu monitoring untuk menu ${item.nama_menu}`,
      estimatedCost: estimatedCost
    };
  });

  const summary = {
    totalIngredients: predictions.length,
    highUrgency: predictions.filter(p => p.urgency === 'high').length,
    estimatedTotalCost: predictions.reduce((sum, p) => sum + p.estimatedCost, 0)
  };

  return { predictions, summary };
}

export async function POST(request: NextRequest) {
  try {
    const { period = 'week' } = await request.json();
    
    console.log('Fetching stock and sales data...');
    
    // Get data from database
    const [stockData, salesData] = await Promise.all([
      getStockData(),
      getSalesData()
    ]);

    console.log(`Found ${stockData.length} priority stock items and ${salesData.length} sales records`);

    if (stockData.length === 0) {
      return NextResponse.json(
        { error: 'No stock data found that needs attention' },
        { status: 404 }
      );
    }

    console.log('Generating AI predictions...');
    
    // Generate AI predictions
    const predictions = await generatePredictions(stockData, salesData, period);
    
    console.log('Saving predictions to file...');
    
    // Save predictions to public directory
    const publicPath = path.join(process.cwd(), 'public', 'predictions.json');
    await writeFile(publicPath, JSON.stringify(predictions, null, 2), 'utf8');
    
    console.log('Stock predictions generated successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock predictions generated successfully',
      predictionsCount: predictions.predictions?.length || 0,
      summary: predictions.summary
    });
    
  } catch (error) {
    console.error('Error in stock predictions API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}