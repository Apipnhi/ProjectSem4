// app/api/generate-predictions/route.ts - Fixed version without window functions
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface SalesData {
  date: string;
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

interface Predictions {
  nextDay?: { sales: number; confidence: number };
  nextMonth?: { sales: number; confidence: number };
  nextYear?: { sales: number; confidence: number };
}

// Fixed: Get sales data without window functions
async function getAllTimeSalesData(): Promise<SalesData[]> {
  try {
    const sql = `
      SELECT 
        DATE(c.Tanggal_Order) as date,
        SUM(c.Harga_Total) as sales,
        COUNT(c.Invoice_Id) as orders,
        AVG(c.Harga_Total) as avgOrder
      FROM Customer c
      WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
      GROUP BY DATE(c.Tanggal_Order)
      ORDER BY DATE(c.Tanggal_Order) ASC
    `;
    
    console.log('📊 Fetching sales data for predictions...');
    const results = await query(sql);
    
    return results.map((row: any) => ({
      date: row.date,
      sales: Number(row.sales) || 0,
      orders: Number(row.orders) || 0,
      avgOrder: Number(row.avgOrder) || 0
    }));
  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    return [];
  }
}

// Fixed: Get menu sales data
async function getMenuSalesData(): Promise<MenuSales[]> {
  try {
    const sql = `
      SELECT 
        m.id_menu,
        m.nama_menu,
        COUNT(*) as total_sales,
        COUNT(DISTINCT c.Invoice_Id) as total_orders,
        SUM(c.Harga_Total) as total_revenue,
        AVG(m.harga_menu) as avg_price
      FROM Customer c
      JOIN MENU m ON c.id_menu = m.id_menu
      WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY m.id_menu, m.nama_menu
      ORDER BY total_revenue DESC
      LIMIT 20
    `;
    
    console.log('🍽️ Fetching menu sales data...');
    const results = await query(sql);
    
    return results.map((row: any) => ({
      id_menu: Number(row.id_menu),
      nama_menu: row.nama_menu || '',
      total_sales: Number(row.total_sales) || 0,
      total_orders: Number(row.total_orders) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      avg_price: Number(row.avg_price) || 0
    }));
  } catch (error) {
    console.error('❌ Error fetching menu sales data:', error);
    return [];
  }
}

// Mathematical predictions without LLM dependency
function generateMathematicalPredictions(salesData: SalesData[]): Predictions {
  try {
    if (salesData.length === 0) {
      return {
        nextDay: { sales: 85000, confidence: 60 },
        nextMonth: { sales: 2500000, confidence: 55 },
        nextYear: { sales: 30000000, confidence: 50 }
      };
    }

    // Calculate basic statistics
    const recentData = salesData.slice(-30); // Last 30 days
    const totalSales = recentData.reduce((sum, day) => sum + day.sales, 0);
    const avgDailySales = totalSales / recentData.length;
    
    // Calculate growth trend (simple linear regression)
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    recentData.forEach((day, index) => {
      const x = index + 1;
      const y = day.sales;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const growthRate = (slope / avgDailySales) * 100;
    
    // Calculate volatility (coefficient of variation)
    const variance = recentData.reduce((sum, day) => {
      return sum + Math.pow(day.sales - avgDailySales, 2);
    }, 0) / n;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / avgDailySales) * 100;
    
    // Confidence calculation based on data consistency
    const baseConfidence = Math.max(60, 95 - volatility);
    
    // Predictions with trend adjustment
    const trendMultiplier = 1 + (growthRate / 100);
    
    const nextDaySales = Math.round(avgDailySales * trendMultiplier);
    const nextMonthSales = Math.round(avgDailySales * 30 * trendMultiplier);
    const nextYearSales = Math.round(avgDailySales * 365 * Math.pow(trendMultiplier, 12));
    
    return {
      nextDay: { 
        sales: nextDaySales, 
        confidence: Math.round(baseConfidence) 
      },
      nextMonth: { 
        sales: nextMonthSales, 
        confidence: Math.round(baseConfidence - 5) 
      },
      nextYear: { 
        sales: nextYearSales, 
        confidence: Math.round(baseConfidence - 15) 
      }
    };
  } catch (error) {
    console.error('❌ Error in mathematical predictions:', error);
    return {
      nextDay: { sales: 85000, confidence: 70 },
      nextMonth: { sales: 2500000, confidence: 65 },
      nextYear: { sales: 30000000, confidence: 60 }
    };
  }
}

// Generate AI predictions using LLM
async function generateAIPredictions(salesData: SalesData[], menuData: MenuSales[]): Promise<any> {
  try {
    const recentSales = salesData.slice(-30);
    const totalSales = recentSales.reduce((sum, day) => sum + day.sales, 0);
    const avgDailySales = totalSales / recentSales.length;
    const topMenus = menuData.slice(0, 10);

    const prompt = `Analyze restaurant sales data and provide comprehensive predictions:

SALES DATA (Last 30 days):
- Average daily sales: ${avgDailySales.toLocaleString()} IDR
- Total recent sales: ${totalSales.toLocaleString()} IDR
- Data points: ${recentSales.length} days

TOP MENU ITEMS:
${topMenus.map(item => `- ${item.nama_menu}: ${item.total_sales} sales, ${item.total_revenue.toLocaleString()} IDR revenue`).join('\n')}

ANALYSIS REQUIRED:
1. Sales predictions for next day, month, and year
2. Top 5 menu item predictions for next month
3. 3 promotional recommendations based on data

Return JSON format:
{
  "predictions": {
    "nextDay": {"sales": number, "confidence": number},
    "nextMonth": {"sales": number, "confidence": number}, 
    "nextYear": {"sales": number, "confidence": number}
  },
  "topItems": [
    {"name": "string", "predictedSales": number, "reason": "string", "confidence": number}
  ],
  "promos": [
    {"type": "string", "description": "string", "reasoning": "string", "estimatedImpact": "string"}
  ]
}`;

    const aiResponse = await callGroqLLM(prompt, 2048, 0.3);
    
    // Clean and parse JSON response
    let cleanedContent = aiResponse.trim();
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd > 0) {
      const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    }
    
    throw new Error('No valid JSON found in AI response');
  } catch (error) {
    console.error('❌ Error generating AI predictions:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, menuSales, promoAnalysis } = body;

    console.log('🚀 Generating predictions for period:', period);

    // Fetch comprehensive data
    const [salesData, menuData] = await Promise.all([
      getAllTimeSalesData(),
      getMenuSalesData()
    ]);

    console.log(`📊 Data fetched: ${salesData.length} sales records, ${menuData.length} menu items`);

    // Generate mathematical predictions as fallback
    const mathPredictions = generateMathematicalPredictions(salesData);

    // Try AI predictions, fall back to mathematical if fails
    let aiPredictions = null;
    try {
      aiPredictions = await generateAIPredictions(salesData, menuData);
    } catch (error) {
      console.log('⚠️ AI predictions failed, using mathematical fallback');
    }

    // Combine results
    const finalPredictions = aiPredictions?.predictions || mathPredictions;
    const topItems = aiPredictions?.topItems || menuData.slice(0, 5).map((item, index) => ({
      name: item.nama_menu,
      predictedSales: Math.round(item.total_sales * 1.2),
      reason: `Based on current performance: ${item.total_sales} sales, ${item.total_revenue.toLocaleString()} IDR revenue`,
      confidence: Math.max(70, 85 - index * 3)
    }));

    const promos = aiPredictions?.promos || [
      {
        type: "Bundle Deal",
        description: "Create combo meals with top-performing items",
        reasoning: "Top menu items show strong sales potential for bundling",
        estimatedImpact: "15-20% increase in average order value"
      },
      {
        type: "Happy Hour",
        description: "Time-based discounts during low-traffic hours",
        reasoning: "Historical data shows potential for off-peak optimization",
        estimatedImpact: "10-15% increase in daily orders"
      },
      {
        type: "Loyalty Program",
        description: "Reward repeat customers with points system",
        reasoning: "Customer retention can increase lifetime value",
        estimatedImpact: "20-25% improvement in customer retention"
      }
    ];

    const response = {
      success: true,
      predictions: finalPredictions,
      topItems: topItems,
      promos: promos,
      analytics: {
        dataPoints: salesData.length,
        menuItemsAnalyzed: menuData.length,
        predictionMethod: aiPredictions ? 'AI + Mathematical' : 'Mathematical',
        confidence: aiPredictions ? 'High' : 'Medium',
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Predictions generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in predictions API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate predictions',
        message: error instanceof Error ? error.message : 'Unknown error',
        predictions: {
          nextDay: { sales: 85000, confidence: 70 },
          nextMonth: { sales: 2500000, confidence: 65 },
          nextYear: { sales: 30000000, confidence: 60 }
        }
      },
      { status: 500 }
    );
  }
}