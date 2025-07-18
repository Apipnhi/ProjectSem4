// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Define interfaces for type safety
interface DatabaseSalesData {
  date: string;
  sales: string | number;
  orders: string | number;
}

interface DatabaseStats {
  current_sales: string | number;
  current_orders: string | number;
  current_customers: string | number;
  prev_sales: string | number;
  prev_orders: string | number;
  prev_customers: string | number;
  current_avg_order: string | number;
  prev_avg_order: string | number;
}

interface DatabaseTopProduct {
  name: string;
  sales: string | number;
  quantity: string | number;
  revenue: string | number;
}

interface DatabaseRecentOrder {
  id: number;
  date: string;
  total: string | number;
  status: string;
}

interface DatabaseStockAlert {
  id: number;
  name: string;
  quantity: string | number;
  status: string;
  daysUntilExpiry: string | number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id') || '1'
    
    console.log('📊 Fetching dashboard data for restaurant:', restaurantId)

    // Get current date ranges for calculations
    const currentDate = new Date()
    const thirtyDaysAgo = new Date(currentDate)
    thirtyDaysAgo.setDate(currentDate.getDate() - 30)
    const sixtyDaysAgo = new Date(currentDate)
    sixtyDaysAgo.setDate(currentDate.getDate() - 60)

    const currentDateStr = currentDate.toISOString().split('T')[0]
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0]

    // Get main statistics
    const statsSQL = `
      SELECT 
        -- Current period (last 30 days)
        COALESCE(SUM(CASE WHEN c.Tanggal_Order >= ? THEN c.Harga_Total END), 0) as current_sales,
        COALESCE(COUNT(CASE WHEN c.Tanggal_Order >= ? THEN c.Invoice_Id END), 0) as current_orders,
        COALESCE(COUNT(DISTINCT CASE WHEN c.Tanggal_Order >= ? THEN c.Invoice_Id END), 0) as current_customers,
        
        -- Previous period (30-60 days ago)
        COALESCE(SUM(CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Harga_Total END), 0) as prev_sales,
        COALESCE(COUNT(CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Invoice_Id END), 0) as prev_orders,
        COALESCE(COUNT(DISTINCT CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Invoice_Id END), 0) as prev_customers,
        
        -- Average order value
        CASE 
          WHEN COUNT(CASE WHEN c.Tanggal_Order >= ? THEN c.Invoice_Id END) > 0 
          THEN SUM(CASE WHEN c.Tanggal_Order >= ? THEN c.Harga_Total END) / COUNT(CASE WHEN c.Tanggal_Order >= ? THEN c.Invoice_Id END)
          ELSE 0 
        END as current_avg_order,
        
        CASE 
          WHEN COUNT(CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Invoice_Id END) > 0 
          THEN SUM(CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Harga_Total END) / COUNT(CASE WHEN c.Tanggal_Order >= ? AND c.Tanggal_Order < ? THEN c.Invoice_Id END)
          ELSE 0 
        END as prev_avg_order

      FROM Customer c
      WHERE c.id_restaurant = ?
    `

    const [stats] = await query(statsSQL, [
      thirtyDaysAgoStr, thirtyDaysAgoStr, thirtyDaysAgoStr,
      sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr,
      thirtyDaysAgoStr, thirtyDaysAgoStr, thirtyDaysAgoStr,
      sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr,
      restaurantId
    ]) as DatabaseStats[]

    // Calculate growth rates
    const currentSales = Number(stats.current_sales)
    const prevSales = Number(stats.prev_sales)
    const currentOrders = Number(stats.current_orders)
    const prevOrders = Number(stats.prev_orders)
    const currentCustomers = Number(stats.current_customers)
    const prevCustomers = Number(stats.prev_customers)
    const currentAvgOrder = Number(stats.current_avg_order)
    const prevAvgOrder = Number(stats.prev_avg_order)

    const salesGrowth = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100) : 0
    const ordersGrowth = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders * 100) : 0
    const customersGrowth = prevCustomers > 0 ? ((currentCustomers - prevCustomers) / prevCustomers * 100) : 0
    const avgOrderGrowth = prevAvgOrder > 0 ? ((currentAvgOrder - prevAvgOrder) / prevAvgOrder * 100) : 0

    // Get sales data for chart (last 7 days)
    const salesDataSQL = `
      SELECT 
        DATE(c.Tanggal_Order) as date,
        SUM(c.Harga_Total) as sales,
        COUNT(c.Invoice_Id) as orders
      FROM Customer c
      WHERE c.id_restaurant = ? 
        AND c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(c.Tanggal_Order)
      ORDER BY DATE(c.Tanggal_Order)
    `

    const salesData = await query(salesDataSQL, [restaurantId]) as DatabaseSalesData[]

    // Get top products
    const topProductsSQL = `
      SELECT 
        m.Nama_Menu as name,
        COUNT(DISTINCT c.Invoice_Id) as sales,
        SUM(mm.kuantitas) as quantity,
        SUM(mm.kuantitas * m.Harga) as revenue
      FROM MEMESAN_MENU mm
      JOIN menu m ON mm.id_menu = m.Id_Menu
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE c.id_restaurant = ? 
        AND c.Tanggal_Order >= ?
      GROUP BY m.Id_Menu, m.Nama_Menu
      
      UNION ALL
      
      SELECT 
        m.Nama_Menu as name,
        COUNT(DISTINCT c.Invoice_Id) as sales,
        SUM(mp.kuantitas) as quantity,
        SUM(mp.kuantitas * m.Harga) as revenue
      FROM MEMESAN_PAKET mp
      JOIN menu m ON mp.id_menu = m.Id_Menu
      JOIN Customer c ON mp.Id_customer = c.Invoice_Id
      WHERE c.id_restaurant = ? 
        AND c.Tanggal_Order >= ?
      GROUP BY m.Id_Menu, m.Nama_Menu
      
      ORDER BY revenue DESC
      LIMIT 5
    `

    const topProducts = await query(topProductsSQL, [restaurantId, thirtyDaysAgoStr, restaurantId, thirtyDaysAgoStr]) as DatabaseTopProduct[]

    // Get recent orders
    const recentOrdersSQL = `
      SELECT 
        c.Invoice_Id as id,
        c.Tanggal_Order as date,
        c.Harga_Total as total,
        CASE 
          WHEN COALESCE(mm.total_items, 0) + COALESCE(mp.total_items, 0) > 0 THEN 'completed'
          ELSE 'pending'
        END as status
      FROM Customer c
      LEFT JOIN (
        SELECT id_customer, COUNT(*) as total_items
        FROM MEMESAN_MENU 
        GROUP BY id_customer
      ) mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN (
        SELECT Id_customer, COUNT(*) as total_items
        FROM MEMESAN_PAKET 
        GROUP BY Id_customer
      ) mp ON c.Invoice_Id = mp.Id_customer
      WHERE c.id_restaurant = ?
      ORDER BY c.Tanggal_Order DESC, c.Invoice_Id DESC
      LIMIT 5
    `

    const recentOrders = await query(recentOrdersSQL, [restaurantId]) as DatabaseRecentOrder[]

    // Get stock alerts
    const stockAlertsSQL = `
      SELECT 
        s.id_stok as id,
        s.nama_bahan as name,
        s.kuantitas as quantity,
        CASE 
          WHEN s.kuantitas <= 5 THEN 'low'
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) <= 3 THEN 'expiring'
          ELSE 'normal'
        END as status,
        GREATEST(0, DATEDIFF(s.tanggal_exp, CURDATE())) as daysUntilExpiry
      FROM STOK s
      WHERE s.id_restaurant = ?
        AND (s.kuantitas <= 10 OR DATEDIFF(s.tanggal_exp, CURDATE()) <= 7)
      ORDER BY 
        CASE 
          WHEN s.kuantitas <= 5 THEN 1
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) <= 3 THEN 2
          ELSE 3
        END,
        s.kuantitas ASC,
        s.tanggal_exp ASC
      LIMIT 5
    `

    const stockAlerts = await query(stockAlertsSQL, [restaurantId]) as DatabaseStockAlert[]

    const dashboardData = {
      stats: {
        totalSales: currentSales,
        totalOrders: currentOrders,
        totalCustomers: currentCustomers,
        avgOrderValue: currentAvgOrder,
        salesGrowth: Math.round(salesGrowth * 100) / 100,
        ordersGrowth: Math.round(ordersGrowth * 100) / 100,
        customersGrowth: Math.round(customersGrowth * 100) / 100,
        avgOrderGrowth: Math.round(avgOrderGrowth * 100) / 100
      },
      salesData: salesData.map((item: DatabaseSalesData) => ({
        date: item.date,
        sales: Number(item.sales),
        orders: Number(item.orders)
      })),
      topProducts: topProducts.map((product: DatabaseTopProduct) => ({
        name: product.name,
        sales: Number(product.sales),
        quantity: Number(product.quantity),
        revenue: Number(product.revenue)
      })),
      recentOrders: recentOrders.map((order: DatabaseRecentOrder) => ({
        id: order.id,
        date: order.date,
        total: Number(order.total),
        status: order.status
      })),
      stockAlerts: stockAlerts.map((alert: DatabaseStockAlert) => ({
        id: alert.id,
        name: alert.name,
        quantity: Number(alert.quantity),
        status: alert.status,
        daysUntilExpiry: Number(alert.daysUntilExpiry)
      }))
    }

    console.log('✅ Dashboard data fetched successfully')

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}