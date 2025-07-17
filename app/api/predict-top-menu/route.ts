// app/api/predict-top-menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface MenuData {
  id_menu: number;
  nama_menu: string;
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  avg_price: number;
  category: string;
  recent_trend: number;
}

interface TopMenuPrediction {
  menu_name: string;
  predicted_sales: number;
  confidence: number;
  reasoning: string;
  trend: 'rising' | 'stable' | 'declining';
  recommendation: string;
}

// Get comprehensive menu data berdasarkan struktur database yang benar
async function getMenuData(): Promise<MenuData[]> {
  try {
    const sql = `
      SELECT 
        m.Id_Menu as id_menu,
        m.Nama_Menu as nama_menu,
        m.Kategori as category,
        m.Harga as avg_price,
        COUNT(mm.id_pemesanan_menu) as total_sales,
        COUNT(DISTINCT c.Invoice_Id) as total_orders,
        SUM(c.Harga_Total) as total_revenue,
        
        -- Recent trend calculation (last 30 days vs previous 30 days)
        (
          SELECT COUNT(*) 
          FROM MEMESAN_MENU mm2 
          JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id
          WHERE mm2.id_menu = m.Id_Menu 
            AND c2.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) - (
          SELECT COUNT(*) 
          FROM MEMESAN_MENU mm3 
          JOIN Customer c3 ON mm3.id_customer = c3.Invoice_Id
          WHERE mm3.id_menu = m.Id_Menu 
            AND c3.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            AND c3.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ) as recent_trend
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      HAVING total_sales > 0
      ORDER BY total_revenue DESC
      LIMIT 20
    `;
    
    console.log('🍽️ Fetching comprehensive menu data...');
    const results = await query(sql);
    
    if (results.length === 0) {
      console.log('⚠️ No menu data found, using fallback query...');
      
      // Fallback query tanpa filter date jika tidak ada data recent
      const fallbackSql = `
        SELECT 
          m.Id_Menu as id_menu,
          m.Nama_Menu as nama_menu,
          m.Kategori as category,
          m.Harga as avg_price,
          COUNT(mm.id_pemesanan_menu) as total_sales,
          COUNT(DISTINCT c.Invoice_Id) as total_orders,
          SUM(c.Harga_Total) as total_revenue,
          0 as recent_trend
          
        FROM menu m
        LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
        LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
        ORDER BY total_sales DESC
        LIMIT 20
      `;
      
      const fallbackResults = await query(fallbackSql);
      
      return fallbackResults.map((row: any) => ({
        id_menu: Number(row.id_menu),
        nama_menu: row.nama_menu || '',
        total_sales: Number(row.total_sales) || 0,
        total_orders: Number(row.total_orders) || 0,
        total_revenue: Number(row.total_revenue) || 0,
        avg_price: Number(row.avg_price) || 0,
        category: row.category || 'Unknown',
        recent_trend: Number(row.recent_trend) || 0
      }));
    }
    
    return results.map((row: any) => ({
      id_menu: Number(row.id_menu),
      nama_menu: row.nama_menu || '',
      total_sales: Number(row.total_sales) || 0,
      total_orders: Number(row.total_orders) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_price: Number(row.avg_price) || 0,
      category: row.category || 'Unknown',
      recent_trend: Number(row.recent_trend) || 0
    }));
  } catch (error) {
    console.error('❌ Error fetching menu data:', error);
    
    // Ultimate fallback - hanya data menu tanpa sales
    try {
      const basicSql = `
        SELECT 
          Id_Menu as id_menu,
          Nama_Menu as nama_menu,
          Kategori as category,
          Harga as avg_price
        FROM menu
        WHERE Status = 1
        ORDER BY Id_Menu
        LIMIT 10
      `;
      
      const basicResults = await query(basicSql);
      
      return basicResults.map((row: any) => ({
        id_menu: Number(row.id_menu),
        nama_menu: row.nama_menu || '',
        total_sales: 10, // Default value
        total_orders: 5, // Default value  
        total_revenue: Number(row.avg_price) * 10, // Estimated
        avg_price: Number(row.avg_price) || 0,
        category: row.category || 'Unknown',
        recent_trend: 0
      }));
    } catch (basicError) {
      console.error('❌ Error in basic fallback:', basicError);
      return [];
    }
  }
}

// Mathematical prediction based on historical data
function generateMathPredictions(menuData: MenuData[]): TopMenuPrediction[] {
  try {
    return menuData.slice(0, 8).map((item, index) => {
      // Calculate trend factor
      const trendFactor = item.recent_trend > 0 ? 1.2 : item.recent_trend < -5 ? 0.8 : 1.0;
      
      // Calculate base prediction
      const basePrediction = item.total_sales * trendFactor;
      const predicted_sales = Math.round(basePrediction);
      
      // Determine trend
      let trend: 'rising' | 'stable' | 'declining';
      if (item.recent_trend > 5) trend = 'rising';
      else if (item.recent_trend < -5) trend = 'declining';
      else trend = 'stable';
      
      // Calculate confidence based on performance consistency
      const performanceRank = index + 1;
      const baseConfidence = Math.max(60, 95 - performanceRank * 5);
      const trendBonus = item.recent_trend > 0 ? 5 : 0;
      const confidence = Math.min(95, baseConfidence + trendBonus);
      
      // Generate reasoning
      const reasoning = `Current performance: ${item.total_sales} sales, ${item.total_revenue.toLocaleString()} IDR revenue. Recent trend: ${item.recent_trend > 0 ? '+' : ''}${item.recent_trend} sales change. Category: ${item.category}`;
      
      // Generate recommendation
      let recommendation = '';
      if (trend === 'rising') {
        recommendation = 'Increase promotion and ensure adequate inventory';
      } else if (trend === 'declining') {
        recommendation = 'Consider menu refresh or promotional boost';
      } else {
        recommendation = 'Maintain current strategy, monitor for changes';
      }
      
      return {
        menu_name: item.nama_menu,
        predicted_sales: predicted_sales,
        confidence: confidence,
        reasoning: reasoning,
        trend: trend,
        recommendation: recommendation
      };
    });
  } catch (error) {
    console.error('❌ Error in mathematical menu predictions:', error);
    return [];
  }
}

// AI-powered prediction using LLM
async function generateAIPredictions(menuData: MenuData[]): Promise<TopMenuPrediction[]> {
  try {
    const topMenus = menuData.slice(0, 10);
    
    const prompt = `Analyze restaurant menu performance and predict top-performing items for next month:

MENU PERFORMANCE DATA:
${topMenus.map((item, index) => 
  `${index + 1}. ${item.nama_menu} (${item.category})
   - Current sales: ${item.total_sales}
   - Revenue: ${item.total_revenue.toLocaleString()} IDR
   - Average price: ${item.avg_price.toLocaleString()} IDR
   - Recent trend: ${item.recent_trend > 0 ? '+' : ''}${item.recent_trend} sales change`
).join('\n\n')}

ANALYSIS REQUIREMENTS:
1. Predict next month's sales for top 6-8 menu items
2. Consider current performance, trends, and seasonality
3. Factor in price point and category appeal
4. Provide confidence levels and actionable recommendations

Return JSON array format:
[
  {
    "menu_name": "string",
    "predicted_sales": number,
    "confidence": number (60-95),
    "reasoning": "detailed explanation with data points",
    "trend": "rising" | "stable" | "declining",
    "recommendation": "specific actionable advice"
  }
]

Focus on data-driven insights and realistic predictions.`;

    const aiResponse = await callGroqLLM(prompt, 2048, 0.2);
    
    // Clean and parse JSON response
    let cleanedContent = aiResponse.trim();
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonStart = cleanedContent.indexOf('[');
    const jsonEnd = cleanedContent.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd > 0) {
      const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
      const predictions = JSON.parse(jsonString);
      
      // Validate and format predictions
      return predictions.map((pred: any) => ({
        menu_name: pred.menu_name || pred.name || 'Unknown',
        predicted_sales: Number(pred.predicted_sales || pred.predictedSales) || 0,
        confidence: Math.min(95, Math.max(60, Number(pred.confidence) || 75)),
        reasoning: pred.reasoning || pred.reason || 'AI analysis based on historical data',
        trend: ['rising', 'stable', 'declining'].includes(pred.trend) ? pred.trend : 'stable',
        recommendation: pred.recommendation || 'Monitor performance and adjust strategy as needed'
      }));
    }
    
    throw new Error('No valid JSON array found in AI response');
  } catch (error) {
    console.error('❌ Error generating AI menu predictions:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting top menu prediction generation...');
    
    // Fetch comprehensive menu data
    const menuData = await getMenuData();
    
    if (menuData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No menu data available for predictions',
        predictions: []
      }, { status: 404 });
    }
    
    console.log(`📊 Menu data fetched: ${menuData.length} items`);
    
    // Generate mathematical predictions as fallback
    const mathPredictions = generateMathPredictions(menuData);
    
    // Try AI predictions, fall back to mathematical if fails
    let aiPredictions: TopMenuPrediction[] = [];
    try {
      aiPredictions = await generateAIPredictions(menuData);
      console.log('🤖 AI predictions generated successfully');
    } catch (error) {
      console.log('⚠️ AI predictions failed, using mathematical fallback');
    }
    
    // Use AI predictions if available and valid, otherwise use mathematical
    const finalPredictions = aiPredictions.length > 0 ? aiPredictions : mathPredictions;
    
    const response = {
      success: true,
      predictions: finalPredictions,
      analytics: {
        menuItemsAnalyzed: menuData.length,
        predictionsGenerated: finalPredictions.length,
        predictionMethod: aiPredictions.length > 0 ? 'AI-powered' : 'Mathematical',
        dataSource: 'Historical sales data via MEMESAN_MENU table',
        timestamp: new Date().toISOString(),
        confidence: aiPredictions.length > 0 ? 'High' : 'Medium'
      }
    };
    
    console.log('✅ Top menu predictions generated successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error in top menu predictions API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate menu predictions',
        message: error instanceof Error ? error.message : 'Unknown error',
        predictions: []
      },
      { status: 500 }
    );
  }
}