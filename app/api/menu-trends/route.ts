// app/api/menu-trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface MenuSalesData {
  Id_Menu: number;
  Nama_Menu: string;
  Kategori: string;
  Harga: number;
  all_time_sales: number;
  current_period_sales: number;
  previous_period_sales: number;
  total_revenue: number;
  avg_order_frequency: number;
  peak_month: string;
  peak_sales: number;
  recent_trend: string;
}

interface MenuTrend {
  trend: 'rising' | 'declining' | 'stable' | 'new';
  itemName: string;
  currentSales: number;
  predictedSales: number;
  growthRate: number;
  reasoning: string;
  recommendations: string[];
  category: string;
  seasonality?: string;
  confidence: number;
}

interface TrendSummary {
  totalTrends: number;
  risingTrends: number;
  decliningTrends: number;
  stableTrends: number;
  newOpportunities: number;
  estimatedRevenueImpact: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period = 'month', restaurantId = 1 } = body;

    console.log('Generating menu trends analysis for period:', period);

    // Get comprehensive menu sales data
    const menuSalesData = await getComprehensiveMenuSalesData(parseInt(restaurantId), period);
    
    if (menuSalesData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sales data available for trend analysis'
      }, { status: 404 });
    }

    // Generate AI trends analysis
    const trendsAnalysis = await generateMenuTrends(menuSalesData, period);

    return NextResponse.json({
      success: true,
      data: trendsAnalysis
    });

  } catch (error) {
    console.error('Error generating menu trends:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate menu trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get comprehensive menu sales data for trend analysis (ALL TIME DATA)
async function getComprehensiveMenuSalesData(restaurantId: number, period: string): Promise<MenuSalesData[]> {
  try {
    // Determine date ranges based on period
    let currentPeriodDays = 30;
    let previousPeriodDays = 60;
    
    switch (period) {
      case 'week':
        currentPeriodDays = 7;
        previousPeriodDays = 14;
        break;
      case 'month':
        currentPeriodDays = 30;
        previousPeriodDays = 60;
        break;
      case 'quarter':
        currentPeriodDays = 90;
        previousPeriodDays = 180;
        break;
    }

    const sql = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        
        -- ALL TIME SALES (complete history)
        COALESCE(SUM(mm.kuantitas), 0) as all_time_sales,
        
        -- Current period sales
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL ${currentPeriodDays} DAY) 
          THEN mm.kuantitas 
          ELSE 0 
        END), 0) as current_period_sales,
        
        -- Previous period sales  
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL ${previousPeriodDays} DAY) 
            AND c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL ${currentPeriodDays} DAY)
          THEN mm.kuantitas 
          ELSE 0 
        END), 0) as previous_period_sales,
        
        -- Total revenue ALL TIME
        COALESCE(SUM(mm.kuantitas * m.Harga), 0) as total_revenue,
        
        -- Average order frequency (unique orders)
        COALESCE(COUNT(DISTINCT c.Invoice_Id), 0) as avg_order_frequency,
        
        -- Peak month analysis
        (SELECT DATE_FORMAT(c2.Tanggal_Order, '%Y-%m') 
         FROM MEMESAN_MENU mm2 
         JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id 
         WHERE mm2.id_menu = m.Id_Menu 
         GROUP BY DATE_FORMAT(c2.Tanggal_Order, '%Y-%m')
         ORDER BY SUM(mm2.kuantitas) DESC 
         LIMIT 1) as peak_month,
        
        -- Peak sales count
        (SELECT MAX(monthly_sales) FROM (
          SELECT SUM(mm3.kuantitas) as monthly_sales
          FROM MEMESAN_MENU mm3 
          JOIN Customer c3 ON mm3.id_customer = c3.Invoice_Id 
          WHERE mm3.id_menu = m.Id_Menu 
          GROUP BY DATE_FORMAT(c3.Tanggal_Order, '%Y-%m')
        ) as peak_data) as peak_sales,
        
        -- Recent trend (last 3 months vs 3 months before)
        CASE 
          WHEN 
            COALESCE(SUM(CASE 
              WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) 
              THEN mm.kuantitas ELSE 0 END), 0) > 
            COALESCE(SUM(CASE 
              WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 180 DAY) 
                AND c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
              THEN mm.kuantitas ELSE 0 END), 0) * 1.1
          THEN 'increasing'
          WHEN 
            COALESCE(SUM(CASE 
              WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) 
              THEN mm.kuantitas ELSE 0 END), 0) < 
            COALESCE(SUM(CASE 
              WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 180 DAY) 
                AND c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
              THEN mm.kuantitas ELSE 0 END), 0) * 0.9
          THEN 'decreasing'
          ELSE 'stable'
        END as recent_trend
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ${restaurantId}
        AND m.Status = 1
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY all_time_sales DESC, total_revenue DESC
    `;

    console.log('Comprehensive menu sales analysis SQL:', sql);

    const results = await query(sql);
    console.log(`Found ${results.length} menu items with comprehensive sales data`);

    return results as MenuSalesData[];

  } catch (error) {
    console.error('Error getting comprehensive menu sales data:', error);
    throw error;
  }
}

// Generate AI-powered menu trends analysis using ALL TIME DATA
async function generateMenuTrends(menuSalesData: MenuSalesData[], period: string): Promise<{ trends: MenuTrend[], summary: TrendSummary }> {
  try {
    console.log('Generating AI menu trends analysis with comprehensive data...');

    // Prepare comprehensive data for AI analysis
    const salesSummary = menuSalesData.map(item => ({
      name: item.Nama_Menu,
      category: item.Kategori,
      price: item.Harga,
      allTimeSales: item.all_time_sales,
      currentPeriodSales: item.current_period_sales,
      previousPeriodSales: item.previous_period_sales,
      totalRevenue: item.total_revenue,
      orderFrequency: item.avg_order_frequency,
      peakMonth: item.peak_month,
      peakSales: item.peak_sales,
      recentTrend: item.recent_trend,
      growthRate: item.previous_period_sales > 0 ? 
        ((item.current_period_sales - item.previous_period_sales) / item.previous_period_sales * 100) : 
        (item.current_period_sales > 0 ? 100 : 0)
    }));

    // Create comprehensive AI prompt
    const prompt = `
Sebagai AI expert dalam analisis tren menu restoran, analisis data penjualan KOMPREHENSIF berikut untuk periode ${period}:

DATA PENJUALAN MENU (ALL TIME):
${salesSummary.map(item => 
  `- ${item.name} (${item.category}) - Harga: Rp${item.price.toLocaleString()}
    ALL TIME Sales: ${item.allTimeSales} | Current Period: ${item.currentPeriodSales} | Previous: ${item.previousPeriodSales}
    Total Revenue: Rp${item.totalRevenue.toLocaleString()} | Peak Month: ${item.peakMonth} (${item.peakSales} sales)
    Order Frequency: ${item.orderFrequency} orders | Recent Trend: ${item.recentTrend}
    Growth Rate: ${item.growthRate.toFixed(1)}%`
).join('\n')}

Analisis setiap menu berdasarkan DATA HISTORIS LENGKAP dan tentukan tren untuk periode ${period} mendatang:

KRITERIA ANALISIS:
- Gunakan ALL TIME data untuk pattern recognition
- RISING: Tren naik konsisten atau momentum kuat berdasarkan data historis
- DECLINING: Tren turun konsisten atau penurunan signifikan dari peak performance
- STABLE: Performa konsisten dengan fluktuasi minimal
- NEW: Rekomendasi menu baru berdasarkan gap analysis dan seasonal patterns

FAKTOR YANG DIPERTIMBANGKAN:
1. Historical performance (all time sales)
2. Seasonal patterns (peak months)
3. Recent momentum (growth rate)
4. Revenue contribution
5. Order frequency patterns
6. Market positioning berdasarkan harga

Untuk setiap menu, berikan:
1. Trend prediction berdasarkan comprehensive data
2. Prediksi sales realistis untuk periode mendatang
3. Reasoning mendalam mengapa trend tersebut (gunakan historical data)
4. 2-3 rekomendasi aksi spesifik berdasarkan data
5. Confidence level berdasarkan konsistensi historical data

Format JSON response:
{
  "trends": [
    {
      "trend": "rising",
      "itemName": "Nama Menu",
      "currentSales": 45,
      "predictedSales": 60,
      "growthRate": 33.3,
      "reasoning": "Berdasarkan data historis menunjukkan tren naik konsisten dengan peak di bulan X",
      "recommendations": [
        "Rekomendasi berdasarkan historical pattern",
        "Aksi strategis berdasarkan data"
      ],
      "category": "Main Course",
      "seasonality": "Peak performance di bulan tertentu berdasarkan data",
      "confidence": 85
    }
  ]
}

PENTING: Berikan analisis yang mendalam berdasarkan SELURUH DATA HISTORIS, bukan hanya periode terbatas.
`;

    try {
      const aiResponse = await callGroqLLM(prompt, 2048, 0.3);
      console.log('AI response received for comprehensive menu trends');
      
      // Parse AI response
      let cleanedContent = aiResponse.trim();
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
      const aiResult = JSON.parse(jsonString);
      
      if (aiResult.trends && Array.isArray(aiResult.trends)) {
        // Process and validate AI trends
        const processedTrends = aiResult.trends.map((trend: any) => ({
          trend: trend.trend || 'stable',
          itemName: trend.itemName || 'Unknown Menu',
          currentSales: Number(trend.currentSales) || 0,
          predictedSales: Number(trend.predictedSales) || 0,
          growthRate: Number(trend.growthRate) || 0,
          reasoning: trend.reasoning || 'Analysis based on comprehensive sales data',
          recommendations: Array.isArray(trend.recommendations) ? trend.recommendations : [],
          category: trend.category || 'General',
          seasonality: trend.seasonality || '',
          confidence: Math.min(100, Math.max(0, Number(trend.confidence) || 70))
        }));

        // Calculate summary
        const summary = calculateTrendSummary(processedTrends);

        console.log(`Generated ${processedTrends.length} comprehensive menu trend predictions`);

        return {
          trends: processedTrends,
          summary
        };
      } else {
        throw new Error('Invalid AI trends format');
      }

    } catch (aiError) {
      console.error('AI analysis failed, using comprehensive fallback algorithm:', aiError);
      
      // Fallback: Generate trends based on comprehensive mathematical analysis
      const fallbackTrends = generateComprehensiveFallbackTrends(menuSalesData);
      const summary = calculateTrendSummary(fallbackTrends);
      
      return {
        trends: fallbackTrends,
        summary
      };
    }

  } catch (error) {
    console.error('Error generating comprehensive menu trends:', error);
    throw error;
  }
}

// Comprehensive fallback trend analysis using ALL TIME DATA
function generateComprehensiveFallbackTrends(menuSalesData: MenuSalesData[]): MenuTrend[] {
  return menuSalesData.map(item => {
    // Calculate comprehensive growth rate
    const growthRate = item.previous_period_sales > 0 ? 
      ((item.current_period_sales - item.previous_period_sales) / item.previous_period_sales * 100) : 
      (item.current_period_sales > 0 ? 100 : 0);

    // Determine trend based on comprehensive data
    let trend: 'rising' | 'declining' | 'stable' = 'stable';
    
    // Use ALL TIME data for better trend analysis
    const allTimeAverage = item.all_time_sales / Math.max(1, item.avg_order_frequency);
    const recentPerformance = item.current_period_sales;
    
    if (item.recent_trend === 'increasing' && growthRate > 10) {
      trend = 'rising';
    } else if (item.recent_trend === 'decreasing' && growthRate < -10) {
      trend = 'declining';
    } else if (recentPerformance > allTimeAverage * 1.2) {
      trend = 'rising';
    } else if (recentPerformance < allTimeAverage * 0.8) {
      trend = 'declining';
    }

    // Predict future sales based on comprehensive analysis
    let predictedSales = item.current_period_sales;
    
    if (trend === 'rising') {
      predictedSales = Math.round(item.current_period_sales * 1.2);
    } else if (trend === 'declining') {
      predictedSales = Math.round(item.current_period_sales * 0.8);
    } else {
      predictedSales = Math.round(item.current_period_sales * 1.05);
    }

    // Generate comprehensive reasoning
    let reasoning = '';
    if (trend === 'rising') {
      reasoning = `Menu menunjukkan tren positif dengan total penjualan ${item.all_time_sales} sepanjang masa. Peak performance di ${item.peak_month} dengan ${item.peak_sales} penjualan. Recent trend: ${item.recent_trend}. Growth rate: ${growthRate.toFixed(1)}%.`;
    } else if (trend === 'declining') {
      reasoning = `Penjualan menurun dari peak ${item.peak_sales} di ${item.peak_month}. Current performance ${item.current_period_sales} vs previous ${item.previous_period_sales}. Recent trend: ${item.recent_trend}. Perlu evaluasi.`;
    } else {
      reasoning = `Menu stabil dengan total penjualan ${item.all_time_sales} sepanjang masa. Konsisten dengan rata-rata ${Math.round(item.all_time_sales / Math.max(1, item.avg_order_frequency))} per order. Recent trend: ${item.recent_trend}.`;
    }

    // Generate comprehensive recommendations
    const recommendations = [];
    if (trend === 'rising') {
      recommendations.push(`Maksimalkan momentum dengan promosi khusus (peak month: ${item.peak_month})`);
      recommendations.push(`Pertahankan kualitas dan konsistensi produk`);
      recommendations.push(`Tingkatkan stock untuk mengantisipasi demand`);
    } else if (trend === 'declining') {
      recommendations.push(`Analisis penyebab penurunan dari peak ${item.peak_sales} penjualan`);
      recommendations.push(`Pertimbangkan penyesuaian resep atau presentasi`);
      recommendations.push(`Buat promosi reaktivasi untuk mengembalikan popularitas`);
    } else {
      recommendations.push(`Pertahankan standar kualitas yang konsisten`);
      recommendations.push(`Monitor kompetitor dan tren pasar`);
      recommendations.push(`Pertimbangkan variasi menu untuk meningkatkan appeal`);
    }

    // Calculate confidence based on data consistency
    const dataConsistency = item.avg_order_frequency > 0 ? 
      Math.min(95, 60 + Math.log10(item.all_time_sales + 1) * 5) : 50;

    return {
      trend,
      itemName: item.Nama_Menu,
      currentSales: item.current_period_sales,
      predictedSales,
      growthRate: Number(growthRate.toFixed(1)),
      reasoning,
      recommendations,
      category: item.Kategori,
      seasonality: item.peak_month ? `Peak performance di ${item.peak_month}` : 'Data historis menunjukkan pola konsisten',
      confidence: Math.round(dataConsistency)
    };
  });
}

// Calculate trend summary statistics
function calculateTrendSummary(trends: MenuTrend[]): TrendSummary {
  const risingTrends = trends.filter(t => t.trend === 'rising').length;
  const decliningTrends = trends.filter(t => t.trend === 'declining').length;
  const stableTrends = trends.filter(t => t.trend === 'stable').length;
  const newOpportunities = trends.filter(t => t.trend === 'new').length;

  // Calculate estimated revenue impact based on predicted changes
  const estimatedRevenueImpact = trends.reduce((total, trend) => {
    const salesChange = trend.predictedSales - trend.currentSales;
    // Assume average price of Rp 25,000 per item
    return total + (salesChange * 25000);
  }, 0);

  return {
    totalTrends: trends.length,
    risingTrends,
    decliningTrends,
    stableTrends,
    newOpportunities,
    estimatedRevenueImpact: Math.round(estimatedRevenueImpact)
  };
}