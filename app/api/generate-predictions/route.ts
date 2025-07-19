// app/api/generate-predictions/route.ts - Sales Predictions
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface Predictions {
  nextDay?: { sales: number; confidence: number };
  nextMonth?: { sales: number; confidence: number };
  nextYear?: { sales: number; confidence: number };
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔮 Generating sales predictions...');
    
    const body = await request.json();
    const { period } = body;
    const restaurantId = '1'; // Default restaurant

    // Get historical sales data
    const historicalQuery = `
      SELECT 
        DATE(Tanggal_Order) as date,
        SUM(Harga_Total) as daily_sales,
        COUNT(*) as daily_orders
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY DATE(Tanggal_Order)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const historicalData = await query(historicalQuery, [restaurantId]);
    
    // Calculate averages
    const avgDailySales = historicalData.length > 0 ? 
      historicalData.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0) / historicalData.length : 50000;
    
    const avgDailyOrders = historicalData.length > 0 ? 
      historicalData.reduce((sum: number, day: any) => sum + safeNumber(day.daily_orders), 0) / historicalData.length : 25;

    // Get growth trend
    const recentData = historicalData.slice(0, 7);
    const olderData = historicalData.slice(7, 14);
    
    const recentAvg = recentData.length > 0 ? 
      recentData.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0) / recentData.length : avgDailySales;
    
    const olderAvg = olderData.length > 0 ? 
      olderData.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0) / olderData.length : avgDailySales;
    
    const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) : 0;

    // Generate predictions with some intelligence
    const nextDayVariance = 0.85 + Math.random() * 0.3; // 85-115% of average
    const nextMonthGrowth = 1 + (growthRate * 0.5); // Apply half of growth rate
    const nextYearGrowth = Math.pow(1 + (growthRate * 0.3), 12); // Annual growth

    const predictions: Predictions = {
      nextDay: {
        sales: Math.round(avgDailySales * nextDayVariance),
        confidence: Math.min(95, Math.max(60, 85 - Math.abs(growthRate * 100)))
      },
      nextMonth: {
        sales: Math.round(avgDailySales * 30 * nextMonthGrowth),
        confidence: Math.min(90, Math.max(55, 80 - Math.abs(growthRate * 150)))
      },
      nextYear: {
        sales: Math.round(avgDailySales * 365 * nextYearGrowth),
        confidence: Math.min(80, Math.max(45, 70 - Math.abs(growthRate * 200)))
      }
    };

    // Try to enhance with LLM if available
    try {
      const prompt = `
      Analisis data penjualan restoran dan berikan prediksi yang akurat:
      
      DATA HISTORIS (30 hari terakhir):
      - Rata-rata penjualan harian: Rp ${avgDailySales.toLocaleString()}
      - Rata-rata pesanan harian: ${avgDailyOrders}
      - Growth rate: ${(growthRate * 100).toFixed(2)}%
      
      Berikan prediksi dalam format JSON:
      {
        "nextDay": {"sales": number, "confidence": number},
        "nextMonth": {"sales": number, "confidence": number},
        "nextYear": {"sales": number, "confidence": number}
      }
      
      Pertimbangkan tren pertumbuhan dan pola musiman.
      `;

      const llmResponse = await callGroqLLM(prompt, 500, 0.3);
      const llmPredictions = JSON.parse(llmResponse);
      
      // Use LLM predictions if valid
      if (llmPredictions.nextDay && llmPredictions.nextMonth && llmPredictions.nextYear) {
        return NextResponse.json({
          success: true,
          predictions: llmPredictions,
          method: 'LLM-Enhanced',
          metadata: {
            historical_days: historicalData.length,
            avg_daily_sales: avgDailySales,
            growth_rate: growthRate,
            generated_at: new Date().toISOString()
          }
        });
      }
    } catch (llmError) {
      console.warn('LLM prediction failed, using statistical method:', llmError);
    }

    return NextResponse.json({
      success: true,
      predictions: predictions,
      method: 'Statistical Analysis',
      metadata: {
        historical_days: historicalData.length,
        avg_daily_sales: avgDailySales,
        growth_rate: growthRate,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}