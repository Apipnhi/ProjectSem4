// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  salesGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  avgOrderGrowth: number;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  quantity: number;
  revenue: number;
}

interface RecentOrder {
  id: number;
  date: string;
  total: number;
  status: string;
}

interface StockAlert {
  id: number;
  name: string;
  quantity: number;
  status: string;
  daysUntilExpiry: number;
}

// Helper function to safely convert to number
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';

    console.log('📊 Fetching dashboard data for restaurant:', restaurantId);

    // Get current period stats
    const currentStatsSQL = `
      SELECT 
        COUNT(DISTINCT Invoice_Id) as total_orders,
        COALESCE(SUM(Harga_Total), 0) as total_sales,
        COUNT(DISTINCT Invoice_Id) as total_customers,
        COALESCE(AVG(Harga_Total), 0) as avg_order_value
      FROM Customer 
      WHERE id_restaurant = ?
    `;

    const currentStats = await query(currentStatsSQL, [parseInt(restaurantId)]);
    const stats = currentStats[0] || {};

    // Get previous period for growth calculation
    const previousStatsSQL = `
      SELECT 
        COUNT(DISTINCT Invoice_Id) as prev_orders,
        COALESCE(SUM(Harga_Total), 0) as prev_sales,
        COUNT(DISTINCT Invoice_Id) as prev_customers,
        COALESCE(AVG(Harga_Total), 0) as prev_avg_order
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;

    const previousStats = await query(previousStatsSQL, [parseInt(restaurantId)]);
    const prevStats = previousStats[0] || {};

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const dashboardStats: DashboardStats = {
      totalSales: safeNumber(stats.total_sales),
      totalOrders: safeNumber(stats.total_orders),
      totalCustomers: safeNumber(stats.total_customers),
      avgOrderValue: safeNumber(stats.avg_order_value),
      salesGrowth: calculateGrowth(safeNumber(stats.total_sales), safeNumber(prevStats.prev_sales)),
      ordersGrowth: calculateGrowth(safeNumber(stats.total_orders), safeNumber(prevStats.prev_orders)),
      customersGrowth: calculateGrowth(safeNumber(stats.total_customers), safeNumber(prevStats.prev_customers)),
      avgOrderGrowth: calculateGrowth(safeNumber(stats.avg_order_value), safeNumber(prevStats.prev_avg_order))
    };

    // Get daily sales data for charts (last 30 days)
    const salesDataSQL = `
      SELECT 
        DATE(Tanggal_Order) as date,
        COALESCE(SUM(Harga_Total), 0) as sales,
        COUNT(*) as orders
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(Tanggal_Order)
      ORDER BY date ASC
    `;

    const salesDataResult = await query(salesDataSQL, [parseInt(restaurantId)]);
    
    const salesData: SalesData[] = (salesDataResult || []).map((row: any) => ({
      date: String(row.date),
      sales: safeNumber(row.sales),
      orders: safeNumber(row.orders)
    }));

    // Get top products
    const topProductsSQL = `
      SELECT 
        m.Nama_Menu as name,
        COUNT(mm.id_menu) as sales,
        COALESCE(SUM(mm.kuantitas), COUNT(mm.id_menu)) as quantity,
        COALESCE(SUM(mm.kuantitas * m.Harga), COUNT(mm.id_menu) * m.Harga) as revenue
      FROM MEMESAN_MENU mm
      JOIN menu m ON mm.id_menu = m.Id_Menu
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE c.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga
      ORDER BY sales DESC
      LIMIT 5
    `;

    const topProductsResult = await query(topProductsSQL, [parseInt(restaurantId)]);
    
    const topProducts: TopProduct[] = (topProductsResult || []).map((row: any) => ({
      name: String(row.name || 'Unknown'),
      sales: safeNumber(row.sales),
      quantity: safeNumber(row.quantity),
      revenue: safeNumber(row.revenue)
    }));

    // Get recent orders
    const recentOrdersSQL = `
      SELECT 
        Invoice_Id as id,
        Tanggal_Order as date,
        Harga_Total as total,
        'completed' as status
      FROM Customer 
      WHERE id_restaurant = ?
      ORDER BY Tanggal_Order DESC
      LIMIT 10
    `;

    const recentOrdersResult = await query(recentOrdersSQL, [parseInt(restaurantId)]);
    
    const recentOrders: RecentOrder[] = (recentOrdersResult || []).map((row: any) => ({
      id: safeNumber(row.id),
      date: String(row.date),
      total: safeNumber(row.total),
      status: String(row.status)
    }));

    // Get stock alerts
    const stockAlertsSQL = `
      SELECT 
        s.id_stok as id,
        s.nama_bahan as name,
        s.kuantitas as quantity,
        CASE 
          WHEN s.kuantitas < 10 THEN 'low'
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) < 7 THEN 'expiring'
          ELSE 'ok'
        END as status,
        DATEDIFF(s.tanggal_exp, CURDATE()) as daysUntilExpiry
      FROM STOK s
      JOIN menu m ON s.id_menu = m.Id_Menu
      WHERE m.id_restaurant = ?
      AND (s.kuantitas < 20 OR DATEDIFF(s.tanggal_exp, CURDATE()) < 14)
      ORDER BY 
        CASE 
          WHEN s.kuantitas < 10 THEN 1
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) < 7 THEN 2
          ELSE 3
        END,
        s.kuantitas ASC
      LIMIT 10
    `;

    const stockAlertsResult = await query(stockAlertsSQL, [parseInt(restaurantId)]);
    
    const stockAlerts: StockAlert[] = (stockAlertsResult || []).map((row: any) => ({
      id: safeNumber(row.id),
      name: String(row.name || 'Unknown Item'),
      quantity: safeNumber(row.quantity),
      status: String(row.status),
      daysUntilExpiry: safeNumber(row.daysUntilExpiry)
    }));

    const response = {
      success: true,
      data: {
        stats: dashboardStats,
        salesData: salesData,
        topProducts: topProducts,
        recentOrders: recentOrders,
        stockAlerts: stockAlerts
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        data_period: 'last_30_days',
        last_updated: new Date().toISOString(),
        total_data_points: {
          sales_days: salesData.length,
          top_products: topProducts.length,
          recent_orders: recentOrders.length,
          stock_alerts: stockAlerts.length
        }
      }
    };

    console.log('✅ Dashboard data fetched successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          stats: {
            totalSales: 0,
            totalOrders: 0,
            totalCustomers: 0,
            avgOrderValue: 0,
            salesGrowth: 0,
            ordersGrowth: 0,
            customersGrowth: 0,
            avgOrderGrowth: 0
          },
          salesData: [],
          topProducts: [],
          recentOrders: [],
          stockAlerts: []
        }
      },
      { status: 500 }
    );
  }
}