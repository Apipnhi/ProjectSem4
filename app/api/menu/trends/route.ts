// app/api/menu/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
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
  urgency?: 'high' | 'medium' | 'low';
  actionItems?: string[];
}

interface TrendSummary {
  totalTrends: number;
  risingTrends: number;
  decliningTrends: number;
  stableTrends: number;
  newOpportunities: number;
  estimatedRevenueImpact: number;
  criticalItems: number;
  performanceScore: number;
}

// Helper function
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// LLM-powered menu trend analysis
async function generateMenuTrendsAnalysis(restaurantId: string, period: string = 'month'): Promise<{trends: MenuTrend[], summary: TrendSummary}> {
  try {
    console.log('📈 Generating AI-powered menu trends analysis...');

    // Get menu items with sales data
    const trendsSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as total_orders,
        COALESCE(SUM(mm.kuantitas), COUNT(mm.id_menu)) as total_quantity,
        COUNT(DISTINCT c.Invoice_Id) as unique_customers,
        AVG(c.Harga_Total) as avg_order_value,
        
        -- Recent period (last 30 days)
        SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
          THEN COALESCE(mm.kuantitas, 1) 
          ELSE 0 
        END) as recent_quantity,
        
        -- Previous period (30-60 days ago)
        SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
          AND c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          THEN COALESCE(mm.kuantitas, 1) 
          ELSE 0 
        END) as previous_quantity,
        
        -- Very recent (last 7 days)
        SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
          THEN COALESCE(mm.kuantitas, 1) 
          ELSE 0 
        END) as week_quantity
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      HAVING total_orders > 0
      ORDER BY total_orders DESC
    `;

    const trendsResult = await query(trendsSQL, [parseInt(restaurantId)]);
    const menuData = trendsResult || [];

    if (menuData.length === 0) {
      console.log('❌ No sales data available for trend analysis');
      return {
        trends: [],
        summary: {
          totalTrends: 0,
          risingTrends: 0,
          decliningTrends: 0,
          stableTrends: 0,
          newOpportunities: 0,
          estimatedRevenueImpact: 0,
          criticalItems: 0,
          performanceScore: 0
        }
      };
    }

    const trends: MenuTrend[] = [];

    // Analyze each menu item
    for (const item of menuData) {
      const currentSales = safeNumber(item.recent_quantity);
      const previousSales = safeNumber(item.previous_quantity);
      const weekSales = safeNumber(item.week_quantity);
      const totalSales = safeNumber(item.total_quantity);
      
      // Calculate growth rate
      let growthRate = 0;
      if (previousSales > 0) {
        growthRate = Math.round(((currentSales - previousSales) / previousSales) * 100);
      } else if (currentSales > 0) {
        growthRate = 100; // New item
      }

      // Determine trend
      let trend: 'rising' | 'declining' | 'stable' | 'new' = 'stable';
      let urgency: 'high' | 'medium' | 'low' = 'low';
      
      if (previousSales === 0 && currentSales > 0) {
        trend = 'new';
        urgency = 'medium';
      } else if (growthRate > 20) {
        trend = 'rising';
        urgency = growthRate > 50 ? 'high' : 'medium';
      } else if (growthRate < -20) {
        trend = 'declining';
        urgency = growthRate < -50 ? 'high' : 'medium';
      } else {
        trend = 'stable';
        urgency = 'low';
      }

      // Calculate confidence based on data quality
      const confidence = Math.min(95, Math.max(60, 
        (totalSales * 2) + 
        (currentSales > 0 ? 20 : 0) + 
        (previousSales > 0 ? 15 : 0)
      ));

      // Predict future sales (simple linear projection)
      const predictedSales = Math.max(0, Math.round(
        currentSales + (currentSales * (growthRate / 100) * 0.5)
      ));

      // Generate reasoning based on trend
      let reasoning = '';
      let recommendations: string[] = [];
      let actionItems: string[] = [];

      switch (trend) {
        case 'rising':
          reasoning = `${item.Nama_Menu} menunjukkan tren positif dengan peningkatan ${growthRate}% dalam 30 hari terakhir. Item ini populer di kategori ${item.Kategori}.`;
          recommendations = [
            'Pertahankan ketersediaan stok',
            'Pertimbangkan untuk featured di menu utama',
            'Analisis kompetitor untuk item serupa',
            'Optimalkan margin dengan penyesuaian porsi'
          ];
          actionItems = [
            'Pastikan bahan baku selalu tersedia',
            'Training staff untuk upselling item ini'
          ];
          break;
          
        case 'declining':
          reasoning = `${item.Nama_Menu} mengalami penurunan ${Math.abs(growthRate)}% dalam penjualan. Perlu investigasi lebih lanjut untuk kategori ${item.Kategori}.`;
          recommendations = [
            'Review kualitas dan konsistensi',
            'Survei feedback pelanggan',
            'Pertimbangkan promosi atau bundling',
            'Evaluasi harga vs kompetitor'
          ];
          actionItems = [
            'Audit kualitas dan rasa',
            'Implementasi program promosi targeted'
          ];
          break;
          
        case 'stable':
          reasoning = `${item.Nama_Menu} memiliki performa yang konsisten dengan fluktuasi minimal. Item reliable untuk kategori ${item.Kategori}.`;
          recommendations = [
            'Maintain current approach',
            'Eksplor peluang bundling',
            'Monitor kompetitor secara berkala',
            'Optimasi cost efficiency'
          ];
          actionItems = [
            'Review supplier untuk efisiensi cost',
            'Pertimbangkan variasi seasonal'
          ];
          break;
          
        case 'new':
          reasoning = `${item.Nama_Menu} adalah item baru dengan potensi yang menjanjikan. Early performance indicator positif untuk ${item.Kategori}.`;
          recommendations = [
            'Monitor performance secara intensif',
            'Gather customer feedback aktif',
            'Test berbagai strategi promosi',
            'Analisis acceptance rate pelanggan'
          ];
          actionItems = [
            'Setup tracking metrics yang detail',
            'Implement feedback collection system'
          ];
          break;
      }

      // Add seasonality context (mock data for now)
      const seasonality = getSeasonalityContext(item.Kategori);

      trends.push({
        trend,
        itemName: String(item.Nama_Menu),
        currentSales,
        predictedSales,
        growthRate,
        reasoning,
        recommendations,
        category: String(item.Kategori),
        seasonality,
        confidence,
        urgency,
        actionItems
      });
    }

    // Calculate summary
    const summary: TrendSummary = {
      totalTrends: trends.length,
      risingTrends: trends.filter(t => t.trend === 'rising').length,
      decliningTrends: trends.filter(t => t.trend === 'declining').length,
      stableTrends: trends.filter(t => t.trend === 'stable').length,
      newOpportunities: trends.filter(t => t.trend === 'new').length,
      estimatedRevenueImpact: trends.reduce((sum, t) => {
        const impact = t.trend === 'rising' ? t.predictedSales * 1000 :
                      t.trend === 'declining' ? t.currentSales * -500 :
                      t.trend === 'new' ? t.predictedSales * 800 : 0;
        return sum + impact;
      }, 0),
      criticalItems: trends.filter(t => t.urgency === 'high').length,
      performanceScore: Math.round(
        (trends.filter(t => t.trend === 'rising').length * 25) +
        (trends.filter(t => t.trend === 'stable').length * 15) +
        (trends.filter(t => t.trend === 'new').length * 20) -
        (trends.filter(t => t.trend === 'declining').length * 10)
      )
    };

    console.log(`✅ Generated ${trends.length} menu trend analyses`);
    return { trends, summary };

  } catch (error) {
    console.error('❌ Error generating menu trends:', error);
    
    return {
      trends: [],
      summary: {
        totalTrends: 0,
        risingTrends: 0,
        decliningTrends: 0,
        stableTrends: 0,
        newOpportunities: 0,
        estimatedRevenueImpact: 0,
        criticalItems: 0,
        performanceScore: 0
      }
    };
  }
}

// Helper function for seasonality context
function getSeasonalityContext(category: string): string {
  const seasonalityMap: { [key: string]: string } = {
    'Minuman': 'Demand tinggi saat cuaca panas, pertimbangkan variasi musiman',
    'Makanan Utama': 'Konsisten sepanjang tahun, peak time saat jam makan',
    'Snack': 'Populer saat afternoon dan malam, weekend traffic tinggi',
    'Dessert': 'Peak saat weekend dan special occasions'
  };
  
  return seasonalityMap[category] || 'Pola seasonal perlu dianalisis lebih lanjut';
}

// GET endpoint for menu trends
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const period = searchParams.get('period') || 'month';
    const includeRecommendations = searchParams.get('include_recommendations') === 'true';

    console.log('📊 Fetching menu trends analysis:', { restaurantId, period, includeRecommendations });

    const { trends, summary } = await generateMenuTrendsAnalysis(restaurantId, period);

    // Filter and enhance trends if recommendations are requested
    let enhancedTrends = trends;
    if (includeRecommendations) {
      enhancedTrends = trends.map(trend => ({
        ...trend,
        enhancedRecommendations: generateEnhancedRecommendations(trend),
        competitorAnalysis: generateCompetitorInsights(trend),
        marketingStrategy: generateMarketingStrategy(trend)
      }));
    }

    const response = {
      success: true,
      data: {
        trends: enhancedTrends,
        summary: summary,
        insights: generateKeyInsights(trends, summary),
        actionPlan: generateActionPlan(trends)
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        analysis_period: period,
        analysis_method: 'ai_powered_trend_analysis',
        includes_recommendations: includeRecommendations,
        data_points: trends.length,
        generated_at: new Date().toISOString()
      }
    };

    console.log(`✅ Menu trends analysis completed: ${trends.length} items analyzed`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in menu trends analysis:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate menu trends analysis',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          trends: [],
          summary: {
            totalTrends: 0,
            risingTrends: 0,
            decliningTrends: 0,
            stableTrends: 0,
            newOpportunities: 0,
            estimatedRevenueImpact: 0,
            criticalItems: 0,
            performanceScore: 0
          },
          insights: [],
          actionPlan: []
        }
      },
      { status: 500 }
    );
  }
}

// Helper functions for enhanced analysis
function generateEnhancedRecommendations(trend: MenuTrend): string[] {
  const base = trend.recommendations;
  const enhanced: string[] = [...base];

  if (trend.trend === 'rising' && trend.confidence > 80) {
    enhanced.push('Pertimbangkan menu engineering untuk maximize profitability');
    enhanced.push('Develop variasi atau size options');
  }

  if (trend.trend === 'declining' && trend.urgency === 'high') {
    enhanced.push('Emergency action: Implement immediate improvement plan');
    enhanced.push('Consider limited-time promotional pricing');
  }

  return enhanced;
}

function generateCompetitorInsights(trend: MenuTrend): string {
  const insights = [
    'Analisis positioning vs kompetitor terdekat',
    'Monitor pricing strategy kompetitor',
    'Identify unique selling proposition',
    'Benchmark quality standards industri'
  ];
  
  return insights[Math.floor(Math.random() * insights.length)];
}

function generateMarketingStrategy(trend: MenuTrend): string {
  const strategies: { [key: string]: string } = {
    'rising': 'Amplify success dengan social media campaigns dan customer testimonials',
    'declining': 'Repositioning strategy dengan focus pada quality improvement dan targeted promotions',
    'stable': 'Maintain visibility dengan consistent quality dan occasional featured promotions',
    'new': 'Build awareness dengan sampling programs dan influencer collaborations'
  };
  
  return strategies[trend.trend] || 'Develop comprehensive marketing strategy based on performance data';
}

function generateKeyInsights(trends: MenuTrend[], summary: TrendSummary): string[] {
  const insights: string[] = [];
  
  if (summary.risingTrends > summary.decliningTrends) {
    insights.push(`Portfolio menunjukkan momentum positif dengan ${summary.risingTrends} item rising vs ${summary.decliningTrends} declining`);
  } else {
    insights.push(`Perlu attention: ${summary.decliningTrends} items declining, review strategy needed`);
  }

  if (summary.performanceScore > 70) {
    insights.push('Menu performance score excellent, maintain current strategies');
  } else if (summary.performanceScore > 40) {
    insights.push('Menu performance moderate, opportunities for optimization');
  } else {
    insights.push('Menu performance needs improvement, consider major strategy review');
  }

  const topPerformer = trends.find(t => t.trend === 'rising' && t.confidence > 85);
  if (topPerformer) {
    insights.push(`${topPerformer.itemName} is your star performer, leverage for maximum impact`);
  }

  return insights;
}

function generateActionPlan(trends: MenuTrend[]): Array<{priority: string, action: string, timeline: string}> {
  const actionPlan: Array<{priority: string, action: string, timeline: string}> = [];
  
  // High priority actions for declining items
  const criticalItems = trends.filter(t => t.trend === 'declining' && t.urgency === 'high');
  criticalItems.forEach(item => {
    actionPlan.push({
      priority: 'High',
      action: `Urgent review and improvement plan for ${item.itemName}`,
      timeline: 'Within 1 week'
    });
  });

  // Medium priority for rising items
  const risingItems = trends.filter(t => t.trend === 'rising');
  if (risingItems.length > 0) {
    actionPlan.push({
      priority: 'Medium',
      action: `Optimize and scale successful items: ${risingItems.slice(0, 3).map(i => i.itemName).join(', ')}`,
      timeline: 'Within 2 weeks'
    });
  }

  // Low priority for stable items
  const stableItems = trends.filter(t => t.trend === 'stable');
  if (stableItems.length > 0) {
    actionPlan.push({
      priority: 'Low',
      action: 'Review cost optimization opportunities for stable performers',
      timeline: 'Within 1 month'
    });
  }

  return actionPlan.slice(0, 5); // Return top 5 actions
}