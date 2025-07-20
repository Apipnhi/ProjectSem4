// app/api/analytics/route.ts - Analytics API
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: any[];
  revenueByCategory: any[];
  dailySales: any[];
  monthlySales: any[];
  customerInsights: any;
  inventoryStatus: any[];
}

// Helper functions
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET endpoint - Fetch comprehensive analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    console.log(`📊 Fetching analytics for restaurant ${restaurantId}, period: ${period} days`);

    // Calculate date range
    const endDateTime = endDate ? new Date(endDate) : new Date();
    const startDateTime = startDate ? new Date(startDate) : new Date(endDateTime.getTime() - (parseInt(period) * 24 * 60 * 60 * 1000));

    // 1. Total Revenue and Orders
    const revenueSQL = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(Harga_Total) as total_revenue,
        AVG(Harga_Total) as avg_order_value
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order BETWEEN ? AND ?
    `;

    const revenueResult = await query(revenueSQL, [
      restaurantId, 
      formatDate(startDateTime), 
      formatDate(endDateTime)
    ]);

    const revenueData = revenueResult[0] || {};
    const totalRevenue = safeNumber(revenueData.total_revenue);
    const totalOrders = safeNumber(revenueData.total_orders);
    const averageOrderValue = safeNumber(revenueData.avg_order_value);

    // 2. Top Selling Items
    const topItemsSQL = `
      SELECT 
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        SUM(mm.kuantitas) as total_quantity,
        COUNT(mm.id_menu) as order_count,
        SUM(mm.kuantitas * m.Harga) as total_revenue
      FROM menu m
      JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.Tanggal_Order BETWEEN ? AND ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    const topItemsResult = await query(topItemsSQL, [
      restaurantId,
      formatDate(startDateTime),
      formatDate(endDateTime)
    ]);

    const topSellingItems = (topItemsResult || []).map((item: any) => ({
      name: item.Nama_Menu,
      category: item.Kategori,
      price: safeNumber(item.Harga),
      quantity: safeNumber(item.total_quantity),
      orders: safeNumber(item.order_count),
      revenue: safeNumber(item.total_revenue)
    }));

    // 3. Revenue by Category
    const categorySQL = `
      SELECT 
        m.Kategori,
        SUM(mm.kuantitas * m.Harga) as category_revenue,
        SUM(mm.kuantitas) as total_quantity,
        COUNT(DISTINCT c.Invoice_Id) as unique_orders
      FROM menu m
      JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.Tanggal_Order BETWEEN ? AND ?
      GROUP BY m.Kategori
      ORDER BY category_revenue DESC
    `;

    const categoryResult = await query(categorySQL, [
      restaurantId,
      formatDate(startDateTime),
      formatDate(endDateTime)
    ]);

    const revenueByCategory = (categoryResult || []).map((cat: any) => ({
      category: cat.Kategori,
      revenue: safeNumber(cat.category_revenue),
      quantity: safeNumber(cat.total_quantity),
      orders: safeNumber(cat.unique_orders),
      percentage: totalRevenue > 0 ? Math.round((safeNumber(cat.category_revenue) / totalRevenue) * 100) : 0
    }));

    // 4. Daily Sales Trend
    const dailySalesSQL = `
      SELECT 
        DATE(Tanggal_Order) as sale_date,
        COUNT(*) as orders,
        SUM(Harga_Total) as revenue
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order BETWEEN ? AND ?
      GROUP BY DATE(Tanggal_Order)
      ORDER BY sale_date ASC
    `;

    const dailySalesResult = await query(dailySalesSQL, [
      restaurantId,
      formatDate(startDateTime),
      formatDate(endDateTime)
    ]);

    const dailySales = (dailySalesResult || []).map((day: any) => ({
      date: day.sale_date,
      orders: safeNumber(day.orders),
      revenue: safeNumber(day.revenue)
    }));

    // 5. Monthly Sales (last 12 months)
    const monthlySalesSQL = `
      SELECT 
        YEAR(Tanggal_Order) as year,
        MONTH(Tanggal_Order) as month,
        COUNT(*) as orders,
        SUM(Harga_Total) as revenue
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(Tanggal_Order), MONTH(Tanggal_Order)
      ORDER BY year ASC, month ASC
    `;

    const monthlySalesResult = await query(monthlySalesSQL, [restaurantId]);

    const monthlySales = (monthlySalesResult || []).map((month: any) => ({
      year: month.year,
      month: month.month,
      monthName: new Date(month.year, month.month - 1).toLocaleString('id-ID', { month: 'long' }),
      orders: safeNumber(month.orders),
      revenue: safeNumber(month.revenue)
    }));

    // 6. Customer Insights
    const customerInsightsSQL = `
      SELECT 
        COUNT(DISTINCT Invoice_Id) as unique_customers,
        AVG(Harga_Total) as avg_order_value,
        MAX(Harga_Total) as highest_order,
        MIN(Harga_Total) as lowest_order
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order BETWEEN ? AND ?
    `;

    const customerResult = await query(customerInsightsSQL, [
      restaurantId,
      formatDate(startDateTime),
      formatDate(endDateTime)
    ]);

    const customerInsights = customerResult[0] ? {
      uniqueCustomers: safeNumber(customerResult[0].unique_customers),
      avgOrderValue: safeNumber(customerResult[0].avg_order_value),
      highestOrder: safeNumber(customerResult[0].highest_order),
      lowestOrder: safeNumber(customerResult[0].lowest_order),
      ordersPerCustomer: totalOrders > 0 && customerResult[0].unique_customers > 0 
        ? Math.round(totalOrders / safeNumber(customerResult[0].unique_customers) * 100) / 100 
        : 0
    } : {
      uniqueCustomers: 0,
      avgOrderValue: 0,
      highestOrder: 0,
      lowestOrder: 0,
      ordersPerCustomer: 0
    };

    // 7. Inventory Status
    const inventorySQL = `
      SELECT 
        s.nama_bahan,
        s.kuantitas,
        s.tanggal_exp,
        s.pengeluaran,
        m.Nama_Menu,
        DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_expiry
      FROM STOK s
      JOIN menu m ON s.id_menu = m.Id_Menu
      WHERE s.id_restaurant = ?
      ORDER BY days_until_expiry ASC, s.kuantitas ASC
    `;

    const inventoryResult = await query(inventorySQL, [restaurantId]);

    const inventoryStatus = (inventoryResult || []).map((item: any) => ({
      ingredient: item.nama_bahan,
      quantity: safeNumber(item.kuantitas),
      expiryDate: item.tanggal_exp,
      cost: safeNumber(item.pengeluaran),
      menuItem: item.Nama_Menu,
      daysUntilExpiry: safeNumber(item.days_until_expiry),
      status: safeNumber(item.days_until_expiry) <= 3 ? 'critical' : 
              safeNumber(item.days_until_expiry) <= 7 ? 'warning' : 'good'
    }));

    // Compile analytics data
    const analyticsData: AnalyticsData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      revenueByCategory,
      dailySales,
      monthlySales,
      customerInsights,
      inventoryStatus
    };

    console.log(`✅ Analytics compiled: ${totalOrders} orders, Rp${totalRevenue} revenue`);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      metadata: {
        restaurant_id: restaurantId,
        period_days: parseInt(period),
        start_date: formatDate(startDateTime),
        end_date: formatDate(endDateTime),
        generated_at: new Date().toISOString(),
        data_points: {
          daily_sales: dailySales.length,
          top_items: topSellingItems.length,
          categories: revenueByCategory.length,
          inventory_items: inventoryStatus.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        revenueByCategory: [],
        dailySales: [],
        monthlySales: [],
        customerInsights: {},
        inventoryStatus: []
      }
    }, { status: 500 });
  }
}