// app/api/generate-predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface SalesData {
  date?: string;
  month?: string;
  year?: string;
  sales: number;
  orders: number;
  avgOrder: number;
}

interface MenuSales {
  id_menu: number;
  nama_menu: string;
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  avg_price: number;
}

async function getSalesOverview(): Promise<SalesData[]> {
  const sql = `
    SELECT 
      DATE(c.Tanggal_Order) as date,
      SUM(c.Harga_Total) as sales,
      COUNT(c.Invoice_Id) as orders,
      AVG(c.Harga_Total) as avgOrder
    FROM Customer c
    WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(c.Tanggal_Order)
    ORDER BY DATE(c.Tanggal_Order) ASC
  `;
  
  const results = await query(sql);
  return results as SalesData[];
}

async function getMonthlySales(): Promise<SalesData[]> {
  const sql = `
    SELECT 
      DATE_FORMAT(c.Tanggal_Order, '%Y-%m') as month,
      SUM(c.Harga_Total) as sales,
      COUNT(c.Invoice_Id) as orders,
      AVG(c.Harga_Total) as avgOrder
    FROM Customer c
    WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(c.Tanggal_Order, '%Y-%m')
    ORDER BY month ASC
  `;
  
  const results = await query(sql);
  return results as SalesData[];
}

async function getYearlySales(): Promise<SalesData[]> {
  const sql = `
    SELECT 
      YEAR(c.Tanggal_Order) as year,
      SUM(c.Harga_Total) as sales,
      COUNT(c.Invoice_Id) as orders,
      AVG(c.Harga_Total) as avgOrder
    FROM Customer c
    GROUP BY YEAR(c.Tanggal_Order)
    ORDER BY year ASC
  `;
  
  const results = await query(sql);
  return results as SalesData[];
}

async function getMenuSalesData(): Promise<MenuSales[]> {
  const sql = `
    SELECT 
      m.Id_Menu as id_menu,
      m.Nama_Menu as nama_menu,
      COUNT(mm.id_customer) as total_sales,
      SUM(mm.kuantitas) as total_orders,
      SUM(mm.kuantitas * m.Harga) as total_revenue,
      m.Harga as avg_price
    FROM menu m
    LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
    LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
    WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
    GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga
    HAVING total_sales > 0
    ORDER BY total_revenue DESC
    LIMIT 20
  `;
  
  const results = await query(sql);
  return results as MenuSales[];
}

async function generateSalesPredictions(salesData: SalesData[], period: string) {
  const prompt = `
Sebagai AI ahli analisis penjualan restoran, analisis data penjualan berikut dan berikan prediksi:

DATA PENJUALAN:
${JSON.stringify(salesData.slice(-10), null, 2)}

PERIODE ANALISIS: ${period}

Berdasarkan tren data penjualan, buat prediksi untuk:
1. Penjualan hari berikutnya
2. Penjualan bulan berikutnya  
3. Penjualan tahun berikutnya

Pertimbangkan:
- Tren pertumbuhan historical
- Pola musiman
- Fluktuasi order value
- Faktor eksternal yang mungkin mempengaruhi

Respon dengan JSON format:
{
  "predictions": {
    "nextDay": {
      "sales": number,
      "confidence": number (1-100)
    },
    "nextMonth": {
      "sales": number,
      "confidence": number (1-100)
    },
    "nextYear": {
      "sales": number,
      "confidence": number (1-100)
    }
  }
}
`;

  try {
    const aiResponse = await callGroqLLM(prompt, 1024, 0.2);
    
    // Parse JSON response
    let cleanedContent = aiResponse.trim();
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found');
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    const predictions = JSON.parse(jsonString);
    
    return predictions;
  } catch (error) {
    console.error('Error generating sales predictions:', error);
    
    // Fallback predictions based on trend analysis
    const recentSales = salesData.slice(-5);
    const avgSales = recentSales.reduce((sum, item) => sum + item.sales, 0) / recentSales.length;
    const growthRate = recentSales.length >= 2 ? 
      (recentSales[recentSales.length - 1].sales - recentSales[0].sales) / recentSales[0].sales : 0.05;
    
    return {
      predictions: {
        nextDay: {
          sales: Math.round(avgSales * (1 + growthRate * 0.1)),
          confidence: 75
        },
        nextMonth: {
          sales: Math.round(avgSales * 30 * (1 + growthRate * 0.5)),
          confidence: 70
        },
        nextYear: {
          sales: Math.round(avgSales * 365 * (1 + growthRate * 2)),
          confidence: 60
        }
      }
    };
  }
}

async function generateTopMenuPredictions(menuData: MenuSales[], period: string) {
  const prompt = `
Sebagai AI ahli analisis menu restoran, analisis data penjualan menu berikut:

DATA MENU SALES:
${JSON.stringify(menuData.slice(0, 10), null, 2)}

PERIODE: ${period}

Prediksi 5 menu yang akan menjadi top seller berdasarkan:
1. Tren penjualan saat ini
2. Margin keuntungan
3. Popularitas dan review
4. Faktor musiman
5. Harga vs demand

Format response JSON:
{
  "topItems": [
    {
      "name": "nama menu",
      "predictedSales": number,
      "reason": "alasan prediksi singkat",
      "confidence": number (1-100)
    }
  ]
}
`;

  try {
    const aiResponse = await callGroqLLM(prompt, 1024, 0.3);
    
    let cleanedContent = aiResponse.trim();
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found');
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    const predictions = JSON.parse(jsonString);
    
    return predictions;
  } catch (error) {
    console.error('Error generating menu predictions:', error);
    
    // Fallback: return top items by current performance
    const topItems = menuData.slice(0, 5).map((item, index) => ({
      name: item.nama_menu,
      predictedSales: Math.round(item.total_orders * 1.2), // 20% growth prediction
      reason: `Berdasarkan performa historis dengan ${item.total_orders} orders dan revenue Rp${item.total_revenue.toLocaleString()}`,
      confidence: Math.max(60, 90 - index * 5)
    }));
    
    return { topItems };
  }
}

async function generatePromoRecommendations(menuData: MenuSales[], period: string) {
  const prompt = `
Sebagai AI marketing expert untuk restoran, analisis data menu dan buat rekomendasi promosi:

DATA MENU:
${JSON.stringify(menuData.slice(0, 10), null, 2)}

PERIODE: ${period}

Buat 3-4 rekomendasi promosi yang strategis untuk:
1. Meningkatkan penjualan menu dengan potensi tinggi
2. Meningkatkan average order value
3. Menarik customer baru
4. Meningkatkan repeat orders

Format JSON response:
{
  "promos": [
    {
      "type": "jenis promosi",
      "description": "deskripsi singkat promosi",
      "reasoning": "alasan kenapa promosi ini efektif",
      "estimatedImpact": "persentase peningkatan perkiraan",
      "details": "detail implementasi"
    }
  ]
}
`;

  try {
    const aiResponse = await callGroqLLM(prompt, 1536, 0.4);
    
    let cleanedContent = aiResponse.trim();
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found');
    }
    
    const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
    const predictions = JSON.parse(jsonString);
    
    return predictions;
  } catch (error) {
    console.error('Error generating promo recommendations:', error);
    
    // Fallback promotions
    const topMenu = menuData[0];
    const lowPerformer = menuData[Math.floor(menuData.length * 0.7)];
    
    return {
      promos: [
        {
          type: "Bundle Deal",
          description: `Paket ${topMenu?.nama_menu} + Minuman dengan diskon 15%`,
          reasoning: "Menu populer dapat mendorong penjualan item lain",
          estimatedImpact: "+25% orders",
          details: "Berlaku untuk pembelian di atas Rp50.000"
        },
        {
          type: "Happy Hour",
          description: "Diskon 20% untuk semua menu jam 14:00-17:00",
          reasoning: "Meningkatkan traffic di jam sepi",
          estimatedImpact: "+40% afternoon sales",
          details: "Senin-Jumat, tidak berlaku hari libur"
        },
        {
          type: "Menu Spotlight",
          description: `Promosi khusus ${lowPerformer?.nama_menu} dengan diskon 30%`,
          reasoning: "Meningkatkan awareness untuk menu yang kurang laku",
          estimatedImpact: "+60% specific item sales",
          details: "Berlaku 1 minggu, maksimal 2 porsi per customer"
        }
      ]
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { salesData, period, menuSales, promoAnalysis } = body;

    console.log('Generate predictions request:', { period, promoAnalysis });

    // If external sales data provided, use it; otherwise fetch from DB
    let actualSalesData = salesData;
    if (!salesData) {
      switch (period) {
        case 'daily':
          actualSalesData = await getSalesOverview();
          break;
        case 'monthly':
          actualSalesData = await getMonthlySales();
          break;
        case 'yearly':
          actualSalesData = await getYearlySales();
          break;
        default:
          actualSalesData = await getSalesOverview();
      }
    }

    let menuData = menuSales;
    if (!menuData) {
      menuData = await getMenuSalesData();
    }

    // Generate different types of predictions based on request
    if (promoAnalysis) {
      // Generate promotion recommendations
      const promoRecommendations = await generatePromoRecommendations(menuData, period);
      return NextResponse.json(promoRecommendations);
    } else if (menuSales) {
      // Generate top menu predictions
      const topMenuPredictions = await generateTopMenuPredictions(menuData, period);
      return NextResponse.json(topMenuPredictions);
    } else {
      // Generate sales predictions
      const predictions = await generateSalesPredictions(actualSalesData, period);
      return NextResponse.json(predictions);
    }

  } catch (error) {
    console.error('Error in generate predictions API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}