// app/api/menu-trends/route.ts - Fixed with proper data type handling
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface MenuSalesData {
  Id_Menu: number;
  Nama_Menu: string;
  Kategori: string;
  Harga: number;
  all_time_sales: number;
  all_time_quantity: number;
  all_time_revenue: number;
  all_time_customers: number;
  monthly_avg_sales: number;
  peak_month: string;
  peak_quantity: number;
  recent_performance: number;
  growth_trend: string;
  price_vs_category_avg: number;
  customer_retention: number;
  seasonal_pattern: string;
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

    console.log('🔍 Generating comprehensive menu trends analysis using ALL TIME data for period:', period);

    // Get COMPREHENSIVE menu sales data (ALL TIME)
    const menuSalesData = await getComprehensiveAllTimeMenuData(parseInt(restaurantId), period);
    
    if (menuSalesData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No sales data available for comprehensive trend analysis'
      }, { status: 404 });
    }

    console.log(`📊 Loaded ${menuSalesData.length} menu items with complete historical data`);

    // Generate AI trends analysis using ALL TIME data
    const trendsAnalysis = await generateComprehensiveMenuTrends(menuSalesData, period);

    return NextResponse.json({
      success: true,
      data: trendsAnalysis
    });

  } catch (error) {
    console.error('❌ Error generating comprehensive menu trends:', error);
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

// Get COMPREHENSIVE ALL TIME menu data with enhanced metrics
async function getComprehensiveAllTimeMenuData(restaurantId: number, period: string): Promise<MenuSalesData[]> {
  try {
    const sql = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        
        -- COMPREHENSIVE ALL TIME METRICS with proper NULL handling
        COALESCE(COUNT(DISTINCT c.Invoice_Id), 0) as all_time_sales,
        COALESCE(SUM(mm.kuantitas), 0) as all_time_quantity,
        COALESCE(SUM(mm.kuantitas * m.Harga), 0) as all_time_revenue,
        COALESCE(COUNT(DISTINCT mm.id_customer), 0) as all_time_customers,
        
        -- PERFORMANCE ANALYSIS with safe division
        CASE 
          WHEN COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m')) > 0 
          THEN ROUND(COALESCE(SUM(mm.kuantitas), 0) / COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m')), 2)
          ELSE 0 
        END as monthly_avg_sales,
        
        -- PEAK PERFORMANCE ANALYSIS
        (SELECT DATE_FORMAT(c2.Tanggal_Order, '%Y-%m') 
         FROM MEMESAN_MENU mm2 
         JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id 
         WHERE mm2.id_menu = m.Id_Menu 
         GROUP BY DATE_FORMAT(c2.Tanggal_Order, '%Y-%m')
         ORDER BY SUM(mm2.kuantitas) DESC 
         LIMIT 1) as peak_month,
        
        (SELECT COALESCE(MAX(monthly_quantity), 0) FROM (
          SELECT SUM(mm3.kuantitas) as monthly_quantity
          FROM MEMESAN_MENU mm3 
          JOIN Customer c3 ON mm3.id_customer = c3.Invoice_Id 
          WHERE mm3.id_menu = m.Id_Menu 
          GROUP BY DATE_FORMAT(c3.Tanggal_Order, '%Y-%m')
        ) peak_data) as peak_quantity,
        
        -- RECENT PERFORMANCE with safe calculations
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) 
          THEN mm.kuantitas ELSE 0 END), 0) as recent_performance,
        
        -- GROWTH TREND ANALYSIS
        CASE 
          WHEN COALESCE(SUM(CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END), 0) >
               COALESCE(SUM(CASE WHEN c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END), 0) * 1.2
          THEN 'consistently_growing'
          WHEN COALESCE(SUM(CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END), 0) <
               COALESCE(SUM(CASE WHEN c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END), 0) * 0.8
          THEN 'declining_trend'
          ELSE 'stable_performance'
        END as growth_trend,
        
        -- PRICE ANALYSIS with safe division
        CASE 
          WHEN (SELECT AVG(m2.Harga) FROM menu m2 WHERE m2.Kategori = m.Kategori AND m2.id_restaurant = m.id_restaurant) > 0
          THEN m.Harga / (SELECT AVG(m2.Harga) FROM menu m2 WHERE m2.Kategori = m.Kategori AND m2.id_restaurant = m.id_restaurant)
          ELSE 1 
        END as price_vs_category_avg,
        
        -- CUSTOMER RETENTION with safe calculations
        CASE 
          WHEN COUNT(DISTINCT mm.id_customer) > 0 
          THEN ROUND((COUNT(mm.id_customer) - COUNT(DISTINCT mm.id_customer)) * 100.0 / COUNT(DISTINCT mm.id_customer), 2)
          ELSE 0 
        END as customer_retention,
        
        -- SEASONAL PATTERN ANALYSIS
        (SELECT 
          CASE 
            WHEN MAX(seasonal_orders) > MIN(seasonal_orders) * 2 THEN 'highly_seasonal'
            WHEN MAX(seasonal_orders) > MIN(seasonal_orders) * 1.5 THEN 'moderately_seasonal'
            ELSE 'consistent_year_round'
          END
         FROM (
           SELECT 
             CASE 
               WHEN MONTH(c2.Tanggal_Order) IN (12, 1, 2) THEN 'Winter'
               WHEN MONTH(c2.Tanggal_Order) IN (3, 4, 5) THEN 'Spring'
               WHEN MONTH(c2.Tanggal_Order) IN (6, 7, 8) THEN 'Summer'
               ELSE 'Fall'
             END as season,
             COUNT(*) as seasonal_orders
           FROM MEMESAN_MENU mm2
           JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id
           WHERE mm2.id_menu = m.Id_Menu
           GROUP BY 
             CASE 
               WHEN MONTH(c2.Tanggal_Order) IN (12, 1, 2) THEN 'Winter'
               WHEN MONTH(c2.Tanggal_Order) IN (3, 4, 5) THEN 'Spring'
               WHEN MONTH(c2.Tanggal_Order) IN (6, 7, 8) THEN 'Summer'
               ELSE 'Fall'
             END
         ) seasonal_data) as seasonal_pattern
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ${restaurantId}
        AND m.Status = 1
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      HAVING all_time_quantity > 0
      ORDER BY all_time_revenue DESC, all_time_quantity DESC
    `;

    console.log('🔄 Executing comprehensive ALL TIME menu analysis query...');
    const results = await query(sql);
    console.log(`✅ Found ${results.length} menu items with comprehensive historical data`);

    return results as MenuSalesData[];

  } catch (error) {
    console.error('❌ Error getting comprehensive ALL TIME menu data:', error);
    throw error;
  }
}

// Generate AI-powered comprehensive menu trends using ALL TIME data - FIXED
async function generateComprehensiveMenuTrends(menuSalesData: MenuSalesData[], period: string): Promise<{ trends: MenuTrend[], summary: TrendSummary }> {
  try {
    console.log('🤖 Generating AI menu trends with COMPREHENSIVE ALL TIME data...');

    // Prepare COMPREHENSIVE data summary for AI analysis - FIXED with proper NULL handling
    const comprehensiveSummary = menuSalesData.map(item => ({
      name: item.Nama_Menu,
      category: item.Kategori,
      price: item.Harga,
      
      // ALL TIME METRICS with safe fallback values
      allTimeSales: item.all_time_sales || 0,
      allTimeQuantity: item.all_time_quantity || 0,
      allTimeRevenue: item.all_time_revenue || 0,
      allTimeCustomers: item.all_time_customers || 0,
      
      // PERFORMANCE METRICS with safe fallback values
      monthlyAvgSales: item.monthly_avg_sales || 0,
      peakMonth: item.peak_month || 'N/A',
      peakQuantity: item.peak_quantity || 0,
      recentPerformance: item.recent_performance || 0,
      
      // ANALYSIS METRICS with safe fallback values
      growthTrend: item.growth_trend || 'stable_performance',
      priceVsCategoryAvg: item.price_vs_category_avg || 1,
      customerRetention: item.customer_retention || 0,
      seasonalPattern: item.seasonal_pattern || 'consistent_year_round',
      
      // CALCULATED METRICS with safe operations
      revenuePerSale: (item.all_time_revenue || 0) / Math.max(1, item.all_time_sales || 1),
      marketShare: (item.all_time_revenue || 0) / menuSalesData.reduce((sum, i) => sum + (i.all_time_revenue || 0), 0) * 100,
      consistencyScore: (item.recent_performance || 0) / Math.max(1, item.monthly_avg_sales || 1),
      profitabilityIndex: (item.price_vs_category_avg || 1) * ((item.all_time_quantity || 0) / Math.max(1, menuSalesData.reduce((sum, i) => sum + (i.all_time_quantity || 0), 0) / menuSalesData.length))
    }));

    // Create COMPREHENSIVE AI prompt with ALL TIME context
    const prompt = `
Sebagai AI expert dalam analisis restoran dengan akses ke DATA HISTORIS LENGKAP, analisis performa menu KOMPREHENSIF berikut untuk prediksi periode ${period}:

DATASET COMPREHENSIVE (SELURUH RIWAYAT PENJUALAN):
${comprehensiveSummary.map(item => 
  `🍽️ ${item.name} (${item.category}) - Harga: Rp${Number(item.price || 0).toLocaleString()}
  📊 ALL TIME PERFORMANCE:
  - Total Orders: ${item.allTimeSales} | Total Quantity: ${item.allTimeQuantity} | Total Revenue: Rp${Number(item.allTimeRevenue || 0).toLocaleString()}
  - Unique Customers: ${item.allTimeCustomers} | Monthly Average: ${Number(item.monthlyAvgSales || 0).toFixed(1)}
  - Peak Month: ${item.peakMonth} (${item.peakQuantity} quantity)
  - Recent Performance: ${item.recentPerformance} (Consistency: ${Number(item.consistencyScore || 0).toFixed(2)})
  
  🔍 DEEP ANALYSIS:
  - Growth Trend: ${item.growthTrend} | Customer Retention: ${Number(item.customerRetention || 0).toFixed(1)}%
  - Price vs Category Avg: ${Number(item.priceVsCategoryAvg || 1).toFixed(2)}x | Market Share: ${Number(item.marketShare || 0).toFixed(2)}%
  - Seasonal Pattern: ${item.seasonalPattern} | Profitability Index: ${Number(item.profitabilityIndex || 0).toFixed(2)}
  - Revenue per Sale: Rp${Number(item.revenuePerSale || 0).toFixed(0)}`
).join('\n\n')}

COMPREHENSIVE ANALYSIS FRAMEWORK:
Gunakan SELURUH DATA HISTORIS untuk pattern recognition yang akurat:

1. **TREND CLASSIFICATION:**
   - RISING: Consistent growth pattern, high profitability index, atau recent performance > historical average
   - DECLINING: Declining trend, low recent performance, atau seasonal downturn
   - STABLE: Consistent performance, balanced metrics
   - NEW: Rekomendasi menu baru berdasarkan gap analysis dan successful patterns

2. **HISTORICAL INTELLIGENCE:**
   - Analisis peak performance periods untuk timing strategy
   - Customer retention patterns untuk loyalty prediction
   - Seasonal trends untuk cyclical planning
   - Price positioning untuk competitive advantage

3. **COMPREHENSIVE REASONING:**
   Berikan reasoning yang mendalam berdasarkan:
   - Complete sales history dan growth patterns
   - Customer behavior (retention, frequency)
   - Market positioning (price vs category, market share)
   - Seasonal performance patterns
   - Revenue optimization opportunities

4. **STRATEGIC RECOMMENDATIONS:**
   - Tactical: Immediate actions (pricing, promotion, positioning)
   - Strategic: Long-term growth (menu development, customer acquisition)
   - Operational: Execution (timing, targeting, resource allocation)

Format JSON response dengan confidence tinggi berdasarkan data comprehensive:
{
  "trends": [
    {
      "trend": "rising",
      "itemName": "Nama Menu",
      "currentSales": 45,
      "predictedSales": 65,
      "growthRate": 44.4,
      "reasoning": "Comprehensive analysis menunjukkan consistent growth pattern dengan peak performance di [bulan], customer retention [%], market share [%], dan seasonal advantage di [pattern]. Historical data menunjukkan [specific insights].",
      "recommendations": [
        "Strategic action berdasarkan historical peak performance",
        "Tactical recommendation berdasarkan customer retention pattern",
        "Operational optimization berdasarkan seasonal trends"
      ],
      "category": "kategori",
      "seasonality": "Detailed seasonal insight dari historical data",
      "confidence": 92
    }
  ]
}

CRITICAL: Berikan analisis yang 100% data-driven berdasarkan SELURUH RIWAYAT HISTORIS untuk akurasi maksimal.
`;

    try {
      const aiResponse = await callGroqLLM(prompt, 4096, 0.3);
      console.log('🤖 AI Response received for comprehensive menu trends');
      
      // Enhanced parsing with comprehensive error handling
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
        console.log(`✅ Generated ${aiResult.trends.length} AI trend analyses`);
        
        const summary = calculateComprehensiveTrendSummary(aiResult.trends, menuSalesData);
        
        return {
          trends: aiResult.trends,
          summary
        };
      } else {
        throw new Error('Invalid AI response format');
      }

    } catch (aiError) {
      console.error('🔄 AI generation failed, using enhanced fallback:', aiError);
      
      // Enhanced fallback using ALL TIME data
      const fallbackTrends = generateEnhancedComprehensiveFallbackTrends(menuSalesData);
      const summary = calculateComprehensiveTrendSummary(fallbackTrends, menuSalesData);
      
      return {
        trends: fallbackTrends,
        summary
      };
    }

  } catch (error) {
    console.error('❌ Error generating comprehensive menu trends:', error);
    throw error;
  }
}

// Enhanced comprehensive fallback using ALL TIME DATA - FIXED
function generateEnhancedComprehensiveFallbackTrends(menuSalesData: MenuSalesData[]): MenuTrend[] {
  return menuSalesData.map(item => {
    // Comprehensive trend analysis using all available metrics with safe calculations
    let trend: 'rising' | 'declining' | 'stable' = 'stable';
    let confidence = 70;
    
    // Multi-factor trend determination with safe operations
    const consistencyScore = (item.recent_performance || 0) / Math.max(1, item.monthly_avg_sales || 1);
    const profitabilityIndex = (item.price_vs_category_avg || 1) * ((item.all_time_quantity || 0) / Math.max(1, (item.all_time_revenue || 0) / (item.Harga || 1)));
    const retentionFactor = (item.customer_retention || 0) / 100;
    
    // Comprehensive trend logic
    if (item.growth_trend === 'consistently_growing' || 
        (consistencyScore > 1.2 && profitabilityIndex > 1.1) ||
        ((item.customer_retention || 0) > 50 && (item.recent_performance || 0) > (item.monthly_avg_sales || 0))) {
      trend = 'rising';
      confidence = 85;
    } else if (item.growth_trend === 'declining_trend' || 
               (consistencyScore < 0.8 && (item.customer_retention || 0) < 30) ||
               (item.recent_performance || 0) < (item.monthly_avg_sales || 0) * 0.7) {
      trend = 'declining';
      confidence = 80;
    } else {
      confidence = 75;
    }

    // Comprehensive sales prediction with safe calculations
    let predictedSales = item.recent_performance || 0;
    
    if (trend === 'rising') {
      predictedSales = Math.round((item.monthly_avg_sales || 0) * 1.3 * (1 + retentionFactor));
    } else if (trend === 'declining') {
      predictedSales = Math.round((item.monthly_avg_sales || 0) * 0.8);
    } else {
      predictedSales = Math.round((item.monthly_avg_sales || 0) * 1.05);
    }

    // Growth rate calculation with safe division
    const growthRate = (item.monthly_avg_sales || 0) > 0 ? 
      ((predictedSales - (item.monthly_avg_sales || 0)) / (item.monthly_avg_sales || 0) * 100) : 0;

    // Comprehensive reasoning with safe string operations
    let reasoning = '';
    if (trend === 'rising') {
      reasoning = `Comprehensive analysis menunjukkan tren positif dengan total ${item.all_time_quantity || 0} quantity terjual sepanjang masa. Peak performance ${item.peak_quantity || 0} di ${item.peak_month || 'N/A'}. Customer retention ${Number(item.customer_retention || 0).toFixed(1)}%, growth trend: ${item.growth_trend || 'N/A'}. Price positioning ${Number(item.price_vs_category_avg || 1).toFixed(2)}x category average memberikan competitive advantage.`;
    } else if (trend === 'declining') {
      reasoning = `Analisis menunjukkan penurunan dari peak ${item.peak_quantity || 0} di ${item.peak_month || 'N/A'}. Recent performance ${item.recent_performance || 0} vs monthly average ${Number(item.monthly_avg_sales || 0).toFixed(1)}. Customer retention ${Number(item.customer_retention || 0).toFixed(1)}%, growth trend: ${item.growth_trend || 'N/A'}. Seasonal pattern: ${item.seasonal_pattern || 'N/A'}.`;
    } else {
      reasoning = `Menu stabil dengan ${item.all_time_quantity || 0} total quantity dan ${item.all_time_customers || 0} unique customers. Monthly average ${Number(item.monthly_avg_sales || 0).toFixed(1)}, customer retention ${Number(item.customer_retention || 0).toFixed(1)}%. Growth trend: ${item.growth_trend || 'N/A'}, seasonal pattern: ${item.seasonal_pattern || 'N/A'}.`;
    }

    // Comprehensive recommendations with safe operations
    const recommendations = [];
    if (trend === 'rising') {
      recommendations.push(`Leverage peak performance timing (${item.peak_month || 'N/A'}) untuk seasonal campaigns`);
      recommendations.push(`Optimize pricing strategy (current ${Number(item.price_vs_category_avg || 1).toFixed(2)}x category average)`);
      recommendations.push(`Enhance customer retention programs (current ${Number(item.customer_retention || 0).toFixed(1)}%)`);
    } else if (trend === 'declining') {
      recommendations.push(`Reactivation campaign targeting ${item.all_time_customers || 0} historical customers`);
      recommendations.push(`Price review - consider promotional pricing vs current ${Number(item.price_vs_category_avg || 1).toFixed(2)}x category`);
      recommendations.push(`Seasonal repositioning based on ${item.seasonal_pattern || 'N/A'} pattern`);
    } else {
      recommendations.push(`Maintain consistency while exploring growth opportunities`);
      recommendations.push(`Monitor competitive pricing (currently ${Number(item.price_vs_category_avg || 1).toFixed(2)}x category)`);
      recommendations.push(`Leverage ${item.seasonal_pattern || 'N/A'} pattern untuk strategic timing`);
    }

    return {
      trend,
      itemName: item.Nama_Menu,
      currentSales: Math.round(item.monthly_avg_sales || 0),
      predictedSales,
      growthRate: Number(growthRate.toFixed(1)),
      reasoning,
      recommendations,
      category: item.Kategori,
      seasonality: `${item.seasonal_pattern || 'N/A'}, peak performance: ${item.peak_month || 'N/A'}`,
      confidence: Math.round(confidence)
    };
  });
}

// Calculate comprehensive trend summary with enhanced metrics - FIXED
function calculateComprehensiveTrendSummary(trends: MenuTrend[], originalData: MenuSalesData[]): TrendSummary {
  const risingTrends = trends.filter(t => t.trend === 'rising').length;
  const decliningTrends = trends.filter(t => t.trend === 'declining').length;
  const stableTrends = trends.filter(t => t.trend === 'stable').length;
  const newOpportunities = trends.filter(t => t.trend === 'new').length;

  // Enhanced revenue impact calculation using historical data with safe operations
  const estimatedRevenueImpact = trends.reduce((total, trend) => {
    const originalItem = originalData.find(item => item.Nama_Menu === trend.itemName);
    if (originalItem) {
      const salesChange = trend.predictedSales - trend.currentSales;
      const avgRevenuePerSale = (originalItem.all_time_revenue || 0) / Math.max(1, originalItem.all_time_sales || 1);
      return total + (salesChange * avgRevenuePerSale);
    }
    return total + (trend.predictedSales - trend.currentSales) * 25000; // fallback
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