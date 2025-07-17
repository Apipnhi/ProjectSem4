// app/api/sales-report/route.ts - Fixed version dengan schema database yang benar
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Enhanced interfaces with comprehensive metrics
interface SalesData {
  date?: string;
  month?: string;
  month_name?: string;
  year?: string | number;
  sales: number;
  orders: number;
  avgOrder: number;
  // COMPREHENSIVE ALL TIME METRICS
  cumulative_sales?: number;
  growth_rate?: number;
  market_share?: number;
  customer_acquisition?: number;
  retention_rate?: number;
  seasonal_index?: number;
}

interface TopProduct {
  id_menu: number;
  nama_menu: string;
  total_sales: number;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  growth_rate?: number;
  market_share?: number;
  popularity_index?: number;
}

interface Feedback {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  date: string;
  sentiment_score?: number;
  category?: string;
}

interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendData: Array<{
    month: string;
    avgRating: number;
    count: number;
  }>;
}

interface SalesOverview {
  daily: SalesData[];
  monthly: SalesData[];
  yearly: SalesData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    growthRate: number;
    customerLifetimeValue: number;
    marketPenetration: number;
    seasonalityIndex: number;
    revenuePerCustomer: number;
  };
}

// Get comprehensive daily sales data
async function getComprehensiveDailySales(): Promise<SalesData[]> {
  try {
    const sql = `
      WITH daily_aggregates AS (
        SELECT 
          DATE(c.Tanggal_Order) as date,
          SUM(c.Harga_Total) as total_sales,
          COUNT(c.Invoice_Id) as total_orders,
          AVG(c.Harga_Total) as avg_order
        FROM Customer c
        WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(c.Tanggal_Order)
      )
      SELECT 
        da.date,
        da.total_sales as sales,
        da.total_orders as orders,
        da.avg_order as avgOrder,
        
        -- CUMULATIVE SALES
        SUM(da.total_sales) OVER (ORDER BY da.date) as cumulative_sales,
        
        -- DAILY GROWTH RATE
        CASE 
          WHEN LAG(da.total_sales) OVER (ORDER BY da.date) > 0
          THEN ((da.total_sales - LAG(da.total_sales) OVER (ORDER BY da.date)) / 
                LAG(da.total_sales) OVER (ORDER BY da.date) * 100)
          ELSE 0 
        END as growth_rate,
        
        -- DAILY MARKET SHARE
        da.total_sales * 100.0 / NULLIF((SELECT MAX(total_sales) FROM daily_aggregates), 0) as market_share,
        
        -- SEASONAL INDEX (day vs weekly average)
        da.total_sales / NULLIF((
          SELECT AVG(da2.total_sales) 
          FROM daily_aggregates da2 
          WHERE da2.date BETWEEN DATE_SUB(da.date, INTERVAL 7 DAY) AND da.date
        ), 0) * 100 as seasonal_index
        
      FROM daily_aggregates da
      ORDER BY da.date ASC
    `;
    
    console.log('📊 Executing comprehensive daily sales analysis...');
    const results = await query(sql);
    console.log(`✅ Daily sales results with ALL TIME metrics:`, results.length);
    return results as SalesData[];
  } catch (error) {
    console.error('❌ Error in getComprehensiveDailySales:', error);
    throw error;
  }
}

// Fixed getComprehensiveMonthlySales function
async function getComprehensiveMonthlySales(): Promise<SalesData[]> {
  try {
    const sql = `
      WITH monthly_aggregates AS (
        SELECT 
          DATE_FORMAT(c.Tanggal_Order, '%Y-%m') as month,
          MONTHNAME(c.Tanggal_Order) as month_name,
          SUM(c.Harga_Total) as total_sales,
          COUNT(c.Invoice_Id) as total_orders,
          AVG(c.Harga_Total) as avg_order,
          YEAR(c.Tanggal_Order) as year_ref
        FROM Customer c
        GROUP BY DATE_FORMAT(c.Tanggal_Order, '%Y-%m'), MONTHNAME(c.Tanggal_Order), YEAR(c.Tanggal_Order)
      ),
      monthly_metrics AS (
        SELECT 
          ma.month,
          ma.month_name,
          ma.total_sales as sales,
          ma.total_orders as orders,
          ma.avg_order as avgOrder,
          
          -- CUMULATIVE SALES
          SUM(ma.total_sales) OVER (ORDER BY ma.month) as cumulative_sales,
          
          -- GROWTH RATE
          CASE 
            WHEN LAG(ma.total_sales) OVER (ORDER BY ma.month) > 0
            THEN ((ma.total_sales - LAG(ma.total_sales) OVER (ORDER BY ma.month)) / 
                  LAG(ma.total_sales) OVER (ORDER BY ma.month) * 100)
            ELSE 0 
          END as growth_rate,
          
          -- MARKET SHARE
          ma.total_sales * 100.0 / NULLIF((SELECT MAX(total_sales) FROM monthly_aggregates), 0) as market_share,
          
          -- SEASONAL INDEX (month vs annual average)
          ma.total_sales / NULLIF((
            SELECT SUM(ma2.total_sales) / 12 
            FROM monthly_aggregates ma2 
            WHERE ma2.year_ref = ma.year_ref
          ), 0) * 100 as seasonal_index,
          
          ma.year_ref
        FROM monthly_aggregates ma
      ),
      customer_acquisition AS (
        SELECT 
          first_month,
          COUNT(DISTINCT Invoice_Id) as new_customers
        FROM (
          SELECT 
            c.Invoice_Id, 
            MIN(DATE_FORMAT(c.Tanggal_Order, '%Y-%m')) as first_month
          FROM Customer c
          GROUP BY c.Invoice_Id
        ) first_customers
        GROUP BY first_month
      ),
      retention_data AS (
        SELECT 
          DATE_FORMAT(c.Tanggal_Order, '%Y-%m') as month,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM Customer c2 
              WHERE c2.Invoice_Id = c.Invoice_Id 
                AND DATE_FORMAT(c2.Tanggal_Order, '%Y-%m') < DATE_FORMAT(c.Tanggal_Order, '%Y-%m')
            ) THEN c.Invoice_Id 
          END) * 100.0 / NULLIF(COUNT(DISTINCT c.Invoice_Id), 0) as retention_rate
        FROM Customer c
        GROUP BY DATE_FORMAT(c.Tanggal_Order, '%Y-%m')
      )
      SELECT 
        mm.month,
        mm.month_name,
        mm.sales,
        mm.orders,
        mm.avgOrder,
        mm.cumulative_sales,
        mm.growth_rate,
        mm.market_share,
        COALESCE(ca.new_customers, 0) as customer_acquisition,
        COALESCE(rd.retention_rate, 0) as retention_rate,
        mm.seasonal_index
      FROM monthly_metrics mm
      LEFT JOIN customer_acquisition ca ON mm.month = ca.first_month
      LEFT JOIN retention_data rd ON mm.month = rd.month
      ORDER BY mm.month ASC
    `;
    
    console.log('📅 Executing comprehensive monthly sales analysis...');
    const results = await query(sql);
    console.log(`✅ Monthly sales results with ALL TIME metrics:`, results.length);
    return results as SalesData[];
  } catch (error) {
    console.error('❌ Error in getComprehensiveMonthlySales:', error);
    throw error;
  }
}

// Fixed getComprehensiveYearlySales function
async function getComprehensiveYearlySales(): Promise<SalesData[]> {
  try {
    const sql = `
      WITH yearly_aggregates AS (
        SELECT 
          YEAR(c.Tanggal_Order) as year,
          SUM(c.Harga_Total) as total_sales,
          COUNT(c.Invoice_Id) as total_orders,
          AVG(c.Harga_Total) as avg_order
        FROM Customer c
        GROUP BY YEAR(c.Tanggal_Order)
      ),
      yearly_metrics AS (
        SELECT 
          ya.year,
          ya.total_sales as sales,
          ya.total_orders as orders,
          ya.avg_order as avgOrder,
          
          -- CUMULATIVE SALES
          SUM(ya.total_sales) OVER (ORDER BY ya.year) as cumulative_sales,
          
          -- GROWTH RATE
          CASE 
            WHEN LAG(ya.total_sales) OVER (ORDER BY ya.year) > 0
            THEN ((ya.total_sales - LAG(ya.total_sales) OVER (ORDER BY ya.year)) / 
                  LAG(ya.total_sales) OVER (ORDER BY ya.year) * 100)
            ELSE 0 
          END as growth_rate,
          
          -- MARKET SHARE (normalized performance)
          ya.total_sales * 100.0 / NULLIF((SELECT MAX(total_sales) FROM yearly_aggregates), 0) as market_share,
          
          -- BASELINE SEASONAL INDEX
          100 as seasonal_index
        FROM yearly_aggregates ya
      ),
      customer_acquisition AS (
        SELECT 
          first_year,
          COUNT(DISTINCT Invoice_Id) as new_customers
        FROM (
          SELECT 
            c.Invoice_Id, 
            MIN(YEAR(c.Tanggal_Order)) as first_year
          FROM Customer c
          GROUP BY c.Invoice_Id
        ) first_customers
        GROUP BY first_year
      ),
      retention_data AS (
        SELECT 
          YEAR(c.Tanggal_Order) as year,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM Customer c2 
              WHERE c2.Invoice_Id = c.Invoice_Id 
                AND YEAR(c2.Tanggal_Order) < YEAR(c.Tanggal_Order)
            ) THEN c.Invoice_Id 
          END) * 100.0 / NULLIF(COUNT(DISTINCT c.Invoice_Id), 0) as retention_rate
        FROM Customer c
        GROUP BY YEAR(c.Tanggal_Order)
      )
      SELECT 
        ym.year,
        ym.sales,
        ym.orders,
        ym.avgOrder,
        ym.cumulative_sales,
        ym.growth_rate,
        ym.market_share,
        COALESCE(ca.new_customers, 0) as customer_acquisition,
        COALESCE(rd.retention_rate, 0) as retention_rate,
        ym.seasonal_index
      FROM yearly_metrics ym
      LEFT JOIN customer_acquisition ca ON ym.year = ca.first_year
      LEFT JOIN retention_data rd ON ym.year = rd.year
      ORDER BY ym.year ASC
    `;
    
    console.log('📈 Executing comprehensive yearly sales analysis...');
    const results = await query(sql);
    console.log(`✅ Yearly sales results with ALL TIME metrics:`, results.length);
    return results as SalesData[];
  } catch (error) {
    console.error('❌ Error in getComprehensiveYearlySales:', error);
    throw error;
  }
}

// Get comprehensive top products with ALL TIME analysis
async function getComprehensiveTopProducts(): Promise<TopProduct[]> {
  try {
    const sql = `
      WITH product_aggregates AS (
        SELECT 
          m.Id_Menu as id_menu,
          m.Nama_Menu as nama_menu,
          m.Harga as menu_price,
          COUNT(mm.id_customer) as total_sales,
          COALESCE(SUM(mm.kuantitas), 0) as total_quantity,
          COALESCE(SUM(mm.kuantitas * m.Harga), 0) as total_revenue
        FROM menu m
        LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
        LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
        WHERE m.Status = 1
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga
        HAVING total_quantity > 0
      )
      SELECT 
        pa.id_menu,
        pa.nama_menu,
        pa.total_sales,
        pa.total_quantity,
        pa.total_revenue,
        pa.menu_price as avg_price,
        
        -- GROWTH RATE (simplified as static for products)
        0 as growth_rate,
        
        -- MARKET SHARE
        pa.total_revenue * 100.0 / NULLIF((SELECT SUM(total_revenue) FROM product_aggregates), 0) as market_share,
        
        -- POPULARITY INDEX (normalized sales volume)
        pa.total_quantity * 100.0 / NULLIF((SELECT MAX(total_quantity) FROM product_aggregates), 0) as popularity_index
        
      FROM product_aggregates pa
      ORDER BY pa.total_revenue DESC
      LIMIT 25
    `;
    
    console.log('🍽️ Executing comprehensive top products analysis...');
    const results = await query(sql);
    console.log(`✅ Top products results with ALL TIME metrics:`, results.length);
    return results as TopProduct[];
  } catch (error) {
    console.error('❌ Error in getComprehensiveTopProducts:', error);
    throw error;
  }
}

// Fixed getComprehensiveFeedback function with correct table name
async function getComprehensiveFeedback(): Promise<{
  feedback: Feedback[];
  summary: FeedbackSummary;
}> {
  try {
    // Get feedback data from CUSTOMER_FEEDBACK table (correct table name)
    const feedbackSql = `
      SELECT 
        cf.id_feedback as id,
        CONCAT('Customer ', cf.id_customer) as customer_name,
        cf.rating,
        cf.comment,
        cf.feedback_date as date,
        
        -- SENTIMENT SCORE (simplified based on rating)
        CASE 
          WHEN cf.rating >= 4 THEN 1
          WHEN cf.rating = 3 THEN 0
          ELSE -1
        END as sentiment_score,
        
        -- CATEGORY (based on rating)
        CASE 
          WHEN cf.rating >= 4 THEN 'positive'
          WHEN cf.rating = 3 THEN 'neutral'
          ELSE 'negative'
        END as category
        
      FROM CUSTOMER_FEEDBACK cf
      WHERE cf.status = 'approved'
      ORDER BY cf.feedback_date DESC
      LIMIT 100
    `;
    
    const feedbackResults = await query(feedbackSql);
    
    // Get summary data from CUSTOMER_FEEDBACK table
    const summarySql = `
      SELECT 
        COUNT(*) as totalFeedback,
        AVG(rating) as averageRating,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating1,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating2,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating3,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating4,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating5,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative
      FROM CUSTOMER_FEEDBACK
      WHERE status = 'approved'
    `;
    
    const summaryResults = await query(summarySql);
    const summary = summaryResults[0];
    
    // Get trend data from CUSTOMER_FEEDBACK table
    const trendSql = `
      SELECT 
        DATE_FORMAT(feedback_date, '%Y-%m') as month,
        AVG(rating) as avgRating,
        COUNT(*) as count
      FROM CUSTOMER_FEEDBACK
      WHERE feedback_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND status = 'approved'
      GROUP BY DATE_FORMAT(feedback_date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const trendResults = await query(trendSql);
    
    console.log('💬 Feedback analysis completed successfully');
    
    return {
      feedback: feedbackResults as Feedback[],
      summary: {
        totalFeedback: Number(summary.totalFeedback || 0),
        averageRating: Number(summary.averageRating || 0),
        ratingDistribution: {
          1: Number(summary.rating1 || 0),
          2: Number(summary.rating2 || 0),
          3: Number(summary.rating3 || 0),
          4: Number(summary.rating4 || 0),
          5: Number(summary.rating5 || 0)
        },
        sentimentAnalysis: {
          positive: Number(summary.positive || 0),
          neutral: Number(summary.neutral || 0),
          negative: Number(summary.negative || 0)
        },
        trendData: trendResults as Array<{
          month: string;
          avgRating: number;
          count: number;
        }>
      }
    };
  } catch (error) {
    console.error('❌ Error in getComprehensiveFeedback:', error);
    // Return empty data instead of throwing error to prevent API from failing
    return {
      feedback: [],
      summary: {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
        trendData: []
      }
    };
  }
}

// Enhanced sales summary with ALL TIME metrics
async function getEnhancedSalesSummary() {
  try {
    const sql = `
      WITH current_period AS (
        SELECT 
          SUM(c.Harga_Total) as totalSales,
          COUNT(c.Invoice_Id) as totalOrders,
          AVG(c.Harga_Total) as avgOrderValue,
          COUNT(DISTINCT c.Invoice_Id) as totalCustomers
        FROM Customer c
        WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ),
      previous_period AS (
        SELECT 
          SUM(c.Harga_Total) as totalSales,
          COUNT(c.Invoice_Id) as totalOrders,
          AVG(c.Harga_Total) as avgOrderValue,
          COUNT(DISTINCT c.Invoice_Id) as totalCustomers
        FROM Customer c
        WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
          AND c.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ),
      all_time_stats AS (
        SELECT 
          MAX(monthly_total) as peakMonthlySales,
          AVG(monthly_total) as avgMonthlySales
        FROM (
          SELECT SUM(c.Harga_Total) as monthly_total 
          FROM Customer c 
          GROUP BY YEAR(c.Tanggal_Order), MONTH(c.Tanggal_Order)
        ) monthly_aggregates
      )
      SELECT 
        COALESCE(cp.totalSales, 0) as totalSales,
        COALESCE(cp.totalOrders, 0) as totalOrders,
        COALESCE(cp.avgOrderValue, 0) as avgOrderValue,
        
        -- GROWTH RATES
        CASE 
          WHEN COALESCE(pp.totalSales, 0) > 0 
          THEN ((COALESCE(cp.totalSales, 0) - COALESCE(pp.totalSales, 0)) / pp.totalSales * 100)
          ELSE 0 
        END as growthRate,
        
        -- CUSTOMER LIFETIME VALUE
        COALESCE(cp.totalSales, 0) / NULLIF(COALESCE(cp.totalCustomers, 0), 0) as customerLifetimeValue,
        
        -- MARKET PENETRATION
        COALESCE(cp.totalSales, 0) * 100.0 / NULLIF(COALESCE(ats.peakMonthlySales, 0), 0) as marketPenetration,
        
        -- SEASONALITY INDEX
        COALESCE(cp.totalSales, 0) / NULLIF(COALESCE(ats.avgMonthlySales, 0), 0) * 100 as seasonalityIndex,
        
        -- REVENUE PER CUSTOMER
        COALESCE(cp.totalSales, 0) / NULLIF(COALESCE(cp.totalCustomers, 0), 0) as revenuePerCustomer
        
      FROM current_period cp
      CROSS JOIN previous_period pp
      CROSS JOIN all_time_stats ats
    `;

    console.log('📈 Executing enhanced sales summary...');
    const results = await query(sql);
    return results[0] || {
      totalSales: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      growthRate: 0,
      customerLifetimeValue: 0,
      marketPenetration: 0,
      seasonalityIndex: 0,
      revenuePerCustomer: 0
    };
  } catch (error) {
    console.error('❌ Error in getEnhancedSalesSummary:', error);
    return {
      totalSales: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      growthRate: 0,
      customerLifetimeValue: 0,
      marketPenetration: 0,
      seasonalityIndex: 0,
      revenuePerCustomer: 0
    };
  }
}

// Main GET endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🚀 Starting comprehensive sales report generation with ALL TIME data...');

    // Get ALL TIME comprehensive data in parallel
    const [
      dailySales,
      monthlySales,
      yearlySales,
      topProducts,
      feedbackData,
      salesSummary
    ] = await Promise.all([
      getComprehensiveDailySales(),
      getComprehensiveMonthlySales(),
      getComprehensiveYearlySales(),
      getComprehensiveTopProducts(),
      getComprehensiveFeedback(),
      getEnhancedSalesSummary()
    ]);

    console.log('✅ All comprehensive data retrieved successfully');

    // Build comprehensive response with ALL TIME analytics
    const response: {
      success: boolean;
      data: {
        overview: SalesOverview;
        topProducts: TopProduct[];
        feedback: {
          items: Feedback[];
          summary: FeedbackSummary;
        };
        analytics: {
          totalDataPoints: number;
          dataQuality: string;
          analysisDepth: string;
          timeSpan: string;
        };
      };
    } = {
      success: true,
      data: {
        overview: {
          daily: dailySales,
          monthly: monthlySales,
          yearly: yearlySales,
          summary: salesSummary
        },
        topProducts: topProducts,
        feedback: {
          items: feedbackData.feedback,
          summary: feedbackData.summary
        },
        analytics: {
          totalDataPoints: dailySales.length + monthlySales.length + yearlySales.length + topProducts.length + feedbackData.feedback.length,
          dataQuality: 'comprehensive_all_time',
          analysisDepth: 'enhanced_with_predictive_metrics',
          timeSpan: `${yearlySales.length} years of historical data`
        }
      }
    };

    console.log('🎉 Comprehensive sales report generated successfully with ALL TIME data');
    console.log(`📊 Report includes: ${response.data.analytics.totalDataPoints} total data points`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating comprehensive sales report:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate comprehensive sales report',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          errorType: 'SALES_REPORT_ERROR'
        }
      },
      { status: 500 }
    );
  }
}