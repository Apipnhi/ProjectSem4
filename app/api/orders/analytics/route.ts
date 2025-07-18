// app/api/orders/analytics/route.ts - Fixed TypeScript errors
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

interface DateRange {
  start_date: string;
  end_date: string;
}

interface AnalyticsFilters {
  restaurant_id?: number;
  date_range?: DateRange;
  status?: string;
  order_type?: string;
}

// Define allowed metrics type
type AllowedMetric = 'revenue' | 'orders' | 'avg_order_value' | 'unique_customers' | 'items_sold';

// GET - Comprehensive order analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 Generating comprehensive order analytics...')

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurant_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const period = searchParams.get("period") || "month" // day, week, month, year
    const includeItems = searchParams.get("include_items") === "true"

    let whereConditions: string[] = []
    
    if (restaurantId) {
      whereConditions.push(`c.id_restaurant = ${parseInt(restaurantId)}`)
    }

    if (startDate) {
      whereConditions.push(`DATE(c.Tanggal_Order) >= '${startDate}'`)
    }

    if (endDate) {
      whereConditions.push(`DATE(c.Tanggal_Order) <= '${endDate}'`)
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : ''

    // 1. BASIC METRICS
    const basicMetricsSQL = `
      SELECT 
        COUNT(DISTINCT c.Invoice_Id) as total_orders,
        SUM(c.Harga_Total) as total_revenue,
        AVG(c.Harga_Total) as avg_order_value,
        MIN(c.Harga_Total) as min_order_value,
        MAX(c.Harga_Total) as max_order_value,
        
        -- Time-based metrics
        COUNT(DISTINCT DATE(c.Tanggal_Order)) as active_days,
        COUNT(DISTINCT c.id_restaurant) as active_restaurants,
        
        -- Growth metrics (comparing current period to previous)
        (SELECT COUNT(*) FROM Customer c2 
         WHERE c2.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
         ${restaurantId ? `AND c2.id_restaurant = ${parseInt(restaurantId)}` : ''}) as current_month_orders,
         
        (SELECT COUNT(*) FROM Customer c3 
         WHERE c3.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
         AND c3.Tanggal_Order < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
         ${restaurantId ? `AND c3.id_restaurant = ${parseInt(restaurantId)}` : ''}) as previous_month_orders
         
      FROM Customer c
      ${whereClause}
    `

    // 2. TIME SERIES DATA
    const periodFormatMap: Record<string, string> = {
      'hour': 'HOUR(c.Tanggal_Order)',
      'day': 'DATE(c.Tanggal_Order)',
      'week': 'YEARWEEK(c.Tanggal_Order, 1)',
      'month': 'DATE_FORMAT(c.Tanggal_Order, "%Y-%m")',
      'year': 'YEAR(c.Tanggal_Order)'
    }

    const timeGroupBy = periodFormatMap[period] || periodFormatMap['day']

    const timeSeriesSQL = `
      SELECT 
        ${timeGroupBy} as time_period,
        COUNT(DISTINCT c.Invoice_Id) as orders_count,
        SUM(c.Harga_Total) as revenue,
        AVG(c.Harga_Total) as avg_order_value,
        COUNT(DISTINCT c.id_restaurant) as restaurants_served
      FROM Customer c
      ${whereClause}
      GROUP BY ${timeGroupBy}
      ORDER BY time_period
    `

    // 3. RESTAURANT PERFORMANCE
    const restaurantPerformanceSQL = `
      SELECT 
        c.id_restaurant,
        r.Nama_Restaurant as nama_restaurant,
        COUNT(DISTINCT c.Invoice_Id) as total_orders,
        SUM(c.Harga_Total) as total_revenue,
        AVG(c.Harga_Total) as avg_order_value,
        MIN(c.Tanggal_Order) as first_order,
        MAX(c.Tanggal_Order) as latest_order,
        SUM(c.Harga_Total) / COUNT(DISTINCT c.Invoice_Id) as revenue_per_order,
        COUNT(DISTINCT DATE(c.Tanggal_Order)) as active_days,
        COUNT(DISTINCT c.Invoice_Id) / COUNT(DISTINCT DATE(c.Tanggal_Order)) as orders_per_day,
        
        -- Market share calculation
        (SUM(c.Harga_Total) * 100.0) / (
          SELECT SUM(c2.Harga_Total) 
          FROM Customer c2 
          ${whereClause.replace('c.', 'c2.')}
        ) as revenue_share_percent
        
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      ${whereClause}
      GROUP BY c.id_restaurant, r.Nama_Restaurant
      ORDER BY total_revenue DESC
    `

    // 4. HOURLY PATTERNS
    const hourlyPatternsSQL = `
      SELECT 
        HOUR(c.Tanggal_Order) as hour,
        COUNT(DISTINCT c.Invoice_Id) as orders_count,
        SUM(c.Harga_Total) as revenue,
        AVG(c.Harga_Total) as avg_order_value
      FROM Customer c
      ${whereClause}
      GROUP BY HOUR(c.Tanggal_Order)
      ORDER BY hour
    `

    // 5. DAILY PATTERNS
    const dailyPatternsSQL = `
      SELECT 
        DAYOFWEEK(c.Tanggal_Order) as day_of_week,
        DAYNAME(c.Tanggal_Order) as day_name,
        COUNT(DISTINCT c.Invoice_Id) as orders_count,
        SUM(c.Harga_Total) as revenue,
        AVG(c.Harga_Total) as avg_order_value
      FROM Customer c
      ${whereClause}
      GROUP BY DAYOFWEEK(c.Tanggal_Order), DAYNAME(c.Tanggal_Order)
      ORDER BY day_of_week
    `

    // 6. ORDER SIZE DISTRIBUTION
    const orderSizeSQL = `
      SELECT 
        CASE 
          WHEN c.Harga_Total < 30000 THEN 'Small'
          WHEN c.Harga_Total >= 30000 AND c.Harga_Total < 70000 THEN 'Medium'
          ELSE 'Large'
        END as order_size_category,
        COUNT(DISTINCT c.Invoice_Id) as orders_count,
        SUM(c.Harga_Total) as total_revenue,
        AVG(c.Harga_Total) as avg_value,
        (COUNT(DISTINCT c.Invoice_Id) * 100.0) / (
          SELECT COUNT(DISTINCT c2.Invoice_Id) 
          FROM Customer c2 
          ${whereClause.replace('c.', 'c2.')}
        ) as percentage
      FROM Customer c
      ${whereClause}
      GROUP BY 
        CASE 
          WHEN c.Harga_Total < 30000 THEN 'Small'
          WHEN c.Harga_Total >= 30000 AND c.Harga_Total < 70000 THEN 'Medium'
          ELSE 'Large'
        END
      ORDER BY avg_value
    `

    // 7. TOP MENU ITEMS (if requested)
    let topMenuItemsSQL = ''
    if (includeItems) {
      topMenuItemsSQL = `
        SELECT 
          m.Id_Menu,
          m.Nama_Menu,
          m.Kategori,
          m.Harga,
          COUNT(DISTINCT mm.id_customer) as times_ordered,
          SUM(mm.kuantitas) as total_quantity,
          SUM(mm.kuantitas * m.Harga) as total_revenue,
          AVG(mm.kuantitas) as avg_quantity_per_order,
          COUNT(DISTINCT mm.id_customer) as unique_customers,
          
          -- Revenue contribution
          (SUM(mm.kuantitas * m.Harga) * 100.0) / (
            SELECT SUM(c.Harga_Total) 
            FROM Customer c 
            ${whereClause}
          ) as revenue_contribution_percent
          
        FROM menu m
        LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
        LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
        ${whereClause}
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
        HAVING times_ordered > 0
        ORDER BY total_revenue DESC
        LIMIT 20
      `
    }

    // Execute all queries
    console.log('🔍 Executing analytics queries...')
    
    const [
      metrics,
      timeSeries,
      restaurantPerformance,
      hourlyData,
      dayData,
      orderSizes,
      topMenuItems
    ] = await Promise.all([
      query(basicMetricsSQL),
      query(timeSeriesSQL),
      query(restaurantPerformanceSQL),
      query(hourlyPatternsSQL),
      query(dailyPatternsSQL),
      query(orderSizeSQL),
      includeItems ? query(topMenuItemsSQL) : Promise.resolve([])
    ])

    console.log('✅ Analytics queries completed successfully')

    // Calculate additional metrics
    const metricsData = metrics[0] || {}
    const growthRate = metricsData.previous_month_orders > 0 
      ? ((metricsData.current_month_orders - metricsData.previous_month_orders) / metricsData.previous_month_orders) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        // Summary metrics
        metrics: {
          total_orders: parseInt(metricsData.total_orders) || 0,
          total_revenue: parseFloat(metricsData.total_revenue) || 0,
          avg_order_value: parseFloat(metricsData.avg_order_value) || 0,
          min_order_value: parseFloat(metricsData.min_order_value) || 0,
          max_order_value: parseFloat(metricsData.max_order_value) || 0,
          active_days: parseInt(metricsData.active_days) || 0,
          active_restaurants: parseInt(metricsData.active_restaurants) || 0,
          growth_rate: Math.round(growthRate * 100) / 100,
          current_month_orders: parseInt(metricsData.current_month_orders) || 0,
          previous_month_orders: parseInt(metricsData.previous_month_orders) || 0,
          orders_per_day: metricsData.active_days > 0 ? 
            Math.round((parseInt(metricsData.total_orders) / parseInt(metricsData.active_days)) * 100) / 100 : 0
        },

        // Time series data
        time_series: timeSeries.map((item: any) => ({
          period: item.time_period,
          orders: parseInt(item.orders_count),
          revenue: parseFloat(item.revenue),
          avg_order_value: parseFloat(item.avg_order_value),
          restaurants_served: parseInt(item.restaurants_served)
        })),

        // Restaurant performance
        restaurant_performance: restaurantPerformance.map((restaurant: any) => ({
          id: restaurant.id_restaurant,
          name: restaurant.nama_restaurant || `Restaurant ${restaurant.id_restaurant}`,
          total_orders: parseInt(restaurant.total_orders),
          total_revenue: parseFloat(restaurant.total_revenue),
          avg_order_value: parseFloat(restaurant.avg_order_value),
          first_order: restaurant.first_order,
          latest_order: restaurant.latest_order,
          revenue_per_order: parseFloat(restaurant.revenue_per_order),
          active_days: parseInt(restaurant.active_days),
          orders_per_day: parseFloat(restaurant.orders_per_day),
          market_share: parseFloat(restaurant.revenue_share_percent)
        })),

        // Patterns and distributions
        patterns: {
          hourly: hourlyData,
          daily: dayData,
          order_sizes: orderSizes.map((size: any) => ({
            category: size.order_size_category,
            orders: parseInt(size.orders_count),
            revenue: parseFloat(size.total_revenue),
            avg_value: parseFloat(size.avg_value),
            percentage: parseFloat(size.percentage)
          }))
        },

        // Top menu items (if requested)
        ...(includeItems && {
          top_menu_items: topMenuItems.map((item: any) => ({
            id: item.Id_Menu,
            name: item.Nama_Menu,
            category: item.Kategori,
            price: parseFloat(item.Harga),
            times_ordered: parseInt(item.times_ordered),
            total_quantity: parseInt(item.total_quantity),
            total_revenue: parseFloat(item.total_revenue),
            avg_quantity_per_order: parseFloat(item.avg_quantity_per_order),
            unique_customers: parseInt(item.unique_customers),
            revenue_contribution: parseFloat(item.revenue_contribution_percent)
          }))
        }),

        // Metadata
        metadata: {
          generated_at: new Date().toISOString(),
          period: period,
          filters: {
            restaurant_id: restaurantId ? parseInt(restaurantId) : null,
            start_date: startDate,
            end_date: endDate
          },
          data_points: {
            orders_analyzed: parseInt(metricsData.total_orders) || 0,
            time_periods: timeSeries.length,
            restaurants: restaurantPerformance.length,
            menu_items: topMenuItems.length
          }
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error generating order analytics:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to generate order analytics",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Generate custom analytics report
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 Generating custom analytics report...')
    const body = await request.json()

    const { 
      filters = {}, 
      metrics = ['revenue', 'orders', 'avg_order_value'] as AllowedMetric[],
      groupBy = 'day',
      includeComparisons = true,
      includeForecasting = false
    } = body

    // Build dynamic where clause based on filters
    let whereConditions: string[] = []
    
    if (filters.restaurant_id) {
      whereConditions.push(`c.id_restaurant = ${parseInt(filters.restaurant_id)}`)
    }

    if (filters.date_range) {
      if (filters.date_range.start_date) {
        whereConditions.push(`DATE(c.Tanggal_Order) >= '${filters.date_range.start_date}'`)
      }
      if (filters.date_range.end_date) {
        whereConditions.push(`DATE(c.Tanggal_Order) <= '${filters.date_range.end_date}'`)
      }
    }

    if (filters.min_order_value) {
      whereConditions.push(`c.Harga_Total >= ${parseFloat(filters.min_order_value)}`)
    }

    if (filters.max_order_value) {
      whereConditions.push(`c.Harga_Total <= ${parseFloat(filters.max_order_value)}`)
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : ''

    // Build dynamic SELECT clause based on requested metrics
    const metricSelectors: Record<AllowedMetric, string> = {
      'revenue': 'SUM(c.Harga_Total) as total_revenue',
      'orders': 'COUNT(c.Invoice_Id) as total_orders',
      'avg_order_value': 'AVG(c.Harga_Total) as avg_order_value',
      'unique_customers': 'COUNT(DISTINCT c.Invoice_Id) as unique_customers',
      'items_sold': 'SUM(mm.kuantitas) as total_items_sold'
    }

    const selectedMetrics = metrics.map((metric: AllowedMetric) => metricSelectors[metric] || metricSelectors['revenue']).join(', ')

    // Build GROUP BY clause
    const groupByClause: Record<string, string> = {
      'hour': 'HOUR(c.Tanggal_Order)',
      'day': 'DATE(c.Tanggal_Order)',
      'week': 'YEARWEEK(c.Tanggal_Order, 1)',
      'month': 'DATE_FORMAT(c.Tanggal_Order, "%Y-%m")',
      'restaurant': 'c.id_restaurant',
      'category': 'm.Kategori'
    }

    const groupByField = groupByClause[groupBy] || groupByClause['day']

    // Main analytics query
    const customAnalyticsSQL = `
      SELECT 
        ${groupByField} as group_key,
        ${selectedMetrics},
        COUNT(*) as data_points
      FROM Customer c
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
      GROUP BY ${groupByField}
      ORDER BY group_key
    `

    const analyticsResult = await query(customAnalyticsSQL)

    // Add comparison data if requested
    let comparisonData = null
    if (includeComparisons && filters.date_range) {
      // Calculate previous period for comparison
      const startDate = new Date(filters.date_range.start_date)
      const endDate = new Date(filters.date_range.end_date)
      const periodLength = endDate.getTime() - startDate.getTime()
      
      const prevStartDate = new Date(startDate.getTime() - periodLength)
      const prevEndDate = new Date(endDate.getTime() - periodLength)

      const comparisonWhereClause = whereConditions
        .filter(condition => !condition.includes('DATE(c.Tanggal_Order)'))
        .concat([
          `DATE(c.Tanggal_Order) >= '${prevStartDate.toISOString().split('T')[0]}'`,
          `DATE(c.Tanggal_Order) <= '${prevEndDate.toISOString().split('T')[0]}'`
        ])
        .join(' AND ')

      const comparisonSQL = `
        SELECT 
          ${selectedMetrics}
        FROM Customer c
        LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
        LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
        ${comparisonWhereClause ? `WHERE ${comparisonWhereClause}` : ''}
      `

      const comparisonResult = await query(comparisonSQL)
      comparisonData = comparisonResult[0] || {}
    }

    console.log('✅ Custom analytics report generated successfully')

    return NextResponse.json({
      success: true,
      data: {
        analytics: analyticsResult.map((row: any) => ({
          group: row.group_key,
          ...Object.fromEntries(
            metrics.map((metric: AllowedMetric) => [metric, parseFloat(row[`total_${metric}`] || row[`avg_${metric}`] || row[`unique_${metric}`] || 0)])
          ),
          data_points: parseInt(row.data_points)
        })),
        
        ...(comparisonData && {
          comparison: {
            previous_period: Object.fromEntries(
              metrics.map((metric: AllowedMetric) => [metric, parseFloat(comparisonData[`total_${metric}`] || comparisonData[`avg_${metric}`] || comparisonData[`unique_${metric}`] || 0)])
            ),
            growth_rates: Object.fromEntries(
              metrics.map((metric: AllowedMetric) => {
                const current = analyticsResult.reduce((sum: number, row: any) => sum + parseFloat(row[`total_${metric}`] || row[`avg_${metric}`] || row[`unique_${metric}`] || 0), 0)
                const previous = parseFloat(comparisonData[`total_${metric}`] || comparisonData[`avg_${metric}`] || comparisonData[`unique_${metric}`] || 0)
                const growth = previous > 0 ? ((current - previous) / previous * 100) : 0
                return [metric, Math.round(growth * 100) / 100]
              })
            )
          }
        }),

        metadata: {
          generated_at: new Date().toISOString(),
          filters: filters,
          metrics: metrics,
          group_by: groupBy,
          total_data_points: analyticsResult.length,
          period_analyzed: filters.date_range || 'all_time'
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error generating custom analytics:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to generate custom analytics",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}