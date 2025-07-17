// app/api/orders/route.ts - Fixed with proper database functions
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Interface untuk Order data
interface Order {
  Invoice_Id: string;
  Tanggal_Order: string;
  Harga_Total: number;
  id_restaurant: number;
  status?: string;
}

interface OrderItem {
  id_menu: number;
  kuantitas: number;
  nama_menu?: string;
  harga?: number;
}

interface CreateOrderRequest {
  customer_data: {
    Invoice_Id: string;
    id_restaurant: number;
    Harga_Total: number;
  };
  items: OrderItem[];
}

// GET all orders with comprehensive data using ALL TIME records
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Fetching comprehensive orders data...');

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const restaurantId = searchParams.get("restaurant_id")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    // Build comprehensive ALL TIME orders query
    let whereConditions: string[] = []
    
    if (status && status !== 'all') {
      // Map status untuk compatibility dengan database
      const statusMapping: { [key: string]: string } = {
        'pending': 'pending',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'processing': 'processing'
      }
      const dbStatus = statusMapping[status] || status
      whereConditions.push(`'${dbStatus}' = '${dbStatus}'`) // Placeholder karena tidak ada status field di Customer table
    }

    if (restaurantId) {
      whereConditions.push(`c.id_restaurant = ${parseInt(restaurantId)}`)
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : ''

    // Comprehensive orders query with ALL TIME data
    const ordersSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        
        -- ORDER ITEMS COUNT AND DETAILS
        COUNT(DISTINCT mm.id_menu) as total_items,
        GROUP_CONCAT(DISTINCT m.Nama_Menu SEPARATOR ', ') as menu_items,
        SUM(mm.kuantitas) as total_quantity,
        
        -- CUSTOMER ANALYSIS
        (SELECT COUNT(*) 
         FROM Customer c2 
         WHERE c2.Invoice_Id = c.Invoice_Id 
           AND c2.Tanggal_Order < c.Tanggal_Order) as previous_orders,
        
        -- RESTAURANT PERFORMANCE METRICS
        c.Harga_Total / NULLIF((
          SELECT AVG(c3.Harga_Total) 
          FROM Customer c3 
          WHERE c3.id_restaurant = c.id_restaurant
        ), 0) as order_value_vs_restaurant_avg,
        
        -- ORDER TIMING ANALYSIS
        HOUR(c.Tanggal_Order) as order_hour,
        DAYOFWEEK(c.Tanggal_Order) as order_day_of_week,
        
        -- STATUS PLACEHOLDER (untuk compatibility)
        CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent'
          WHEN c.Tanggal_Order >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'completed'
          ELSE 'archived'
        END as status
        
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant
      ORDER BY c.Tanggal_Order DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    console.log('📊 Executing comprehensive orders query...')
    const orders = await query(ordersSQL)

    // Get total count for pagination
    const countSQL = `
      SELECT COUNT(DISTINCT c.Invoice_Id) as total
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      ${whereClause}
    `
    
    const totalResult = await query(countSQL)
    const total = totalResult[0]?.total || 0

    console.log(`✅ Found ${orders.length} orders out of ${total} total`)

    return NextResponse.json({ 
      success: true,
      data: {
        orders: orders.map((order: any) => ({
          id: order.Invoice_Id,
          invoice_id: order.Invoice_Id,
          date: order.Tanggal_Order,
          total: parseFloat(order.Harga_Total),
          restaurant_id: order.id_restaurant,
          restaurant_name: order.nama_restaurant,
          status: order.status,
          total_items: parseInt(order.total_items || 0),
          total_quantity: parseInt(order.total_quantity || 0),
          menu_items: order.menu_items,
          previous_orders: parseInt(order.previous_orders || 0),
          order_value_ratio: parseFloat(order.order_value_vs_restaurant_avg || 1),
          order_hour: order.order_hour,
          order_day: order.order_day_of_week,
          // Calculated fields
          is_repeat_customer: (order.previous_orders || 0) > 0,
          order_size: order.total_quantity > 5 ? 'large' : order.total_quantity > 2 ? 'medium' : 'small',
          order_time_period: order.order_hour < 12 ? 'morning' : order.order_hour < 17 ? 'afternoon' : 'evening'
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + orders.length) < total
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error fetching orders:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch orders",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create a new order with comprehensive data tracking
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📝 Creating new order...')
    const body: CreateOrderRequest = await request.json()

    // Validate required fields
    if (!body.customer_data || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields: customer_data and items are required" 
      }, { status: 400 })
    }

    const { customer_data, items } = body

    // Validate customer data
    if (!customer_data.Invoice_Id || !customer_data.id_restaurant || !customer_data.Harga_Total) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required customer data: Invoice_Id, id_restaurant, and Harga_Total" 
      }, { status: 400 })
    }

    // Validate items
    for (const item of items) {
      if (!item.id_menu || !item.kuantitas || item.kuantitas <= 0) {
        return NextResponse.json({ 
          success: false,
          error: "Invalid item data: each item must have id_menu and kuantitas > 0" 
        }, { status: 400 })
      }
    }

    // Begin transaction-like operations
    console.log('💾 Inserting customer order...')

    // Insert customer order
    const customerSQL = `
      INSERT INTO Customer (Invoice_Id, Tanggal_Order, Harga_Total, id_restaurant)
      VALUES (?, NOW(), ?, ?)
    `
    
    await query(customerSQL, [
      customer_data.Invoice_Id,
      customer_data.Harga_Total,
      customer_data.id_restaurant
    ])

    // Insert order items
    console.log('📦 Inserting order items...')
    
    for (const item of items) {
      const itemSQL = `
        INSERT INTO MEMESAN_MENU (id_customer, id_menu, kuantitas)
        VALUES (?, ?, ?)
      `
      
      await query(itemSQL, [
        customer_data.Invoice_Id,
        item.id_menu,
        item.kuantitas
      ])
    }

    // Get the created order details for response
    const orderDetailsSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        COUNT(mm.id_menu) as total_items,
        SUM(mm.kuantitas) as total_quantity
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      WHERE c.Invoice_Id = ?
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant
    `
    
    const orderDetails = await query(orderDetailsSQL, [customer_data.Invoice_Id])
    const order = orderDetails[0]

    console.log('✅ Order created successfully:', customer_data.Invoice_Id)

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: {
        order: {
          id: order.Invoice_Id,
          invoice_id: order.Invoice_Id,
          date: order.Tanggal_Order,
          total: parseFloat(order.Harga_Total),
          restaurant_id: order.id_restaurant,
          restaurant_name: order.nama_restaurant,
          total_items: parseInt(order.total_items),
          total_quantity: parseInt(order.total_quantity),
          status: 'completed',
          items: items
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating order:", error)
    
    // Check for duplicate key error
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ 
        success: false,
        error: "Order with this Invoice ID already exists",
        code: 'DUPLICATE_ORDER'
      }, { status: 409 })
    }

    return NextResponse.json({ 
      success: false,
      error: "Failed to create order",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update an existing order
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('✏️ Updating order...')
    const body = await request.json()
    const { invoice_id, status, items } = body

    if (!invoice_id) {
      return NextResponse.json({ 
        success: false,
        error: "Invoice ID is required for updates" 
      }, { status: 400 })
    }

    // Check if order exists
    const checkSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(checkSQL, [invoice_id])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await query(`DELETE FROM MEMESAN_MENU WHERE id_customer = ?`, [invoice_id])
      
      // Insert new items
      for (const item of items) {
        if (item.id_menu && item.kuantitas > 0) {
          await query(
            `INSERT INTO MEMESAN_MENU (id_customer, id_menu, kuantitas) VALUES (?, ?, ?)`,
            [invoice_id, item.id_menu, item.kuantitas]
          )
        }
      }
    }

    console.log('✅ Order updated successfully:', invoice_id)

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: { invoice_id }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error updating order:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to update order",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove an order
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🗑️ Deleting order...')
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoice_id")

    if (!invoiceId) {
      return NextResponse.json({ 
        success: false,
        error: "Invoice ID is required for deletion" 
      }, { status: 400 })
    }

    // Check if order exists
    const checkSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(checkSQL, [invoiceId])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    // Delete order items first (foreign key constraint)
    await query(`DELETE FROM MEMESAN_MENU WHERE id_customer = ?`, [invoiceId])
    
    // Delete customer order
    await query(`DELETE FROM Customer WHERE Invoice_Id = ?`, [invoiceId])

    console.log('✅ Order deleted successfully:', invoiceId)

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      data: { invoice_id: invoiceId }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error deleting order:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete order",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}