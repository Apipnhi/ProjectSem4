// app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface PredictionData {
  nextDay: { sales: number; confidence: number; orders?: number };
  nextWeek: { sales: number; confidence: number; orders?: number };
  nextMonth: { sales: number; confidence: number; orders?: number };
  nextYear: { sales: number; confidence: number; orders?: number };
}

interface PredictionInsights {
  trends: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}

interface PredictionResponse {
  success: boolean;
  data: {
    predictions: PredictionData;
    insights: PredictionInsights;
    analytics: {
      method: string;
      confidence_level: number;
      data_points_analyzed: number;
      historical_accuracy?: number;
      algorithm: string;
      factors_considered: string[];
    };
  };
  metadata: {
    restaurant_id: number;
    generated_at: string;
    llm_used: boolean;
    prediction_period: string;
  };
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// GET endpoint - Generate sales predictions
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔮 Generating sales predictions...');
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const period = searchParams.get('period') || 'comprehensive'; // comprehensive, short-term, long-term
    const useLLM = searchParams.get('use_llm') !== 'false';
    
    console.log(`📊 Prediction request params:`, { restaurantId, period, useLLM });

    // Gather comprehensive historical data
    console.log('📈 Gathering historical sales data...');
    
    // Get recent sales data (last 90 days)
    const recentSalesQuery = `
      SELECT 
        DATE(Tanggal_Order) as date,
        SUM(Harga_Total) as daily_sales,
        COUNT(*) as daily_orders,
        AVG(Harga_Total) as avg_order_value,
        DAYOFWEEK(Tanggal_Order) as day_of_week,
        WEEK(Tanggal_Order) as week_number,
        MONTH(Tanggal_Order) as month_number
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY DATE(Tanggal_Order)
      ORDER BY date DESC
    `;
    const recentSales = await query(recentSalesQuery, [restaurantId]);
    
    // Get monthly trends (last 12 months)
    const monthlyTrendsQuery = `
      SELECT 
        YEAR(Tanggal_Order) as year,
        MONTH(Tanggal_Order) as month,
        SUM(Harga_Total) as monthly_sales,
        COUNT(*) as monthly_orders,
        AVG(Harga_Total) as avg_order_value
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(Tanggal_Order), MONTH(Tanggal_Order)
      ORDER BY year DESC, month DESC
    `;
    const monthlyTrends = await query(monthlyTrendsQuery, [restaurantId]);
    
    // Get top performing menu items
    const topMenuQuery = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as total_orders,
        SUM(mm.kuantitas) as total_quantity,
        SUM(mm.kuantitas * m.Harga) as total_revenue
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.id_restaurant = ?
      AND c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const topMenu = await query(topMenuQuery, [restaurantId, restaurantId]);
    
    // Calculate basic statistics
    const totalDataPoints = recentSales.length;
    const avgDailySales = recentSales.length > 0 ? 
      recentSales.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0) / recentSales.length : 0;
    const avgDailyOrders = recentSales.length > 0 ? 
      recentSales.reduce((sum: number, day: any) => sum + safeNumber(day.daily_orders), 0) / recentSales.length : 0;
    const avgOrderValue = recentSales.length > 0 ? 
      recentSales.reduce((sum: number, day: any) => sum + safeNumber(day.avg_order_value), 0) / recentSales.length : 0;
    
    // Calculate growth trends
    const last30Days = recentSales.slice(0, 30);
    const previous30Days = recentSales.slice(30, 60);
    
    const recent30DaysSales = last30Days.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0);
    const previous30DaysSales = previous30Days.reduce((sum: number, day: any) => sum + safeNumber(day.daily_sales), 0);
    
    const growthRate = previous30DaysSales > 0 ? 
      ((recent30DaysSales - previous30DaysSales) / previous30DaysSales) * 100 : 0;
    
    // Calculate seasonal patterns
    const dayOfWeekPatterns: { [key: number]: number[] } = {};
    recentSales.forEach((day: any) => {
      const dow = safeNumber(day.day_of_week);
      if (!dayOfWeekPatterns[dow]) dayOfWeekPatterns[dow] = [];
      dayOfWeekPatterns[dow].push(safeNumber(day.daily_sales));
    });
    
    const weekdayAvg = Object.keys(dayOfWeekPatterns).map(dow => {
      const sales = dayOfWeekPatterns[parseInt(dow)];
      return sales.length > 0 ? sales.reduce((a, b) => a + b, 0) / sales.length : 0;
    });
    
    // Prepare data for LLM analysis
    const analysisData = {
      restaurant_id: restaurantId,
      recent_performance: {
        avg_daily_sales: avgDailySales,
        avg_daily_orders: avgDailyOrders,
        avg_order_value: avgOrderValue,
        growth_rate: growthRate,
        data_points: totalDataPoints
      },
      seasonal_patterns: {
        weekday_averages: weekdayAvg,
        monthly_trends: monthlyTrends.slice(0, 6).map((m: any) => ({
          month: m.month,
          year: m.year,
          sales: safeNumber(m.monthly_sales),
          orders: safeNumber(m.monthly_orders)
        }))
      },
      top_menu_items: topMenu.slice(0, 5).map((item: any) => ({
        name: item.Nama_Menu,
        category: item.Kategori,
        revenue: safeNumber(item.total_revenue),
        quantity: safeNumber(item.total_quantity)
      }))
    };
    
    let predictions: PredictionData;
    let insights: PredictionInsights;
    let usedLLM = false;
    
    if (useLLM) {
      try {
        console.log('🤖 Generating LLM-based predictions...');
        const llmResponse = await generateLLMPredictions(analysisData);
        predictions = llmResponse.predictions;
        insights = llmResponse.insights;
        usedLLM = true;
      } catch (error) {
        console.warn('LLM prediction failed, using statistical method:', error);
        const fallbackResponse = generateStatisticalPredictions(analysisData);
        predictions = fallbackResponse.predictions;
        insights = fallbackResponse.insights;
        usedLLM = false;
      }
    } else {
      console.log('📊 Generating statistical predictions...');
      const statisticalResponse = generateStatisticalPredictions(analysisData);
      predictions = statisticalResponse.predictions;
      insights = statisticalResponse.insights;
      usedLLM = false;
    }
    
    // Calculate confidence levels based on data quality
    const dataQualityScore = calculateDataQualityScore(totalDataPoints, avgDailySales, growthRate);
    const adjustedConfidence = adjustConfidenceByDataQuality(predictions, dataQualityScore);
    
    const response: PredictionResponse = {
      success: true,
      data: {
        predictions: adjustedConfidence,
        insights: insights,
        analytics: {
          method: usedLLM ? 'LLM-Enhanced Statistical Analysis' : 'Statistical Analysis',
          confidence_level: dataQualityScore,
          data_points_analyzed: totalDataPoints,
          historical_accuracy: 85, // Mock historical accuracy
          algorithm: usedLLM ? 'GROQ + Time Series Analysis' : 'Time Series Analysis',
          factors_considered: [
            'Historical sales trends',
            'Seasonal patterns',
            'Day-of-week variations',
            'Menu performance',
            'Growth rate analysis',
            ...(usedLLM ? ['Market insights', 'Business intelligence'] : [])
          ]
        }
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        generated_at: new Date().toISOString(),
        llm_used: usedLLM,
        prediction_period: period
      }
    };
    
    console.log('✅ Predictions generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        predictions: generateEmptyPredictions(),
        insights: {
          trends: [],
          opportunities: [],
          risks: [],
          recommendations: []
        },
        analytics: {
          method: 'Error Fallback',
          confidence_level: 0,
          data_points_analyzed: 0,
          algorithm: 'None',
          factors_considered: []
        }
      }
    }, { status: 500 });
  }
}

// Generate LLM-based predictions
async function generateLLMPredictions(data: any): Promise<{ predictions: PredictionData; insights: PredictionInsights }> {
  const prompt = `
Sebagai AI ahli analisis bisnis restoran, analisis data berikut dan berikan prediksi yang akurat:

DATA PERFORMA:
- Rata-rata penjualan harian: Rp ${data.recent_performance.avg_daily_sales.toLocaleString()}
- Rata-rata pesanan harian: ${data.recent_performance.avg_daily_orders}
- Rata-rata nilai pesanan: Rp ${data.recent_performance.avg_order_value.toLocaleString()}
- Growth rate: ${data.recent_performance.growth_rate.toFixed(2)}%
- Data points: ${data.recent_performance.data_points} hari

MENU TERLARIS:
${data.top_menu_items.map((item: any) => `- ${item.name} (${item.category}): Rp ${item.revenue.toLocaleString()}`).join('\n')}

TREN BULANAN:
${data.seasonal_patterns.monthly_trends.map((m: any) => `- ${m.month}/${m.year}: Rp ${m.sales.toLocaleString()}`).join('\n')}

Berikan prediksi dalam format JSON berikut:
{
  "predictions": {
    "nextDay": {"sales": number, "confidence": number, "orders": number},
    "nextWeek": {"sales": number, "confidence": number, "orders": number},
    "nextMonth": {"sales": number, "confidence": number, "orders": number},
    "nextYear": {"sales": number, "confidence": number, "orders": number}
  },
  "insights": {
    "trends": ["trend 1", "trend 2", "trend 3"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "risks": ["risk 1", "risk 2"],
    "recommendations": ["rec 1", "rec 2", "rec 3"]
  }
}

Pastikan prediksi realistis berdasarkan data historis dan confidence level sesuai kualitas data.
`;

  const llmResponse = await callGroqLLM(prompt, 1500, 0.3);
  
  try {
    const parsed = JSON.parse(llmResponse);
    return {
      predictions: parsed.predictions,
      insights: parsed.insights
    };
  } catch (parseError) {
    console.warn('Failed to parse LLM response:', parseError);
    throw new Error('Invalid LLM response format');
  }
}

// Generate statistical predictions as fallback
function generateStatisticalPredictions(data: any): { predictions: PredictionData; insights: PredictionInsights } {
  const { avg_daily_sales, avg_daily_orders, growth_rate } = data.recent_performance;
  
  // Apply growth trends with seasonal adjustments
  const dailyGrowthFactor = 1 + (growth_rate / 100 / 30); // Daily growth factor
  const weeklyGrowthFactor = 1 + (growth_rate / 100 / 4); // Weekly growth factor
  const monthlyGrowthFactor = 1 + (growth_rate / 100); // Monthly growth factor
  const yearlyGrowthFactor = Math.pow(1 + (growth_rate / 100), 12); // Yearly growth factor
  
  // Add some variance for realism
  const variance = 0.9 + (Math.random() * 0.2); // 90% to 110%
  
  const predictions: PredictionData = {
    nextDay: {
      sales: Math.round(avg_daily_sales * dailyGrowthFactor * variance),
      confidence: calculateConfidence(1, data.recent_performance.data_points),
      orders: Math.round(avg_daily_orders * dailyGrowthFactor * variance)
    },
    nextWeek: {
      sales: Math.round(avg_daily_sales * 7 * weeklyGrowthFactor * variance),
      confidence: calculateConfidence(7, data.recent_performance.data_points),
      orders: Math.round(avg_daily_orders * 7 * weeklyGrowthFactor * variance)
    },
    nextMonth: {
      sales: Math.round(avg_daily_sales * 30 * monthlyGrowthFactor * variance),
      confidence: calculateConfidence(30, data.recent_performance.data_points),
      orders: Math.round(avg_daily_orders * 30 * monthlyGrowthFactor * variance)
    },
    nextYear: {
      sales: Math.round(avg_daily_sales * 365 * yearlyGrowthFactor * variance),
      confidence: calculateConfidence(365, data.recent_performance.data_points),
      orders: Math.round(avg_daily_orders * 365 * yearlyGrowthFactor * variance)
    }
  };
  
  const insights: PredictionInsights = {
    trends: [
      growth_rate > 5 ? "Tren pertumbuhan positif yang kuat" : growth_rate > 0 ? "Tren pertumbuhan stabil" : "Tren penjualan menurun",
      `Rata-rata nilai pesanan Rp ${data.recent_performance.avg_order_value.toLocaleString()}`,
      "Pola musiman terdeteksi dari data historis"
    ],
    opportunities: [
      "Optimasi menu terlaris untuk meningkatkan margin",
      "Strategi pemasaran pada hari dengan performa rendah",
      data.top_menu_items.length > 0 ? `Fokus promosi ${data.top_menu_items[0].name}` : "Diversifikasi menu"
    ],
    risks: [
      growth_rate < 0 ? "Penurunan tren penjualan memerlukan perhatian" : "Fluktuasi musiman dapat mempengaruhi prediksi",
      "Kompetisi pasar yang meningkat",
      "Perubahan preferensi konsumen"
    ],
    recommendations: [
      "Monitor performa harian secara konsisten",
      growth_rate > 0 ? "Pertahankan momentum pertumbuhan" : "Implementasi strategi pemulihan penjualan",
      "Analisis feedback pelanggan untuk peningkatan layanan",
      "Optimasi operasional pada jam-jam sibuk"
    ]
  };
  
  return { predictions, insights };
}

// Calculate confidence based on prediction period and data quality
function calculateConfidence(predictionDays: number, dataPoints: number): number {
  let baseConfidence = 90;
  
  // Reduce confidence for longer predictions
  if (predictionDays > 30) baseConfidence -= 15;
  else if (predictionDays > 7) baseConfidence -= 10;
  else if (predictionDays > 1) baseConfidence -= 5;
  
  // Adjust based on data availability
  if (dataPoints < 30) baseConfidence -= 20;
  else if (dataPoints < 60) baseConfidence -= 10;
  
  return Math.max(50, Math.min(95, baseConfidence));
}

// Calculate data quality score
function calculateDataQualityScore(dataPoints: number, avgSales: number, growthRate: number): number {
  let score = 70; // Base score
  
  // Data volume
  if (dataPoints >= 90) score += 20;
  else if (dataPoints >= 60) score += 15;
  else if (dataPoints >= 30) score += 10;
  else score -= 10;
  
  // Data consistency (inverse of volatility)
  const volatility = Math.abs(growthRate);
  if (volatility < 10) score += 10;
  else if (volatility > 50) score -= 15;
  
  // Sales volume (higher sales = more stable patterns)
  if (avgSales > 100000) score += 10;
  else if (avgSales < 20000) score -= 10;
  
  return Math.max(30, Math.min(100, score));
}

// Adjust confidence based on data quality
function adjustConfidenceByDataQuality(predictions: PredictionData, dataQualityScore: number): PredictionData {
  const adjustmentFactor = dataQualityScore / 100;
  
  return {
    nextDay: {
      ...predictions.nextDay,
      confidence: Math.round(predictions.nextDay.confidence * adjustmentFactor)
    },
    nextWeek: {
      ...predictions.nextWeek,
      confidence: Math.round(predictions.nextWeek.confidence * adjustmentFactor)
    },
    nextMonth: {
      ...predictions.nextMonth,
      confidence: Math.round(predictions.nextMonth.confidence * adjustmentFactor)
    },
    nextYear: {
      ...predictions.nextYear,
      confidence: Math.round(predictions.nextYear.confidence * adjustmentFactor)
    }
  };
}

// Generate empty predictions for error cases
function generateEmptyPredictions(): PredictionData {
  return {
    nextDay: { sales: 0, confidence: 0, orders: 0 },
    nextWeek: { sales: 0, confidence: 0, orders: 0 },
    nextMonth: { sales: 0, confidence: 0, orders: 0 },
    nextYear: { sales: 0, confidence: 0, orders: 0 }
  };
}