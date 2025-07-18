// app/api/orders/status/route.ts - Complete Order Status Management API
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

interface StatusUpdate {
  invoice_id: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  estimated_completion?: string;
}

interface BulkStatusUpdate {
  updates: StatusUpdate[];
}

interface OrderStatusData {
  Invoice_Id: number;
  customer_name: string;
  status: string;
  notes?: string;
  estimated_completion?: string;
  status_created?: string;
  status_updated?: string;
  updated_by?: string;
  total_items: number;
  total_quantity: number;
  menu_items: string;
  minutes_since_order: number;
  estimated_prep_time?: number;
  priority: 'normal' | 'high' | 'urgent';
}

// Since the Customer table doesn't have a status field, we'll create a separate order_status table
async function createOrderStatusTable() {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS order_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        estimated_completion DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(100) DEFAULT 'system',
        UNIQUE KEY unique_invoice (invoice_id),
        FOREIGN KEY (invoice_id) REFERENCES Customer(Invoice_Id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `
    
    await query(createTableSQL)
    console.log('✅ Order status table created/verified')
  } catch (error) {
    console.error('❌ Error creating order status table:', error)
    // Continue without status table if creation fails
  }
}

// GET - Fetch order statuses with comprehensive analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📊 Fetching order statuses...')
    
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoice_id")
    const status = searchParams.get("status")
    const restaurantId = searchParams.get("restaurant_id")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"
    const priority = searchParams.get("priority")

    // Ensure status table exists
    await createOrderStatusTable()

    let whereConditions: string[] = []
    
    if (invoiceId) {
      whereConditions.push(`c.Invoice_Id = ${parseInt(invoiceId)}`)
    }
    
    if (status && status !== 'all') {
      whereConditions.push(`COALESCE(os.status, 'completed') = '${status}'`)
    }
    
    if (restaurantId) {
      whereConditions.push(`c.id_restaurant = ${parseInt(restaurantId)}`)
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : ''

    // Comprehensive query to get orders with their status
    const orderStatusSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        
        -- STATUS INFORMATION
        COALESCE(os.status, 
          CASE 
            WHEN DATEDIFF(NOW(), c.Tanggal_Order) > 1 THEN 'completed'
            WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 2 THEN 'completed'
            WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 1 THEN 'ready'
            WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 0 THEN 'in-progress'
            ELSE 'pending'
          END
        ) as current_status,
        
        os.notes,
        os.estimated_completion,
        os.created_at as status_created,
        os.updated_at as status_updated,
        os.updated_by,
        
        -- ORDER DETAILS
        COUNT(DISTINCT mm.id_menu) as total_items,
        GROUP_CONCAT(DISTINCT m.Nama_Menu SEPARATOR ', ') as menu_items,
        SUM(mm.kuantitas) as total_quantity,
        
        -- TIMING ANALYSIS
        TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) as minutes_since_order,
        TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, os.estimated_completion) as estimated_prep_time,
        
        -- CUSTOMER INFO
        CASE 
          WHEN c.Invoice_Id <= 50 THEN CONCAT('Table ', (c.Invoice_Id % 10) + 1)
          WHEN c.Invoice_Id <= 100 THEN CONCAT('Customer ', CHAR(65 + (c.Invoice_Id % 26)))
          ELSE CONCAT('Customer ', c.Invoice_Id)
        END as customer_name,
        
        -- PRIORITY CALCULATION
        CASE 
          WHEN COALESCE(os.status, 'completed') = 'pending' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 30 THEN 'high'
          WHEN COALESCE(os.status, 'completed') = 'in-progress' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 45 THEN 'high'
          WHEN COALESCE(os.status, 'completed') = 'ready' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 15 THEN 'urgent'
          ELSE 'normal'
        END as priority_level
        
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant, 
               os.status, os.notes, os.estimated_completion, os.created_at, os.updated_at, os.updated_by
      ORDER BY 
        CASE 
          WHEN COALESCE(os.status, 'completed') = 'pending' THEN 1
          WHEN COALESCE(os.status, 'completed') = 'in-progress' THEN 2
          WHEN COALESCE(os.status, 'completed') = 'ready' THEN 3
          WHEN COALESCE(os.status, 'completed') = 'completed' THEN 4
          WHEN COALESCE(os.status, 'completed') = 'cancelled' THEN 5
          ELSE 6
        END,
        c.Tanggal_Order DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    // Get status summary for analytics
    const summarySQL = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN COALESCE(os.status, 'completed') = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN COALESCE(os.status, 'completed') = 'in-progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN COALESCE(os.status, 'completed') = 'ready' THEN 1 ELSE 0 END) as ready_count,
        SUM(CASE WHEN COALESCE(os.status, 'completed') = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN COALESCE(os.status, 'completed') = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        
        -- Performance metrics
        AVG(CASE WHEN os.status = 'completed' AND os.created_at IS NOT NULL 
             THEN TIMESTAMPDIFF(MINUTE, os.created_at, os.updated_at) 
             ELSE NULL END) as avg_completion_time,
             
        COUNT(CASE WHEN DATE(c.Tanggal_Order) = CURDATE() THEN 1 ELSE NULL END) as today_orders,
        
        -- Priority analysis
        SUM(CASE WHEN (
          (COALESCE(os.status, 'completed') = 'pending' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 30) OR
          (COALESCE(os.status, 'completed') = 'in-progress' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 45) OR
          (COALESCE(os.status, 'completed') = 'ready' AND TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) > 15)
        ) THEN 1 ELSE 0 END) as high_priority_orders
        
      FROM Customer c
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      ${whereClause}
    `

    // Get hourly performance for today
    const hourlyPerformanceSQL = `
      SELECT 
        HOUR(c.Tanggal_Order) as hour_of_day,
        COUNT(*) as orders_count,
        AVG(CASE WHEN os.status = 'completed' AND os.created_at IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, os.created_at, os.updated_at) 
            ELSE NULL END) as avg_completion_time_hour
      FROM Customer c
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      WHERE DATE(c.Tanggal_Order) = CURDATE()
      ${restaurantId ? `AND c.id_restaurant = ${parseInt(restaurantId)}` : ''}
      GROUP BY HOUR(c.Tanggal_Order)
      ORDER BY hour_of_day
    `

    const [orders, summaryResult, hourlyResult] = await Promise.all([
      query(orderStatusSQL),
      query(summarySQL),
      query(hourlyPerformanceSQL)
    ])

    const summary = summaryResult[0] || {}
    
    // Filter by priority if requested
    let filteredOrders = orders
    if (priority && priority !== 'all') {
      filteredOrders = orders.filter((order: any) => order.priority_level === priority)
    }

    console.log(`✅ Found ${filteredOrders.length} orders with status information`)

    return NextResponse.json({
      success: true,
      data: {
        orders: filteredOrders.map((order: any) => ({
          id: `#${order.Invoice_Id}`,
          invoice_id: order.Invoice_Id,
          customer: order.customer_name,
          date: order.Tanggal_Order,
          total: parseFloat(order.Harga_Total),
          restaurant_id: order.id_restaurant,
          restaurant_name: order.nama_restaurant || 'Unknown Restaurant',
          
          // Status information
          status: order.current_status,
          notes: order.notes || '',
          estimated_completion: order.estimated_completion,
          status_created: order.status_created,
          status_updated: order.status_updated,
          updated_by: order.updated_by || 'system',
          
          // Order details
          total_items: parseInt(order.total_items) || 0,
          total_quantity: parseInt(order.total_quantity) || 0,
          menu_items: order.menu_items || '',
          items: order.menu_items ? order.menu_items.split(', ') : [],
          
          // Timing analysis
          minutes_since_order: parseInt(order.minutes_since_order) || 0,
          estimated_prep_time: parseInt(order.estimated_prep_time) || null,
          
          // Status indicators for frontend
          is_overdue: order.estimated_completion && new Date(order.estimated_completion) < new Date(),
          time_remaining: order.estimated_completion ? 
            Math.max(0, Math.floor((new Date(order.estimated_completion).getTime() - new Date().getTime()) / 60000)) : null,
          
          // Priority calculation
          priority: order.priority_level
        })),
        
        summary: {
          total_orders: parseInt(summary.total_orders) || 0,
          pending: parseInt(summary.pending_count) || 0,
          in_progress: parseInt(summary.in_progress_count) || 0,
          ready: parseInt(summary.ready_count) || 0,
          completed: parseInt(summary.completed_count) || 0,
          cancelled: parseInt(summary.cancelled_count) || 0,
          avg_completion_time: parseFloat(summary.avg_completion_time) || 0,
          today_orders: parseInt(summary.today_orders) || 0,
          high_priority_orders: parseInt(summary.high_priority_orders) || 0,
          
          // Performance indicators
          efficiency_score: summary.avg_completion_time ? 
            Math.max(0, 100 - (parseFloat(summary.avg_completion_time) / 60 * 10)) : 85
        },
        
        // Hourly performance data
        hourly_performance: hourlyResult.map((hour: any) => ({
          hour: parseInt(hour.hour_of_day),
          orders_count: parseInt(hour.orders_count),
          avg_completion_time: parseFloat(hour.avg_completion_time_hour) || 0
        })),
        
        pagination: {
          total: parseInt(summary.total_orders) || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + filteredOrders.length) < (parseInt(summary.total_orders) || 0)
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error fetching order statuses:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch order statuses",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Update individual order status
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📝 Updating order status...')
    const body: StatusUpdate = await request.json()

    const { invoice_id, status, notes, estimated_completion } = body

    // Validate required fields
    if (!invoice_id || !status) {
      return NextResponse.json({ 
        success: false,
        error: "Invoice ID and status are required" 
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'in-progress', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Check if order exists
    const orderCheckSQL = `SELECT Invoice_Id, Harga_Total FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(orderCheckSQL, [invoice_id])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    // Ensure status table exists
    await createOrderStatusTable()

    // Calculate estimated completion if not provided
    let estimatedCompletionTime = estimated_completion
    if (!estimatedCompletionTime && status === 'in-progress') {
      // Auto-calculate based on order complexity
      const orderTotal = parseFloat(existingOrder[0].Harga_Total)
      const estimatedMinutes = orderTotal > 100000 ? 45 : orderTotal > 50000 ? 30 : 20
      const now = new Date()
      now.setMinutes(now.getMinutes() + estimatedMinutes)
      estimatedCompletionTime = now.toISOString()
    }

    // Insert or update status
    const upsertStatusSQL = `
      INSERT INTO order_status (invoice_id, status, notes, estimated_completion, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = VALUES(notes),
        estimated_completion = VALUES(estimated_completion),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = VALUES(updated_by)
    `

    await query(upsertStatusSQL, [
      invoice_id,
      status,
      notes || null,
      estimatedCompletionTime || null,
      'dashboard_api' // In a real app, this would be the authenticated user
    ])

    // Get updated order details
    const updatedOrderSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        os.status,
        os.notes,
        os.estimated_completion,
        os.updated_at,
        os.updated_by,
        COUNT(DISTINCT mm.id_menu) as total_items,
        GROUP_CONCAT(DISTINCT m.Nama_Menu SEPARATOR ', ') as menu_items,
        TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) as minutes_since_order
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      WHERE c.Invoice_Id = ?
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant,
               os.status, os.notes, os.estimated_completion, os.updated_at, os.updated_by
    `

    const updatedOrder = await query(updatedOrderSQL, [invoice_id])
    const order = updatedOrder[0]

    console.log('✅ Order status updated successfully:', invoice_id, '→', status)

    // Create activity log entry (for audit trail)
    const logActivity = async () => {
      try {
        const logSQL = `
          INSERT INTO order_activity_log (invoice_id, activity_type, description, created_at)
          VALUES (?, 'status_change', ?, NOW())
          ON DUPLICATE KEY UPDATE
            invoice_id = invoice_id
        `
        await query(logSQL, [
          invoice_id,
          `Status changed to ${status}${notes ? ` with notes: ${notes}` : ''}`
        ])
      } catch (logError) {
        console.warn('Could not log activity:', logError)
      }
    }

    // Log activity in background
    logActivity()

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        order: {
          id: `#${order.Invoice_Id}`,
          invoice_id: order.Invoice_Id,
          status: order.status,
          notes: order.notes,
          estimated_completion: order.estimated_completion,
          updated_at: order.updated_at,
          updated_by: order.updated_by,
          
          // Order details
          total: parseFloat(order.Harga_Total),
          total_items: parseInt(order.total_items) || 0,
          menu_items: order.menu_items || '',
          restaurant_name: order.nama_restaurant || 'Unknown Restaurant',
          minutes_since_order: parseInt(order.minutes_since_order) || 0
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error updating order status:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to update order status",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Bulk status update for multiple orders
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📝 Bulk updating order statuses...')
    const body: BulkStatusUpdate = await request.json()

    const { updates } = body

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Updates array is required" 
      }, { status: 400 })
    }

    // Validate all updates first
    const validStatuses = ['pending', 'in-progress', 'ready', 'completed', 'cancelled']
    for (const update of updates) {
      if (!update.invoice_id || !update.status) {
        return NextResponse.json({ 
          success: false,
          error: "Each update must have invoice_id and status" 
        }, { status: 400 })
      }
      
      if (!validStatuses.includes(update.status)) {
        return NextResponse.json({ 
          success: false,
          error: `Invalid status: ${update.status}. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Ensure status table exists
    await createOrderStatusTable()

    const results = []
    const errors = []

    // Process each update
    for (const update of updates) {
      try {
        // Check if order exists
        const orderCheckSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`
        const existingOrder = await query(orderCheckSQL, [update.invoice_id])
        
        if (!existingOrder || existingOrder.length === 0) {
          errors.push({
            invoice_id: update.invoice_id,
            error: "Order not found"
          })
          continue
        }

        // Update status
        const upsertStatusSQL = `
          INSERT INTO order_status (invoice_id, status, notes, estimated_completion, updated_by)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            notes = VALUES(notes),
            estimated_completion = VALUES(estimated_completion),
            updated_at = CURRENT_TIMESTAMP,
            updated_by = VALUES(updated_by)
        `

        await query(upsertStatusSQL, [
          update.invoice_id,
          update.status,
          update.notes || null,
          update.estimated_completion || null,
          'bulk_api_user'
        ])

        results.push({
          invoice_id: update.invoice_id,
          status: update.status,
          success: true,
          updated_at: new Date().toISOString()
        })

      } catch (error) {
        errors.push({
          invoice_id: update.invoice_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Bulk update completed: ${results.length} successful, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      message: `Bulk update completed: ${results.length} successful, ${errors.length} errors`,
      data: {
        successful_updates: results,
        errors: errors,
        summary: {
          total_updates: updates.length,
          successful: results.length,
          failed: errors.length,
          success_rate: Math.round((results.length / updates.length) * 100)
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error in bulk status update:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to perform bulk status update",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Reset/clear order status (back to default calculated status)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🗑️ Resetting order status...')
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoice_id")

    if (!invoiceId) {
      return NextResponse.json({ 
        success: false,
        error: "Invoice ID is required" 
      }, { status: 400 })
    }

    // Check if order exists
    const orderCheckSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(orderCheckSQL, [invoiceId])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    // Ensure status table exists
    await createOrderStatusTable()

    // Delete status record (will fall back to calculated status)
    const deleteStatusSQL = `DELETE FROM order_status WHERE invoice_id = ?`
    await query(deleteStatusSQL, [invoiceId])

    console.log('✅ Order status reset successfully:', invoiceId)

    return NextResponse.json({
      success: true,
      message: "Order status reset to system calculated default",
      data: {
        invoice_id: invoiceId,
        status: 'reset_to_default',
        reset_at: new Date().toISOString(),
        note: 'Status will now be calculated automatically based on order timing'
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error resetting order status:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to reset order status",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}