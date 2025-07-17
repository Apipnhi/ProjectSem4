// app/api/generate-stock-predictions/route.ts - Robust Fallback WITHOUT LLM dependency
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
}

// Fixed: Proper GROUP BY for stock data
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
      COALESCE(m.Nama_Menu, 'Unknown Menu') as nama_menu,
      COALESCE(m.Harga, 0) as harga_menu,
      
      -- COMPREHENSIVE ALL TIME STOCK ANALYSIS
      (SELECT COUNT(*) 
       FROM STOK s2 
       WHERE s2.nama_bahan = s.nama_bahan 
         AND s2.id_restaurant = s.id_restaurant) as total_historical_purchases,
      
      (SELECT COALESCE(SUM(s3.pengeluaran), 0) 
       FROM STOK s3 
       WHERE s3.nama_bahan = s.nama_bahan 
         AND s3.id_restaurant = s.id_restaurant) as total_historical_spending,
      
      -- Cost analysis
      CASE 
        WHEN s.kuantitas > 0 THEN s.pengeluaran / s.kuantitas
        ELSE 0 
      END as avg_cost_per_unit,
      
      -- Time-based analysis
      DATEDIFF(CURDATE(), s.tanggal_pembelian) as days_since_purchase,
      DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_expiry,
      
      -- Stock efficiency calculation
      CASE 
        WHEN DATEDIFF(s.tanggal_exp, s.tanggal_pembelian) > 0 
        THEN (DATEDIFF(CURDATE(), s.tanggal_pembelian) * 100.0) / DATEDIFF(s.tanggal_exp, s.tanggal_pembelian)
        ELSE 0 
      END as stock_efficiency_ratio,
      
      -- Seasonal pattern
      CASE 
        WHEN MONTH(s.tanggal_pembelian) IN (12, 1, 2) THEN 'winter_purchase'
        WHEN MONTH(s.tanggal_pembelian) IN (3, 4, 5) THEN 'spring_purchase'
        WHEN MONTH(s.tanggal_pembelian) IN (6, 7, 8) THEN 'summer_purchase'
        ELSE 'fall_purchase'
      END as seasonal_usage_pattern
      
    FROM STOK s
    LEFT JOIN menu m ON s.id_menu = m.Id_Menu
    WHERE s.id_restaurant = 1
      AND s.kuantitas > 0
    ORDER BY 
      CASE 
        WHEN DATEDIFF(s.tanggal_exp, CURDATE()) < 7 THEN 1
        WHEN DATEDIFF(s.tanggal_exp, CURDATE()) < 30 THEN 2
        ELSE 3
      END ASC,
      s.kuantitas DESC
    LIMIT 50
  `;
  
  try {
    console.log('📦 Executing comprehensive stock data query...');
    const results = await query(sql);
    console.log(`✅ Stock query results: ${results.length} records`);
    
    return results.map((row: any) => ({
      id_stok: parseInt(row.id_stok),
      nama_bahan: row.nama_bahan || '',
      kuantitas: parseInt(row.kuantitas || 0),
      tanggal_pembelian: row.tanggal_pembelian,
      tanggal_exp: row.tanggal_exp,
      id_menu: parseInt(row.id_menu || 0),
      id_restaurant: parseInt(row.id_restaurant || 1),
      pengeluaran: parseFloat(row.pengeluaran || 0),
      nama_menu: row.nama_menu || '',
      harga_menu: parseFloat(row.harga_menu || 0),
      total_historical_purchases: parseInt(row.total_historical_purchases || 0),
      total_historical_spending: parseFloat(row.total_historical_spending || 0),
      avg_cost_per_unit: parseFloat(row.avg_cost_per_unit || 0),
      purchase_frequency_days: parseInt(row.days_since_purchase || 0),
      seasonal_usage_pattern: row.seasonal_usage_pattern || 'unknown',
      stock_efficiency_ratio: parseFloat(row.stock_efficiency_ratio || 0),
      days_until_expiry: parseInt(row.days_until_expiry || 0)
    })) as ComprehensiveStockData[];
    
  } catch (error) {
    console.error('❌ Error in getComprehensiveAllTimeStockData:', error);
    throw error;
  }
}

// Fixed: Proper GROUP BY for sales data
async function getComprehensiveAllTimeSalesData(): Promise<ComprehensiveSalesData[]> {
  const sql = `
    SELECT 
      mm.id_menu,
      m.Nama_Menu as nama_menu,
      SUM(mm.kuantitas) as total_quantity,
      SUM(c.Harga_Total) as total_revenue,
      
      -- Simplified aggregations to avoid GROUP BY issues
      ROUND(SUM(mm.kuantitas) / NULLIF(COUNT(DISTINCT DATE(c.Tanggal_Order)), 0), 2) as daily_avg_consumption,
      
      ROUND(SUM(mm.kuantitas) / NULLIF(COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m')), 0), 2) as monthly_avg_consumption,
      
      -- Peak month (simplified)
      DATE_FORMAT(MAX(c.Tanggal_Order), '%Y-%m') as peak_consumption_month,
      
      -- Simple trend based on recent vs older data
      CASE 
        WHEN SUM(CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END) >
             SUM(CASE WHEN c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END) * 1.1
        THEN 'increasing_demand'
        WHEN SUM(CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END) <
             SUM(CASE WHEN c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN mm.kuantitas ELSE 0 END) * 0.9
        THEN 'decreasing_demand'
        ELSE 'stable_demand'
      END as consumption_trend,
      
      -- Simple impact factor
      ROUND(SUM(mm.kuantitas) * 100.0 / (
        SELECT SUM(mm_total.kuantitas) 
        FROM MEMESAN_MENU mm_total 
        JOIN Customer c_total ON mm_total.id_customer = c_total.Invoice_Id
      ), 2) as ingredient_impact_factor
      
    FROM Customer c
    JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
    JOIN menu m ON mm.id_menu = m.Id_Menu
    WHERE m.id_restaurant = 1
    GROUP BY mm.id_menu, m.Nama_Menu
    HAVING total_quantity > 0
    ORDER BY total_quantity DESC
    LIMIT 20
  `;
  
  try {
    console.log('📊 Executing fixed comprehensive sales data query...');
    const results = await query(sql);
    console.log(`✅ Fixed sales query results: ${results.length} records`);
    
    // Add popularity ranking after query
    return results.map((row: any, index: number) => ({
      id_menu: parseInt(row.id_menu),
      nama_menu: row.nama_menu || '',
      total_quantity: parseInt(row.total_quantity || 0),
      total_revenue: parseFloat(row.total_revenue || 0),
      daily_avg_consumption: parseFloat(row.daily_avg_consumption || 0),
      monthly_avg_consumption: parseFloat(row.monthly_avg_consumption || 0),
      peak_consumption_month: row.peak_consumption_month || '',
      consumption_trend: row.consumption_trend || 'stable',
      menu_popularity_rank: index + 1,
      ingredient_impact_factor: parseFloat(row.ingredient_impact_factor || 0)
    })) as ComprehensiveSalesData[];
    
  } catch (error) {
    console.error('❌ Error in getComprehensiveAllTimeSalesData:', error);
    throw error;
  }
}

// Generate comprehensive stock predictions using MATHEMATICAL ALGORITHMS (NO LLM)
function generateMathematicalStockPredictions(
  stockData: ComprehensiveStockData[], 
  salesData: ComprehensiveSalesData[], 
  period: string
): { predictions: StockPrediction[], summary: PredictionSummary } {
  
  console.log('🧮 Generating MATHEMATICAL stock predictions (NO LLM dependency)...');
  
  const predictions = stockData.map((item, index) => {
    // Find related sales data
    const relatedSales = salesData.find(s => s.id_menu === item.id_menu);
    
    // Calculate time factors
    const daysUntilExpiry = item.days_until_expiry;
    const isExpiringSoon = daysUntilExpiry < 7;
    const isExpiringMedium = daysUntilExpiry < 30;
    
    // Calculate consumption patterns
    const dailyConsumption = relatedSales?.daily_avg_consumption || 1;
    const monthlyConsumption = relatedSales?.monthly_avg_consumption || dailyConsumption * 30;
    
    // Calculate period consumption
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 14;
    const basePredictedConsumption = dailyConsumption * periodDays;
    
    // Apply trend multiplier
    let trendMultiplier = 1.0;
    if (relatedSales?.consumption_trend === 'increasing_demand') {
      trendMultiplier = 1.15; // 15% increase
    } else if (relatedSales?.consumption_trend === 'decreasing_demand') {
      trendMultiplier = 0.85; // 15% decrease
    }
    
    // Apply seasonal multiplier
    let seasonalMultiplier = 1.0;
    const currentMonth = new Date().getMonth() + 1;
    if (item.seasonal_usage_pattern === 'summer_purchase' && [6,7,8].includes(currentMonth)) {
      seasonalMultiplier = 1.2;
    } else if (item.seasonal_usage_pattern === 'winter_purchase' && [12,1,2].includes(currentMonth)) {
      seasonalMultiplier = 1.3;
    }
    
    // Final predicted consumption
    const predictedConsumption = Math.round(basePredictedConsumption * trendMultiplier * seasonalMultiplier);
    
    // Risk assessment
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    let reorderTiming: 'immediate' | 'within_week' | 'within_month' = 'within_month';
    let urgencyScore = 0;
    
    if (isExpiringSoon || item.kuantitas < predictedConsumption * 0.3) {
      riskLevel = 'high';
      reorderTiming = 'immediate';
      urgencyScore = 3;
    } else if (isExpiringMedium || item.kuantitas < predictedConsumption * 0.6) {
      riskLevel = 'medium';
      reorderTiming = 'within_week';
      urgencyScore = 2;
    } else {
      urgencyScore = 1;
    }
    
    // Calculate reorder point (safety stock)
    const safetyDays = 5; // 5 days safety stock
    const reorderPoint = Math.round(dailyConsumption * safetyDays);
    
    // Calculate optimal purchase quantity
    const stockoutRisk = Math.max(0, predictedConsumption - item.kuantitas);
    const safetyStock = Math.round(predictedConsumption * 0.25); // 25% safety stock
    const optimalPurchaseQty = stockoutRisk + safetyStock;
    
    // ROI calculation
    const purchaseCost = optimalPurchaseQty * item.avg_cost_per_unit;
    const potentialRevenue = optimalPurchaseQty * (item.harga_menu * 0.3); // Assume 30% margin
    const expectedROI = purchaseCost > 0 ? Math.round((potentialRevenue - purchaseCost) / purchaseCost * 100) : 15;
    
    // Cost optimization strategy
    const efficiency = item.stock_efficiency_ratio > 80 ? 'excellent' : 
                     item.stock_efficiency_ratio > 60 ? 'good' : 
                     item.stock_efficiency_ratio > 40 ? 'average' : 'poor';
    
    const costOptimization = `Efficiency: ${efficiency} (${item.stock_efficiency_ratio.toFixed(1)}%). ` +
      `Historical avg cost: Rp${item.avg_cost_per_unit.toLocaleString()}. ` +
      `Trend: ${relatedSales?.consumption_trend || 'stable'}.`;
    
    // Detailed reasoning
    const reasoning = `Mathematical analysis: Current stock ${item.kuantitas} units, ` +
      `predicted consumption ${predictedConsumption} units over ${period}. ` +
      `Daily usage: ${dailyConsumption.toFixed(1)} units. ` +
      `Expires in ${daysUntilExpiry} days. ` +
      `Historical purchases: ${item.total_historical_purchases} times. ` +
      `Menu popularity rank: ${relatedSales?.menu_popularity_rank || 'N/A'}.`;
    
    return {
      ingredient: item.nama_bahan,
      currentStock: item.kuantitas,
      predictedConsumption,
      reorderPoint,
      optimalPurchaseQty,
      reorderTiming,
      riskLevel,
      costOptimization,
      expectedROI,
      reasoning,
      urgencyScore,
      efficiency
    };
  });
  
  // Calculate summary
  const summary = {
    totalItems: predictions.length,
    highRiskItems: predictions.filter(p => p.riskLevel === 'high').length,
    immediateActionRequired: predictions.filter(p => p.reorderTiming === 'immediate').length,
    avgExpectedROI: Math.round(predictions.reduce((sum, p) => sum + p.expectedROI, 0) / predictions.length),
    totalPredictedCost: Math.round(predictions.reduce((sum, p) => sum + (p.optimalPurchaseQty * (stockData.find(s => s.nama_bahan === p.ingredient)?.avg_cost_per_unit || 0)), 0)),
    totalCurrentValue: Math.round(stockData.reduce((sum, s) => sum + (s.kuantitas * s.avg_cost_per_unit), 0))
  };
  
  console.log(`✅ Generated ${predictions.length} mathematical predictions with ${summary.highRiskItems} high-risk items`);
  
  return { predictions, summary };
}

// Main POST endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { period = 'week', restaurantId = 1 } = body;
    
    console.log(`📊 Fetching COMPREHENSIVE stock and sales data for restaurant ${restaurantId}...`);
    
    // Get COMPREHENSIVE data from database (ALL TIME)
    const [stockData, salesData] = await Promise.all([
      getComprehensiveAllTimeStockData(),
      getComprehensiveAllTimeSalesData()
    ]);

    console.log(`📈 Found ${stockData.length} stock items and ${salesData.length} sales records`);

    if (stockData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No stock data found',
        message: 'Please ensure STOK table has data for analysis'
      }, { status: 404 });
    }

    console.log('🧮 Generating MATHEMATICAL predictions (NO LLM dependency)...');
    
    // Generate MATHEMATICAL predictions (NO LLM)
    const predictions = generateMathematicalStockPredictions(stockData, salesData, period);
    
    console.log('💾 Saving predictions to file...');
    
    try {
      // Save predictions to public directory
      const publicPath = path.join(process.cwd(), 'public', 'predictions.json');
      await writeFile(publicPath, JSON.stringify(predictions, null, 2), 'utf8');
      console.log('✅ Predictions saved to file successfully');
    } catch (fileError) {
      console.warn('⚠️ Could not save predictions to file:', fileError);
    }
    
    console.log('✅ MATHEMATICAL stock predictions generated successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Mathematical stock predictions generated successfully using ALL TIME data',
      data: {
        predictions: predictions.predictions,
        summary: predictions.summary,
        analytics: {
          method: 'Mathematical Algorithm (NO LLM)',
          dataScope: 'ALL TIME comprehensive analysis',
          stockItemsAnalyzed: stockData.length,
          salesRecordsAnalyzed: salesData.length,
          predictionPeriod: period,
          restaurantId: restaurantId,
          timestamp: new Date().toISOString(),
          confidence: 'High (based on historical data patterns)',
          algorithm: 'Trend analysis + Seasonal patterns + Safety stock calculations'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in stock predictions API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Failed to generate stock predictions. Please check database connectivity.',
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// GET endpoint - Retrieve saved predictions
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📖 Retrieving saved stock predictions...');
    
    const publicPath = path.join(process.cwd(), 'public', 'predictions.json');
    
    try {
      const fs = require('fs');
      if (fs.existsSync(publicPath)) {
        const fileContent = fs.readFileSync(publicPath, 'utf8');
        const predictions = JSON.parse(fileContent);
        const fileStats = fs.statSync(publicPath);
        
        return NextResponse.json({
          success: true,
          message: 'Saved predictions retrieved successfully',
          data: {
            ...predictions,
            metadata: {
              lastUpdated: fileStats.mtime,
              fileSize: fileStats.size,
              retrievedAt: new Date().toISOString()
            }
          }
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