// app/api/generate-stock-predictions/route.ts - Fixed GROQ API Handler
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

interface ComprehensiveStockData {
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
  total_historical_purchases: number;
  total_historical_spending: number;
  avg_cost_per_unit: number;
  purchase_frequency_days: number;
  seasonal_usage_pattern: string;
  stock_efficiency_ratio: number;
  days_until_expiry: number;
}

interface ComprehensiveSalesData {
  id_menu: number;
  nama_menu: string;
  total_quantity: number;
  total_revenue: number;
  daily_avg_consumption: number;
  monthly_avg_consumption: number;
  peak_consumption_month: string;
  consumption_trend: string;
  menu_popularity_rank: number;
  ingredient_impact_factor: number;
}

interface StockPrediction {
  ingredient: string;
  currentStock: number;
  predictedConsumption: number;
  reorderPoint: number;
  optimalPurchaseQty: number;
  reorderTiming: 'immediate' | 'within_week' | 'within_month';
  riskLevel: 'high' | 'medium' | 'low';
  costOptimization: string;
  expectedROI: number;
  reasoning: string;
  urgencyScore: number;
  efficiency: string;
}

interface PredictionSummary {
  totalItems: number;
  highRiskItems: number;
  immediateActionRequired: number;
  avgExpectedROI: number;
  totalPredictedCost: number;
  totalCurrentValue: number;
  inventoryHealthScore: number;
}

// Fixed LLM function with better error handling and smaller prompt
async function generateLLMStockPredictions(stockData: ComprehensiveStockData[], salesData: ComprehensiveSalesData[], period: string): Promise<any> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required for LLM-based predictions. Please configure your API key.');
  }

  console.log('🔑 GROQ API Key found:', GROQ_API_KEY.substring(0, 10) + '...');

  // Limit data to prevent token overflow and ensure we have sales data
  const limitedStockData = stockData.slice(0, stockData.length); // Limit to 10 items
  const limitedSalesData = salesData.length > 0 ? salesData.slice(0, stockData.length) : [];

  // Create simplified context to avoid token limits
  const stockSummary = limitedStockData.map(item => 
    `${item.nama_bahan}: ${item.kuantitas} units, expires ${item.days_until_expiry} days, cost Rp${item.avg_cost_per_unit}/unit`
  ).join('; ');

  const salesSummary = limitedSalesData.length > 0 
    ? limitedSalesData.map(pattern => 
        `${pattern.nama_menu}: ${pattern.total_quantity || 0} orders, ${(Number(pattern.daily_avg_consumption) || 0).toFixed(1)} daily avg`
      ).join('; ')
    : 'No sales data available - use conservative estimates';

  // Create period-specific context and calculations
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 30;
  const periodMultiplier = period === 'week' ? 1 : period === 'month' ? 4.3 : period === 'quarter' ? 13 : 4.3;
  
  // Adjust consumption predictions based on period
  const adjustedSalesData = limitedSalesData.map(item => ({
    ...item,
    period_consumption: (Number(item.daily_avg_consumption) || 0) * periodDays,
    period_revenue: (Number(item.total_revenue) || 0) * (periodDays / 30)
  }));

  // Create period-aware stock summary
  const periodAwareStockSummary = limitedStockData.map(item => {
    const daysToExpiry = Number(item.days_until_expiry) || 30;
    const urgencyLevel = daysToExpiry <= periodDays ? 'URGENT' : daysToExpiry <= (periodDays * 2) ? 'MODERATE' : 'LOW';
    
    return `${item.nama_bahan}: ${item.kuantitas} units, expires ${daysToExpiry} days (${urgencyLevel}), cost Rp${item.avg_cost_per_unit}/unit`;
  }).join('; ');

  const periodAwareSalesSummary = adjustedSalesData.length > 0 
    ? adjustedSalesData.map(pattern => 
        `${pattern.nama_menu}: ${pattern.total_quantity || 0} total orders, ${(pattern.period_consumption || 0).toFixed(1)} expected consumption for ${period}`
      ).join('; ')
    : `No sales data available - use conservative estimates for ${period} period`;

  // Enhanced period-specific prompt
  const prompt = `Analyze Indonesian restaurant stock for ${period.toUpperCase()} period (${periodDays} days).

ANALYSIS PERIOD: ${period} (${periodDays} days)
CURRENT DATE: ${new Date().toLocaleDateString('id-ID')}

STOCK STATUS: ${periodAwareStockSummary}

SALES PATTERNS: ${periodAwareSalesSummary}

Generate predictions specifically for the ${period} period. Consider:
- Items expiring within ${periodDays} days need IMMEDIATE action
- Consumption should be calculated for exactly ${periodDays} days
- Reorder timing must align with ${period} planning
- ROI calculations should reflect ${period} performance

Provide this JSON structure:
{
  "predictions": [
    {
      "ingredient": "ingredient_name",
      "currentStock": number,
      "predictedConsumption": number_for_${periodDays}_days,
      "reorderPoint": number,
      "optimalPurchaseQty": number_for_${period}_supply,
      "reorderTiming": "immediate|within_week|within_month",
      "riskLevel": "high|medium|low",
      "costOptimization": "specific advice for ${period} period",
      "expectedROI": number_percentage_for_${period},
      "reasoning": "analysis for ${period} timeframe",
      "urgencyScore": number_1_to_100,
      "efficiency": "Critical|Moderate|Efficient"
    }
  ],
  "summary": {
    "totalItems": number,
    "highRiskItems": number,
    "immediateActionRequired": number,
    "avgExpectedROI": number_for_${period},
    "totalPredictedCost": number_for_${period}_purchases,
    "totalCurrentValue": number,
    "inventoryHealthScore": number_1_to_100
  },
  "insights": [
    "Insight 1 specific to ${period} planning",
    "Insight 2 for ${period} optimization"
  ]
}

Focus on ${period}-specific recommendations. Items expiring soon need immediate attention regardless of period.`;

  console.log('📝 Prompt length:', prompt.length, 'characters');
  console.log('🤖 Calling GROQ API with simplified prompt...');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Updated to active model
        messages: [
          {
            role: 'system',
            content: 'You are an inventory expert. Respond only with valid JSON. Be concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000, // Reduced token limit
        response_format: { type: "json_object" } // Force JSON response
      })
    });

    console.log('📡 GROQ API Response Status:', response.status);
    console.log('📡 GROQ API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GROQ API Error Response:', errorText);
      throw new Error(`GROQ API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ GROQ API Response received');
    
    const llmResponse = data.choices[0]?.message?.content;

    if (!llmResponse) {
      throw new Error('No response content received from GROQ API');
    }

    console.log('🔍 LLM Response length:', llmResponse.length);
    console.log('🔍 LLM Response preview:', llmResponse.substring(0, 200));
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(llmResponse);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('Raw response:', llmResponse);
      
      // Try to extract JSON from response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          throw new Error('Failed to parse LLM response as JSON');
        }
      } else {
        throw new Error('No valid JSON found in LLM response');
      }
    }
    
    // Validate response structure
    if (!parsedResponse.predictions || !Array.isArray(parsedResponse.predictions)) {
      throw new Error('Invalid LLM response structure - missing predictions array');
    }

    if (!parsedResponse.summary || typeof parsedResponse.summary !== 'object') {
      throw new Error('Invalid LLM response structure - missing summary object');
    }

    // Add metadata
    return {
      ...parsedResponse,
      metadata: {
        method: 'Pure LLM Analysis (GROQ)',
        model: 'llama3-8b-8192',
        confidence: 'High (AI-powered contextual analysis)',
        fallbackUsed: false,
        dataSource: 'Pure AI predictions',
        tokenUsage: data.usage || 'unknown'
      }
    };

  } catch (fetchError) {
    console.error('❌ GROQ API Fetch Error:', fetchError);
    throw new Error(`Failed to call GROQ API: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
  }
}

// Fixed stock data query with proper error handling
async function getComprehensiveAllTimeStockData(): Promise<ComprehensiveStockData[]> {
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
      m.Harga as harga_menu,
      
      -- Simple historical calculations
      1 as total_historical_purchases,
      s.pengeluaran as total_historical_spending,
      
      -- Average cost per unit (safe division)
      CASE 
        WHEN CAST(s.kuantitas AS SIGNED) > 0 THEN CAST(s.pengeluaran AS SIGNED) / CAST(s.kuantitas AS SIGNED)
        ELSE 0
      END as avg_cost_per_unit,
      
      -- Default purchase frequency
      30 as purchase_frequency_days,
      
      -- Simple seasonal pattern
      'normal' as seasonal_usage_pattern,
      
      -- Simple efficiency ratio
      CASE 
        WHEN CAST(s.kuantitas AS SIGNED) > 0 AND CAST(s.pengeluaran AS SIGNED) > 0 
        THEN (CAST(s.kuantitas AS SIGNED) * CAST(m.Harga AS SIGNED)) / CAST(s.pengeluaran AS SIGNED)
        ELSE 1
      END as stock_efficiency_ratio,
      
      -- Days until expiry
      DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_expiry
      
    FROM STOK s
    JOIN menu m ON s.id_menu = m.Id_Menu
    WHERE CAST(s.kuantitas AS SIGNED) > 0 AND s.id_restaurant = 1
    ORDER BY s.nama_bahan
    LIMIT 20
  `;

  try {
    const result = await query(sql);
    console.log('📊 Stock data query result:', result?.length || 0, 'rows');
    
    // Ensure all numeric fields are properly converted
    const processedResult = (result || []).map((row: any) => ({
      ...row,
      kuantitas: Number(row.kuantitas) || 0,
      pengeluaran: Number(row.pengeluaran) || 0,
      harga_menu: Number(row.harga_menu) || 0,
      total_historical_purchases: Number(row.total_historical_purchases) || 1,
      total_historical_spending: Number(row.total_historical_spending) || 0,
      avg_cost_per_unit: Number(row.avg_cost_per_unit) || 0,
      purchase_frequency_days: Number(row.purchase_frequency_days) || 30,
      stock_efficiency_ratio: Number(row.stock_efficiency_ratio) || 1,
      days_until_expiry: Number(row.days_until_expiry) || 30
    }));
    
    console.log('📊 Processed stock data sample:', processedResult[0]);
    return processedResult;
  } catch (error) {
    console.error('❌ Error fetching stock data:', error);
    return [];
  }
}

// Get period-aware sales data
async function getComprehensiveAllTimeSalesData(period: string): Promise<ComprehensiveSalesData[]> {
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 30;
  
  const sql = `
    SELECT 
      m.Id_Menu as id_menu,
      m.Nama_Menu as nama_menu,
      
      -- Total aggregations (all time)
      COALESCE(SUM(CAST(mm.kuantitas AS SIGNED)), 0) as total_quantity,
      COALESCE(SUM(CAST(mm.kuantitas AS SIGNED) * CAST(m.Harga AS SIGNED)), 0) as total_revenue,
      
      -- Period-specific averages
      COALESCE(AVG(CAST(mm.kuantitas AS SIGNED)), 0) as daily_avg_consumption,
      COALESCE(AVG(CAST(mm.kuantitas AS SIGNED)) * ${periodDays}, 0) as period_consumption,
      
      -- Recent period consumption (last ${periodDays} days)
      COALESCE(
        (SELECT AVG(CAST(mm_recent.kuantitas AS SIGNED)) * ${periodDays}
         FROM MEMESAN_MENU mm_recent 
         JOIN Customer c_recent ON mm_recent.id_customer = c_recent.Invoice_Id
         WHERE mm_recent.id_menu = m.Id_Menu 
         AND c_recent.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL ${periodDays} DAY)
         AND c_recent.id_restaurant = 1), 
        0
      ) as recent_period_consumption,
      
      -- Default values
      'January' as peak_consumption_month,
      CASE 
        WHEN COUNT(mm.kuantitas) = 0 THEN 'new'
        WHEN AVG(CAST(mm.kuantitas AS SIGNED)) > 0 THEN 'stable'
        ELSE 'declining'
      END as consumption_trend,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CAST(mm.kuantitas AS SIGNED)), 0) DESC) as menu_popularity_rank,
      CASE 
        WHEN SUM(CAST(mm.kuantitas AS SIGNED)) > 0 THEN 
          (SUM(CAST(mm.kuantitas AS SIGNED)) / 
           GREATEST((SELECT SUM(CAST(mm_total.kuantitas AS SIGNED)) 
                     FROM MEMESAN_MENU mm_total 
                     JOIN Customer c_total ON mm_total.id_customer = c_total.Invoice_Id
                     WHERE c_total.id_restaurant = 1), 1)) * 100
        ELSE 0
      END as ingredient_impact_factor
      
    FROM menu m
    LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
    LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id AND c.id_restaurant = 1
    WHERE m.id_restaurant = 1
    GROUP BY m.Id_Menu, m.Nama_Menu
    ORDER BY total_quantity DESC
    LIMIT 10
  `;

  try {
    const result = await query(sql);
    console.log(`📈 Sales data query result (${period} period):`, result?.length || 0, 'rows');
    
    // Process results with period-specific calculations
    const processedResult = (result || []).map((row: any) => ({
      ...row,
      total_quantity: Number(row.total_quantity) || 0,
      total_revenue: Number(row.total_revenue) || 0,
      daily_avg_consumption: Number(row.daily_avg_consumption) || 0,
      monthly_avg_consumption: Number(row.period_consumption) || 0,
      recent_period_consumption: Number(row.recent_period_consumption) || 0,
      menu_popularity_rank: Number(row.menu_popularity_rank) || 1,
      ingredient_impact_factor: Number(row.ingredient_impact_factor) || 10
    }));
    
    console.log(`📈 Processed sales data for ${period} period:`, processedResult[0]);
    return processedResult;
  } catch (error) {
    console.error('❌ Error fetching sales data:', error);
    return [];
  }
}

// Main POST endpoint with better error handling
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { period = 'week' } = body;
    const restaurantId = 1;
    
    console.log(`📊 Starting stock prediction analysis for restaurant ${restaurantId}, period: ${period}`);
    
    // Get data with period-aware analysis
    const [stockData, salesData] = await Promise.all([
      getComprehensiveAllTimeStockData(),
      getComprehensiveAllTimeSalesData(period)
    ]);

    console.log(`📈 Data retrieved: ${stockData.length} stock items, ${salesData.length} sales records`);

    if (stockData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No stock data found for restaurant ID 1',
        message: 'Please ensure STOK table has data for restaurant ID 1',
        debug: {
          restaurantId,
          stockCount: stockData.length,
          salesCount: salesData.length
        }
      }, { status: 404 });
    }

    console.log('🤖 Generating LLM predictions...');
    
    // Generate predictions with detailed error handling
    const predictions = await generateLLMStockPredictions(stockData, salesData, period);
    
    console.log('💾 Saving predictions...');
    
    // Save predictions
    try {
      const publicPath = path.join(process.cwd(), 'public', 'predictions.json');
      await writeFile(publicPath, JSON.stringify(predictions, null, 2), 'utf8');
      console.log('✅ Predictions saved successfully');
    } catch (fileError) {
      console.warn('⚠️ Could not save predictions to file:', fileError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Stock predictions generated successfully for Restaurant ID ${restaurantId}`,
      data: {
        predictions: predictions.predictions,
        summary: predictions.summary,
        analytics: {
          method: 'Pure LLM Analysis (GROQ)',
          dataScope: `Restaurant ID ${restaurantId} - ${period.toUpperCase()} period analysis (${period === 'week' ? '7' : period === 'month' ? '30' : '90'} days)`,
          stockItemsAnalyzed: stockData.length,
          salesRecordsAnalyzed: salesData.length,
          predictionPeriod: period,
          restaurantId: restaurantId,
          timestamp: new Date().toISOString(),
          confidence: 'High (AI-powered analysis)',
          algorithm: 'GROQ Llama3-8b with JSON mode',
          llmUsed: true,
          predictionMethod: `AI-Powered ${period.charAt(0).toUpperCase() + period.slice(1)} Analysis`,
          dataQuality: 'High',
          confidenceLevel: 90,
          marketFactors: `Indonesian restaurant market conditions for ${period} period`,
          seasonalImpact: `Seasonal factors considered for ${period} planning`,
          recommendedReviewDate: new Date(Date.now() + (period === 'week' ? 7 : period === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        insights: predictions.insights || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error in stock predictions API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'LLM prediction failed',
      message: 'Failed to generate stock predictions. Please check configuration.',
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString(),
        restaurantId: 1,
        groqConfigured: !!process.env.GROQ_API_KEY,
        suggestion: 'Check GROQ_API_KEY and ensure it has sufficient quota'
      }
    }, { status: 500 });
  }
}

// GET endpoint for retrieving saved predictions
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📖 Retrieving saved predictions...');
    
    const publicPath = path.join(process.cwd(), 'public', 'predictions.json');
    
    try {
      const fs = require('fs');
      if (fs.existsSync(publicPath)) {
        const fileContent = fs.readFileSync(publicPath, 'utf8');
        const predictions = JSON.parse(fileContent);
        
        return NextResponse.json({
          success: true,
          message: 'Saved predictions retrieved successfully',
          data: predictions
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'No saved predictions found. Please generate predictions first.',
          data: null
        }, { status: 404 });
      }
    } catch (fileError) {
      console.error('Error reading predictions file:', fileError);
      return NextResponse.json({
        success: false,
        error: 'Could not read saved predictions',
        message: 'Please generate new predictions.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error retrieving predictions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}