// app/api/predict-top-menu/route.ts - Top Menu Predictions
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface TopMenuPrediction {
  menu_name: string;
  predicted_sales: number;
  confidence: number;
  reasoning: string;
  trend: 'rising' | 'stable' | 'declining';
  recommendation: string;
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🍽️ Generating top menu predictions...');
    
    const restaurantId = '1'; // Default restaurant

    // Get menu performance data
    const menuPerformanceQuery = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as total_orders,
        SUM(mm.kuantitas) as total_quantity,
        SUM(mm.kuantitas * m.Harga) as total_revenue,
        AVG(mm.kuantitas) as avg_quantity_per_order
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_revenue DESC
      LIMIT 15
    `;
    
    const menuData = await query(menuPerformanceQuery, [restaurantId, restaurantId]);
    
    // Get recent trends (last 30 days vs previous 30 days)
    const trendQuery = `
      SELECT 
        m.Nama_Menu,
        COUNT(mm.id_menu) as recent_orders,
        SUM(mm.kuantitas) as recent_quantity
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.id_restaurant = ?
      AND c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY m.Id_Menu, m.Nama_Menu
    `;
    
    const recentTrends = await query(trendQuery, [restaurantId, restaurantId]);
    
    // Create trend map
    const trendMap: { [key: string]: { orders: number; quantity: number } } = {};
    recentTrends.forEach((item: any) => {
      trendMap[item.Nama_Menu] = {
        orders: safeNumber(item.recent_orders),
        quantity: safeNumber(item.recent_quantity)
      };
    });

    // Generate predictions
    const predictions: TopMenuPrediction[] = [];
    
    // Try LLM enhancement first
    try {
      const menuSummary = menuData.map((item: any) => 
        `${item.Nama_Menu} (${item.Kategori}): ${item.total_orders} orders, Rp ${safeNumber(item.total_revenue).toLocaleString()}`
      ).join('\n');
      
      const prompt = `
      Analisis performa menu restoran dan prediksi tren menu terpopuler:
      
      DATA MENU (Revenue Tertinggi):
      ${menuSummary}
      
      Berikan prediksi untuk 5 menu teratas dalam format JSON array:
      [
        {
          "menu_name": "nama menu",
          "predicted_sales": number,
          "confidence": number,
          "reasoning": "alasan prediksi",
          "trend": "rising/stable/declining",
          "recommendation": "rekomendasi strategis"
        }
      ]
      
      Pertimbangkan popularitas saat ini, kategori makanan, dan potensi tren masa depan.
      `;

      const llmResponse = await callGroqLLM(prompt, 1000, 0.5);
      const llmPredictions = JSON.parse(llmResponse);
      
      if (Array.isArray(llmPredictions) && llmPredictions.length > 0) {
        return NextResponse.json({
          success: true,
          predictions: llmPredictions,
          method: 'LLM-Enhanced Analysis',
          metadata: {
            menu_items_analyzed: menuData.length,
            generated_at: new Date().toISOString()
          }
        });
      }
    } catch (llmError) {
      console.warn('LLM prediction failed, using statistical method:', llmError);
    }

    // Fallback to statistical predictions
    for (let i = 0; i < Math.min(5, menuData.length); i++) {
      const menu = menuData[i];
      const recentData = trendMap[menu.Nama_Menu];
      
      // Calculate trend
      const historicalAvgOrders = safeNumber(menu.total_orders) / 12; // Assume 12 months of data
      const recentOrders = recentData ? recentData.orders : 0;
      const trendScore = historicalAvgOrders > 0 ? (recentOrders - historicalAvgOrders) / historicalAvgOrders : 0;
      
      let trend: 'rising' | 'stable' | 'declining';
      if (trendScore > 0.1) trend = 'rising';
      else if (trendScore < -0.1) trend = 'declining';
      else trend = 'stable';
      
      // Predict next month sales
      const baseOrders = Math.max(recentOrders, historicalAvgOrders);
      const growthFactor = trend === 'rising' ? 1.2 : trend === 'declining' ? 0.8 : 1.0;
      const predictedSales = Math.round(baseOrders * growthFactor * safeNumber(menu.Harga));
      
      // Calculate confidence based on data consistency
      const confidence = Math.min(95, Math.max(60, 80 - Math.abs(trendScore * 100)));
      
      // Generate reasoning and recommendation
      const reasoning = trend === 'rising' ? 
        `Menu ini menunjukkan tren peningkatan dengan ${recentOrders} pesanan bulan ini vs rata-rata ${historicalAvgOrders.toFixed(1)}` :
        trend === 'declining' ?
        `Menu ini mengalami penurunan permintaan dari rata-rata ${historicalAvgOrders.toFixed(1)} menjadi ${recentOrders} pesanan` :
        `Menu ini memiliki performa stabil dengan konsistensi pesanan sekitar ${recentOrders}`;
      
      const recommendation = trend === 'rising' ? 
        'Tingkatkan stok dan pertimbangkan promosi untuk memaksimalkan momentum' :
        trend === 'declining' ?
        'Evaluasi resep atau harga, pertimbangkan inovasi menu' :
        'Pertahankan kualitas dan konsistensi, monitor kompetitor';

      predictions.push({
        menu_name: menu.Nama_Menu,
        predicted_sales: predictedSales,
        confidence: Math.round(confidence),
        reasoning: reasoning,
        trend: trend,
        recommendation: recommendation
      });
    }

    return NextResponse.json({
      success: true,
      predictions: predictions,
      method: 'Statistical Analysis',
      metadata: {
        menu_items_analyzed: menuData.length,
        trend_data_available: Object.keys(trendMap).length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating top menu predictions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate top menu predictions',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      predictions: []
    }, { status: 500 });
  }
}