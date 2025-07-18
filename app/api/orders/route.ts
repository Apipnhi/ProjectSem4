// app/api/orders/route.ts - Enhanced with comprehensive order management
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
  customer_name?: string;
  order_type?: 'dine-in' | 'takeout' | 'delivery';
  payment_method?: 'cash' | 'card' | 'digital';
  notes?: string;
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
    const orderType = searchParams.get("order_type")
    const searchTerm = searchParams.get("search")

    // Build comprehensive ALL TIME orders query
    let whereConditions: string[] = []
    
    if (restaurantId) {
      whereConditions.push(`c.id_restaurant = ${parseInt(restaurantId)}`)
    }

    // Add search functionality
    if (searchTerm) {
      whereConditions.push(`(c.Invoice_Id LIKE '%${searchTerm}%' OR m.Nama_Menu LIKE '%${searchTerm}%')`)
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
        GROUP_CONCAT(DISTINCT CONCAT(m.Nama_Menu, ' (', mm.kuantitas, ')') SEPARATOR ', ') as menu_items,
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
        
        -- REVENUE ANALYSIS
        (SELECT SUM(c4.Harga_Total) 
         FROM Customer c4 
         WHERE c4.id_restaurant = c.id_restaurant 
           AND DATE(c4.Tanggal_Order) = DATE(c.Tanggal_Order)) as daily_restaurant_revenue,
        
        -- MENU PERFORMANCE
        (SELECT GROUP_CONCAT(DISTINCT CONCAT(m2.Nama_Menu, ':', m2.Harga) SEPARATOR '|')
         FROM MEMESAN_MENU mm2
         JOIN menu m2 ON mm2.id_menu = m2.Id_Menu
         WHERE mm2.id_customer = c.Invoice_Id) as detailed_items,
         
        -- ORDER STATUS SIMULATION (since no status field in Customer table)
        CASE 
          WHEN DATEDIFF(NOW(), c.Tanggal_Order) > 1 THEN 'completed'
          WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 2 THEN 'completed'
          WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 1 THEN 'ready'
          WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 0 THEN 'in-progress'
          ELSE 'pending'
        END as calculated_status
        
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant
      ORDER BY c.Tanggal_Order DESC, c.Invoice_Id DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    // Get total count
    const countSQL = `
      SELECT COUNT(DISTINCT c.Invoice_Id) as total
      FROM Customer c
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
    `

    const [orders, countResult] = await Promise.all([
      query(ordersSQL),
      query(countSQL)
    ])

    const total = countResult[0]?.total || 0

    console.log(`✅ Found ${orders.length} orders out of ${total} total`)

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map((order: any) => ({
          id: `#${order.Invoice_Id}`,
          invoice_id: order.Invoice_Id,
          customer: order.Invoice_Id < 100 ? `Table ${order.Invoice_Id % 10}` : `Customer ${order.Invoice_Id}`,
          date: order.Tanggal_Order,
          total: parseFloat(order.Harga_Total),
          restaurant_id: order.id_restaurant,
          restaurant_name: order.nama_restaurant || 'Unknown Restaurant',
          total_items: parseInt(order.total_items) || 0,
          total_quantity: parseInt(order.total_quantity) || 0,
          menu_items: order.menu_items || '',
          previous_orders: parseInt(order.previous_orders) || 0,
          status: status || order.calculated_status || 'completed',
          
          // Enhanced fields for frontend
          items: order.detailed_items ? 
            order.detailed_items.split('|').map((item: string) => {
              const [name, price] = item.split(':');
              return { name, price: parseFloat(price) || 0 };
            }) : [],
          
          // Time analysis
          time: order.Tanggal_Order ? new Date(order.Tanggal_Order).toLocaleString() : '',
          order_hour: parseInt(order.order_hour) || 0,
          order_day: parseInt(order.order_day_of_week) || 1,
          
          // Performance metrics
          vs_restaurant_avg: parseFloat(order.order_value_vs_restaurant_avg) || 1,
          daily_restaurant_revenue: parseFloat(order.daily_restaurant_revenue) || 0,
          
          // Categorization for frontend
          order_size: parseFloat(order.Harga_Total) > 75000 ? 'large' : 
                     parseFloat(order.Harga_Total) > 45000 ? 'medium' : 'small',
          order_time_period: order.order_hour < 12 ? 'morning' : 
                           order.order_hour < 17 ? 'afternoon' : 'evening',
          
          // Order type simulation based on amount and items
          type: parseFloat(order.Harga_Total) > 80000 ? 'delivery' :
                parseInt(order.total_items) > 3 ? 'dine-in' : 'takeout'
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

    const { customer_data, items, customer_name, order_type, payment_method, notes } = body

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

    // Check if Invoice_Id already exists
    const existingOrderSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(existingOrderSQL, [customer_data.Invoice_Id])
    
    if (existingOrder && existingOrder.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order with this Invoice ID already exists",
        code: 'DUPLICATE_ORDER'
      }, { status: 409 })
    }

    // Validate menu items exist
    const menuIds = items.map(item => item.id_menu)
    const menuCheckSQL = `
      SELECT Id_Menu, Nama_Menu, Harga, Status 
      FROM menu 
      WHERE Id_Menu IN (${menuIds.join(',')}) AND Status = 1
    `
    const validMenus = await query(menuCheckSQL)
    
    if (validMenus.length !== menuIds.length) {
      return NextResponse.json({ 
        success: false,
        error: "One or more menu items are invalid or unavailable" 
      }, { status: 400 })
    }

    // Calculate total from database prices (verification)
    let calculatedTotal = 0
    for (const item of items) {
      const menu = validMenus.find((m: any) => m.Id_Menu === item.id_menu)
      if (menu) {
        calculatedTotal += menu.Harga * item.kuantitas
      }
    }

    // Verify total matches (allow 5% variance for tax/service charge)
    const totalDifference = Math.abs(calculatedTotal - customer_data.Harga_Total)
    const allowedVariance = calculatedTotal * 0.05
    
    if (totalDifference > allowedVariance) {
      console.warn(`Total mismatch: calculated ${calculatedTotal}, provided ${customer_data.Harga_Total}`)
    }

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
        SUM(mm.kuantitas) as total_quantity,
        GROUP_CONCAT(CONCAT(m.Nama_Menu, ' (', mm.kuantitas, ')') SEPARATOR ', ') as items_list
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
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
          id: `#${order.Invoice_Id}`,
          invoice_id: order.Invoice_Id,
          date: order.Tanggal_Order,
          total: parseFloat(order.Harga_Total),
          restaurant_id: order.id_restaurant,
          restaurant_name: order.nama_restaurant,
          total_items: parseInt(order.total_items),
          total_quantity: parseInt(order.total_quantity),
          status: 'pending',
          customer: customer_name || `Customer ${order.Invoice_Id}`,
          type: order_type || 'dine-in',
          payment_method: payment_method || 'cash',
          notes: notes || '',
          items_list: order.items_list,
          items: items.map(item => {
            const menu = validMenus.find((m: any) => m.Id_Menu === item.id_menu)
            return {
              id_menu: item.id_menu,
              name: menu?.Nama_Menu || 'Unknown Item',
              quantity: item.kuantitas,
              price: menu?.Harga || 0
            }
          })
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
    console.log('📝 Updating order...')
    const body = await request.json()
    const { invoice_id, customer_data, items } = body

    if (!invoice_id) {
      return NextResponse.json({ 
        success: false,
        error: "Invoice ID is required for update" 
      }, { status: 400 })
    }

    // Check if order exists
    const checkSQL = `SELECT Invoice_Id, id_restaurant FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(checkSQL, [invoice_id])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    // Update customer data if provided
    if (customer_data) {
      const updateFields = []
      const updateValues = []

      if (customer_data.Harga_Total !== undefined) {
        updateFields.push('Harga_Total = ?')
        updateValues.push(customer_data.Harga_Total)
      }

      if (updateFields.length > 0) {
        updateValues.push(invoice_id)
        const updateSQL = `UPDATE Customer SET ${updateFields.join(', ')} WHERE Invoice_Id = ?`
        await query(updateSQL, updateValues)
      }
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await query(`DELETE FROM MEMESAN_MENU WHERE id_customer = ?`, [invoice_id])
      
      // Insert new items
      for (const item of items) {
        if (item.id_menu && item.kuantitas && item.kuantitas > 0) {
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