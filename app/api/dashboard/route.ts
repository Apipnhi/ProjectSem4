// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Interface untuk data dashboard
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

// Fungsi untuk mendapatkan statistik utama
async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Query untuk mendapatkan data bulan ini
    const currentMonthSql = `
      SELECT 
        COALESCE(SUM(c.Harga_Total), 0) as totalSales,
        COUNT(c.Invoice_Id) as totalOrders,
        COUNT(DISTINCT c.Invoice_Id) as totalCustomers,
        COALESCE(AVG(c.Harga_Total), 0) as avgOrderValue
      FROM Customer c
      WHERE MONTH(c.Tanggal_Order) = MONTH(CURDATE()) 
        AND YEAR(c.Tanggal_Order) = YEAR(CURDATE())
    `;

    // Query untuk mendapatkan data bulan lalu
    const previousMonthSql = `
      SELECT 
        COALESCE(SUM(c.Harga_Total), 0) as totalSales,
        COUNT(c.Invoice_Id) as totalOrders,
        COUNT(DISTINCT c.Invoice_Id) as totalCustomers,
        COALESCE(AVG(c.Harga_Total), 0) as avgOrderValue
      FROM Customer c
      WHERE MONTH(c.Tanggal_Order) = MONTH(CURDATE() - INTERVAL 1 MONTH)
        AND YEAR(c.Tanggal_Order) = YEAR(CURDATE() - INTERVAL 1 MONTH)
    `;

    const [currentMonth, previousMonth] = await Promise.all([
      query(currentMonthSql),
      query(previousMonthSql)
    ]);

    const current = currentMonth[0] || { totalSales: 0, totalOrders: 0, totalCustomers: 0, avgOrderValue: 0 };
    const previous = previousMonth[0] || { totalSales: 0, totalOrders: 0, totalCustomers: 0, avgOrderValue: 0 };

    // Hitung persentase pertumbuhan
    const salesGrowth = previous.totalSales > 0 ? 
      ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 : 0;
    
    const ordersGrowth = previous.totalOrders > 0 ? 
      ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100 : 0;
    
    const customersGrowth = previous.totalCustomers > 0 ? 
      ((current.totalCustomers - previous.totalCustomers) / previous.totalCustomers) * 100 : 0;
    
    const avgOrderGrowth = previous.avgOrderValue > 0 ? 
      ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0;

    return {
      totalSales: Number(current.totalSales),
      totalOrders: Number(current.totalOrders),
      totalCustomers: Number(current.totalCustomers),
      avgOrderValue: Number(current.avgOrderValue),
      salesGrowth: Number(salesGrowth.toFixed(1)),
      ordersGrowth: Number(ordersGrowth.toFixed(1)),
      customersGrowth: Number(customersGrowth.toFixed(1)),
      avgOrderGrowth: Number(avgOrderGrowth.toFixed(1))
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan data penjualan 7 hari terakhir
async function getRecentSalesData(): Promise<SalesData[]> {
  try {
    const sql = `
      SELECT 
        DATE(c.Tanggal_Order) as date,
        SUM(c.Harga_Total) as sales,
        COUNT(c.Invoice_Id) as orders
      FROM Customer c
      WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(c.Tanggal_Order)
      ORDER BY date ASC
    `;

    const results = await query(sql);
    
    return results.map((row: any) => ({
      date: row.date,
      sales: Number(row.sales),
      orders: Number(row.orders)
    }));
  } catch (error) {
    console.error('Error getting recent sales data:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan produk terlaris
async function getTopProducts(): Promise<TopProduct[]> {
  try {
    const sql = `
      SELECT 
        m.Nama_Menu as name,
        COUNT(mm.id_customer) as sales,
        COALESCE(SUM(mm.kuantitas), 0) as quantity,
        COALESCE(SUM(mm.kuantitas * m.Harga), 0) as revenue
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY m.Id_Menu, m.Nama_Menu
      HAVING quantity > 0
      ORDER BY revenue DESC
      LIMIT 5
    `;

    const results = await query(sql);
    
    return results.map((row: any) => ({
      name: row.name,
      sales: Number(row.sales),
      quantity: Number(row.quantity),
      revenue: Number(row.revenue)
    }));
  } catch (error) {
    console.error('Error getting top products:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan pesanan terbaru
async function getRecentOrders(): Promise<RecentOrder[]> {
  try {
    const sql = `
      SELECT 
        c.Invoice_Id as id,
        c.Tanggal_Order as date,
        c.Harga_Total as total,
        'completed' as status
      FROM Customer c
      ORDER BY c.Tanggal_Order DESC
      LIMIT 10
    `;

    const results = await query(sql);
    
    return results.map((row: any) => ({
      id: Number(row.id),
      date: row.date,
      total: Number(row.total),
      status: row.status
    }));
  } catch (error) {
    console.error('Error getting recent orders:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan alert stok
async function getStockAlerts(): Promise<StockAlert[]> {
  try {
    const sql = `
      SELECT 
        s.id_stok as id,
        s.nama_bahan as name,
        s.kuantitas as quantity,
        CASE 
          WHEN s.tanggal_exp < CURDATE() THEN 'expired'
          WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'critical'
          WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'warning'
          ELSE 'good'
        END as status,
        DATEDIFF(s.tanggal_exp, CURDATE()) as daysUntilExpiry
      FROM STOK s
      WHERE s.kuantitas <= 10 OR s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY s.tanggal_exp ASC, s.kuantitas ASC
      LIMIT 5
    `;

    const results = await query(sql);
    
    return results.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      quantity: Number(row.quantity),
      status: row.status,
      daysUntilExpiry: Number(row.daysUntilExpiry)
    }));
  } catch (error) {
    console.error('Error getting stock alerts:', error);
    throw error;
  }
}

// Main GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'stats':
        const stats = await getDashboardStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'sales':
        const salesData = await getRecentSalesData();
        return NextResponse.json({
          success: true,
          data: salesData
        });

      case 'top-products':
        const topProducts = await getTopProducts();
        return NextResponse.json({
          success: true,
          data: topProducts
        });

      case 'recent-orders':
        const recentOrders = await getRecentOrders();
        return NextResponse.json({
          success: true,
          data: recentOrders
        });

      case 'stock-alerts':
        const stockAlerts = await getStockAlerts();
        return NextResponse.json({
          success: true,
          data: stockAlerts
        });

      default:
        // Return all data for dashboard overview
        const [
          dashboardStats,
          recentSales,
          topProductsData,
          recentOrdersData,
          stockAlertsData
        ] = await Promise.all([
          getDashboardStats(),
          getRecentSalesData(),
          getTopProducts(),
          getRecentOrders(),
          getStockAlerts()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            stats: dashboardStats,
            salesData: recentSales,
            topProducts: topProductsData,
            recentOrders: recentOrdersData,
            stockAlerts: stockAlertsData
          }
        });
    }
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'health-check') {
      // Simple health check
      const testQuery = 'SELECT 1 as test';
      await query(testQuery);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in dashboard POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}