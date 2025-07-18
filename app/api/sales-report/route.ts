// app/api/sales-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface SalesData {
  date?: string;
  month?: string;
  month_name?: string;
  year?: string | number;
  sales: number;
  orders: number;
  avgOrder: number;
  cumulative_sales?: number;
  growth_rate?: number;
  market_share?: number;
  customer_acquisition?: number;
  retention_rate?: number;
  seasonal_index?: number;
  [key: string]: string | number | undefined;
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
    customerLifetimeValue?: number;
    marketPenetration?: number;
    seasonalityIndex?: number;
    revenuePerCustomer?: number;
  };
}

interface TopProduct {
  id_menu: number;
  nama_menu: string;
  total_sales: number;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  category: string;
  id_restaurant?: number;
  restaurant_name?: string;
  growth_rate?: number;
  market_share?: number;
  popularity_index?: number;
}

interface Feedback {
  id_feedback: number;
  rating: number;
  comment: string;
  feedback_date: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  id_restaurant?: number;
  sentiment_score?: number;
  category?: string;
}

interface FeedbackSummary {
  total_feedback: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  recent_feedback: number;
  pending_feedback: number;
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend_data?: Array<{
    month: string;
    avg_rating: number;
    count: number;
  }>;
}

// Helper function
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const period = searchParams.get('period') || 'daily';
    const includeTopProducts = searchParams.get('include_top_products') === 'true';
    const includeFeedback = searchParams.get('include_feedback') === 'true';

    console.log('📊 Fetching sales report:', { restaurantId, period, includeTopProducts, includeFeedback });

    // Daily sales data (last 30 days)
    const dailySalesSQL = `
      SELECT 
        DATE(Tanggal_Order) as date,
        COALESCE(SUM(Harga_Total), 0) as sales,
        COUNT(*) as orders,
        COALESCE(AVG(Harga_Total), 0) as avgOrder
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(Tanggal_Order)
      ORDER BY date ASC
    `;

    const dailySalesResult = await query(dailySalesSQL, [parseInt(restaurantId)]);
    
    const dailySales: SalesData[] = (dailySalesResult || []).map((row: any, index: number) => {
      const sales = safeNumber(row.sales);
      const orders = safeNumber(row.orders);
      
      return {
        date: String(row.date),
        sales: sales,
        orders: orders,
        avgOrder: safeNumber(row.avgOrder),
        cumulative_sales: sales + (index > 0 ? safeNumber(dailySalesResult[index - 1]?.cumulative_sales) || 0 : 0),
        growth_rate: index > 0 ? 
          Math.round(((sales - safeNumber(dailySalesResult[index - 1]?.sales)) / safeNumber(dailySalesResult[index - 1]?.sales)) * 100) : 0,
        customer_acquisition: Math.floor(orders * (0.8 + Math.random() * 0.4)), // Mock data
        retention_rate: Math.floor(70 + Math.random() * 25) // Mock data
      };
    });

    // Monthly sales data (last 12 months)
    const monthlySalesSQL = `
      SELECT 
        YEAR(Tanggal_Order) as year,
        MONTH(Tanggal_Order) as month,
        COALESCE(SUM(Harga_Total), 0) as sales,
        COUNT(*) as orders,
        COALESCE(AVG(Harga_Total), 0) as avgOrder
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(Tanggal_Order), MONTH(Tanggal_Order)
      ORDER BY year ASC, month ASC
    `;

    const monthlySalesResult = await query(monthlySalesSQL, [parseInt(restaurantId)]);
    
    const monthlySales: SalesData[] = (monthlySalesResult || []).map((row: any, index: number) => {
      const sales = safeNumber(row.sales);
      const orders = safeNumber(row.orders);
      const monthIndex = safeNumber(row.month) - 1;
      
      return {
        month: `${row.year}-${String(row.month).padStart(2, '0')}`,
        month_name: monthNames[monthIndex] || 'Unknown',
        year: row.year,
        sales: sales,
        orders: orders,
        avgOrder: safeNumber(row.avgOrder),
        growth_rate: index > 0 ? 
          Math.round(((sales - safeNumber(monthlySalesResult[index - 1]?.sales)) / safeNumber(monthlySalesResult[index - 1]?.sales)) * 100) : 0,
        seasonal_index: Math.floor(85 + Math.random() * 30), // Mock seasonal data
        market_share: Math.floor(15 + Math.random() * 20) // Mock market share
      };
    });

    // Yearly sales data
    const yearlySalesSQL = `
      SELECT 
        YEAR(Tanggal_Order) as year,
        COALESCE(SUM(Harga_Total), 0) as sales,
        COUNT(*) as orders,
        COALESCE(AVG(Harga_Total), 0) as avgOrder
      FROM Customer 
      WHERE id_restaurant = ? 
      GROUP BY YEAR(Tanggal_Order)
      ORDER BY year ASC
    `;

    const yearlySalesResult = await query(yearlySalesSQL, [parseInt(restaurantId)]);
    
    const yearlySales: SalesData[] = (yearlySalesResult || []).map((row: any, index: number) => {
      const sales = safeNumber(row.sales);
      const orders = safeNumber(row.orders);
      
      return {
        year: row.year,
        sales: sales,
        orders: orders,
        avgOrder: safeNumber(row.avgOrder),
        growth_rate: index > 0 ? 
          Math.round(((sales - safeNumber(yearlySalesResult[index - 1]?.sales)) / safeNumber(yearlySalesResult[index - 1]?.sales)) * 100) : 0
      };
    });

    // Calculate summary
    const totalSales = dailySales.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = dailySales.reduce((sum, day) => sum + day.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Calculate growth rate from last period
    const recentSales = dailySales.slice(-7).reduce((sum, day) => sum + day.sales, 0);
    const previousSales = dailySales.slice(-14, -7).reduce((sum, day) => sum + day.sales, 0);
    const growthRate = previousSales > 0 ? Math.round(((recentSales - previousSales) / previousSales) * 100) : 0;

    const salesOverview: SalesOverview = {
      daily: dailySales,
      monthly: monthlySales,
      yearly: yearlySales,
      summary: {
        totalSales: totalSales,
        totalOrders: totalOrders,
        avgOrderValue: avgOrderValue,
        growthRate: growthRate,
        customerLifetimeValue: Math.floor(avgOrderValue * (3 + Math.random() * 5)), // Mock CLV
        marketPenetration: Math.floor(10 + Math.random() * 20), // Mock penetration
        seasonalityIndex: Math.floor(90 + Math.random() * 20), // Mock seasonality
        revenuePerCustomer: avgOrderValue
      }
    };

    let topProducts: TopProduct[] = [];
    if (includeTopProducts) {
      const topProductsSQL = `
        SELECT 
          m.Id_Menu as id_menu,
          m.Nama_Menu as nama_menu,
          COUNT(mm.id_menu) as total_sales,
          COALESCE(SUM(mm.kuantitas), COUNT(mm.id_menu)) as total_quantity,
          COALESCE(SUM(mm.kuantitas * m.Harga), COUNT(mm.id_menu) * m.Harga) as total_revenue,
          m.Harga as avg_price,
          m.Kategori as category,
          m.id_restaurant,
          'Restaurant' as restaurant_name
        FROM MEMESAN_MENU mm
        JOIN menu m ON mm.id_menu = m.Id_Menu
        JOIN Customer c ON mm.id_customer = c.Invoice_Id
        WHERE c.id_restaurant = ?
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga, m.Kategori, m.id_restaurant
        ORDER BY total_sales DESC
        LIMIT 10
      `;

      const topProductsResult = await query(topProductsSQL, [parseInt(restaurantId)]);
      
      topProducts = (topProductsResult || []).map((row: any, index: number) => ({
        id_menu: safeNumber(row.id_menu),
        nama_menu: String(row.nama_menu || 'Unknown Menu'),
        total_sales: safeNumber(row.total_sales),
        total_quantity: safeNumber(row.total_quantity),
        total_revenue: safeNumber(row.total_revenue),
        avg_price: safeNumber(row.avg_price),
        category: String(row.category || 'Unknown'),
        id_restaurant: safeNumber(row.id_restaurant),
        restaurant_name: String(row.restaurant_name || 'Restaurant'),
        growth_rate: Math.floor(-20 + Math.random() * 60), // Mock growth rate
        market_share: Math.floor(5 + Math.random() * 25), // Mock market share
        popularity_index: Math.floor(100 - (index * 8)) // Decreasing popularity
      }));
    }

    let feedbackData: Feedback[] = [];
    let feedbackSummary: FeedbackSummary | null = null;
    
    if (includeFeedback) {
      const feedbackSQL = `
        SELECT 
          cf.id_feedback,
          cf.rating,
          cf.comment,
          cf.feedback_date,
          CONCAT('Customer #', cf.id_customer) as customer_name,
          'Restaurant' as restaurant_name,
          cf.status,
          cf.id_restaurant
        FROM CUSTOMER_FEEDBACK cf
        WHERE cf.id_restaurant = ?
        ORDER BY cf.feedback_date DESC
        LIMIT 50
      `;

      const feedbackResult = await query(feedbackSQL, [parseInt(restaurantId)]);
      
      feedbackData = (feedbackResult || []).map((row: any) => ({
        id_feedback: safeNumber(row.id_feedback),
        rating: safeNumber(row.rating),
        comment: String(row.comment || ''),
        feedback_date: String(row.feedback_date),
        customer_name: String(row.customer_name || 'Unknown Customer'),
        restaurant_name: String(row.restaurant_name || 'Restaurant'),
        status: String(row.status || 'active'),
        id_restaurant: safeNumber(row.id_restaurant),
        sentiment_score: Math.random() * 2 - 1, // Mock sentiment score between -1 and 1
        category: Math.random() > 0.5 ? 'food' : Math.random() > 0.5 ? 'service' : 'ambiance'
      }));

      // Calculate feedback summary
      const totalFeedback = feedbackData.length;
      const avgRating = totalFeedback > 0 ? 
        feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback : 0;

      const ratingCounts = {
        five_star: feedbackData.filter(f => f.rating === 5).length,
        four_star: feedbackData.filter(f => f.rating === 4).length,
        three_star: feedbackData.filter(f => f.rating === 3).length,
        two_star: feedbackData.filter(f => f.rating === 2).length,
        one_star: feedbackData.filter(f => f.rating === 1).length
      };

      // Mock sentiment analysis
      const positive = feedbackData.filter(f => (f.sentiment_score || 0) > 0.2).length;
      const negative = feedbackData.filter(f => (f.sentiment_score || 0) < -0.2).length;
      const neutral = totalFeedback - positive - negative;

      feedbackSummary = {
        total_feedback: totalFeedback,
        avg_rating: Math.round(avgRating * 10) / 10,
        ...ratingCounts,
        recent_feedback: feedbackData.filter(f => {
          const feedbackDate = new Date(f.feedback_date);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return feedbackDate >= sevenDaysAgo;
        }).length,
        pending_feedback: feedbackData.filter(f => f.status === 'pending').length,
        sentiment_analysis: {
          positive: positive,
          neutral: neutral,
          negative: negative
        }
      };
    }

    const response = {
      success: true,
      data: {
        salesOverview: salesOverview,
        topProducts: topProducts,
        feedback: feedbackData,
        feedbackSummary: feedbackSummary
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        period: period,
        includes: {
          top_products: includeTopProducts,
          feedback: includeFeedback
        },
        data_points: {
          daily_sales: dailySales.length,
          monthly_sales: monthlySales.length,
          yearly_sales: yearlySales.length,
          top_products: topProducts.length,
          feedback_items: feedbackData.length
        },
        generated_at: new Date().toISOString()
      }
    };

    console.log('✅ Sales report generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error generating sales report:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate sales report',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          salesOverview: {
            daily: [],
            monthly: [],
            yearly: [],
            summary: {
              totalSales: 0,
              totalOrders: 0,
              avgOrderValue: 0,
              growthRate: 0
            }
          },
          topProducts: [],
          feedback: [],
          feedbackSummary: null
        }
      },
      { status: 500 }
    );
  }
}