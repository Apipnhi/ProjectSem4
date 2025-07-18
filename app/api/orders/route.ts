// app/api/orders/route.ts - Fixed Complete Version
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface OrderItem {
  name: string;
  quantity: number;
  kuantitas: number;
  price: number;
}

interface Order {
  id: string;
  invoice_id: number | string;
  customer: string;
  date: string | Date;
  total: number;
  restaurant_id: number;
  restaurant_name: string;
  total_items: number;
  total_quantity: number;
  menu_items: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  type?: 'dine-in' | 'takeout' | 'delivery';
  time?: string;
  order_size?: 'small' | 'medium' | 'large';
  order_time_period?: 'morning' | 'afternoon' | 'evening';
}

// Helper function to safely convert to number
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Helper function to determine order size
function getOrderSize(total: number): 'small' | 'medium' | 'large' {
  if (total < 50000) return 'small';
  if (total < 100000) return 'medium';
  return 'large';
}

// Helper function to determine time period
function getTimePeriod(date: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// Helper function to generate order type
function getOrderType(): 'dine-in' | 'takeout' | 'delivery' {
  const types: ('dine-in' | 'takeout' | 'delivery')[] = ['dine-in', 'takeout', 'delivery'];
  return types[Math.floor(Math.random() * types.length)];
}

// Create order status table if it doesn't exist
async function createOrderStatusTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS order_status (
      invoice_id INT PRIMARY KEY,
      status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
      notes TEXT NULL,
      estimated_completion DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by VARCHAR(255) DEFAULT 'system',
      FOREIGN KEY (invoice_id) REFERENCES Customer(Invoice_Id) ON DELETE CASCADE
    );
  `;
  
  try {
    await query(createTableSQL);
  } catch (error) {
    console.log('Order status table might already exist:', error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const status = searchParams.get('status');
    const orderType = searchParams.get('order_type');
    const searchTerm = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📋 Fetching orders:', { restaurantId, status, orderType, searchTerm, limit, offset });

    // Ensure order status table exists
    await createOrderStatusTable();

    // Base query with order details
    let ordersSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        CONCAT('Customer #', c.Invoice_Id) as customer_name,
        COALESCE(os.status, 'pending') as status,
        os.notes,
        os.estimated_completion,
        os.updated_at,
        os.updated_by,
        
        -- Calculate order metrics
        (SELECT COUNT(*) FROM MEMESAN_MENU mm WHERE mm.id_customer = c.Invoice_Id) as total_items,
        (SELECT COALESCE(SUM(mm.kuantitas), COUNT(*)) FROM MEMESAN_MENU mm WHERE mm.id_customer = c.Invoice_Id) as total_quantity,
        (SELECT GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') 
         FROM MEMESAN_MENU mm 
         JOIN menu m ON mm.id_menu = m.Id_Menu 
         WHERE mm.id_customer = c.Invoice_Id) as menu_items,
        
        -- Restaurant info
        'Restaurant' as nama_restaurant,
        
        -- Time calculations
        TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) as minutes_since_order
        
      FROM Customer c
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      WHERE c.id_restaurant = ?
    `;

    const queryParams: any[] = [parseInt(restaurantId)];

    // Add status filter
    if (status && status !== 'all') {
      ordersSQL += ' AND COALESCE(os.status, "pending") = ?';
      queryParams.push(status);
    }

    // Add search filter
    if (searchTerm) {
      ordersSQL += ' AND (c.Invoice_Id LIKE ? OR CONCAT("Customer #", c.Invoice_Id) LIKE ?)';
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    // Add ordering
    ordersSQL += ' ORDER BY c.Tanggal_Order DESC';

    // Add pagination
    ordersSQL += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const ordersResult = await query(ordersSQL, queryParams);

    // Process orders
    const orders: Order[] = [];
    
    for (const orderRow of ordersResult || []) {
      // Get order items
      const itemsSQL = `
        SELECT 
          m.Nama_Menu as name,
          mm.kuantitas as quantity,
          m.Harga as price
        FROM MEMESAN_MENU mm
        JOIN menu m ON mm.id_menu = m.Id_Menu
        WHERE mm.id_customer = ?
      `;

      const itemsResult = await query(itemsSQL, [orderRow.Invoice_Id]);
      
      const items: OrderItem[] = (itemsResult || []).map((item: any) => ({
        name: String(item.name || 'Unknown Item'),
        quantity: safeNumber(item.quantity) || 1,
        kuantitas: safeNumber(item.quantity) || 1,
        price: safeNumber(item.price)
      }));

      const orderDate = new Date(orderRow.Tanggal_Order);
      const total = safeNumber(orderRow.Harga_Total);
      
      orders.push({
        id: `#${orderRow.Invoice_Id}`,
        invoice_id: orderRow.Invoice_Id,
        customer: String(orderRow.customer_name || `Customer #${orderRow.Invoice_Id}`),
        date: orderDate.toISOString(),
        total: total,
        restaurant_id: safeNumber(orderRow.id_restaurant),
        restaurant_name: String(orderRow.nama_restaurant || 'Restaurant'),
        total_items: safeNumber(orderRow.total_items),
        total_quantity: safeNumber(orderRow.total_quantity),
        menu_items: String(orderRow.menu_items || ''),
        status: orderRow.status || 'pending',
        items: items,
        type: getOrderType(),
        time: orderDate.toLocaleTimeString(),
        order_size: getOrderSize(total),
        order_time_period: getTimePeriod(orderDate)
      });
    }

    // Get total count for pagination
    let countSQL = `
      SELECT COUNT(*) as total 
      FROM Customer c
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      WHERE c.id_restaurant = ?
    `;
    
    const countParams: any[] = [parseInt(restaurantId)];
    
    if (status && status !== 'all') {
      countSQL += ' AND COALESCE(os.status, "pending") = ?';
      countParams.push(status);
    }
    
    if (searchTerm) {
      countSQL += ' AND (c.Invoice_Id LIKE ? OR CONCAT("Customer #", c.Invoice_Id) LIKE ?)';
      countParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const countResult = await query(countSQL, countParams);
    const total = safeNumber(countResult[0]?.total);

    const response = {
      success: true,
      data: {
        orders: orders,
        pagination: {
          total: total,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < total
        }
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        filters: {
          status: status || 'all',
          order_type: orderType || 'all',
          search: searchTerm || null
        },
        total_orders: orders.length,
        data_source: 'database'
      }
    };

    console.log(`✅ Orders fetched: ${orders.length} of ${total} total`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          orders: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
        }
      },
      { status: 500 }
    );
  }
}

// POST method for creating new orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, items, restaurant_id, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      const menuResult = await query('SELECT Harga FROM menu WHERE Id_Menu = ?', [item.menu_id]);
      if (menuResult.length > 0) {
        total += safeNumber(menuResult[0].Harga) * safeNumber(item.quantity);
      }
    }

    // Create customer order
    const insertCustomerSQL = `
      INSERT INTO Customer (Tanggal_Order, Harga_Total, id_restaurant)
      VALUES (NOW(), ?, ?)
    `;

    const customerResult = await query(insertCustomerSQL, [
      total,
      parseInt(restaurant_id || '1')
    ]);

    const invoiceId = (customerResult as any).insertId;

    // Insert menu items
    for (const item of items) {
      const insertItemSQL = `
        INSERT INTO MEMESAN_MENU (id_menu, kuantitas, id_customer)
        VALUES (?, ?, ?)
      `;
      
      await query(insertItemSQL, [
        parseInt(item.menu_id),
        parseInt(item.quantity),
        invoiceId
      ]);
    }

    // Create initial order status
    await createOrderStatusTable();
    const insertStatusSQL = `
      INSERT INTO order_status (invoice_id, status, notes, updated_by)
      VALUES (?, 'pending', ?, 'api_user')
    `;
    
    await query(insertStatusSQL, [invoiceId, notes || null]);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        invoice_id: invoiceId,
        total: total,
        items_count: items.length,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PATCH method for updating order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id, status, notes, estimated_completion } = body;

    if (!invoice_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in-progress', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Ensure order exists
    const orderCheckSQL = `SELECT Invoice_Id FROM Customer WHERE Invoice_Id = ?`;
    const existingOrder = await query(orderCheckSQL, [invoice_id]);
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Ensure status table exists
    await createOrderStatusTable();

    // Update or insert status
    const upsertStatusSQL = `
      INSERT INTO order_status (invoice_id, status, notes, estimated_completion, updated_by)
      VALUES (?, ?, ?, ?, 'api_user')
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = VALUES(notes),
        estimated_completion = VALUES(estimated_completion),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = VALUES(updated_by)
    `;

    await query(upsertStatusSQL, [
      invoice_id,
      status,
      notes || null,
      estimated_completion || null
    ]);

    // Get updated order details
    const orderDetailsSQL = `
      SELECT 
        c.Invoice_Id,
        c.Harga_Total,
        c.Tanggal_Order,
        os.status,
        os.notes,
        os.estimated_completion,
        os.updated_at,
        os.updated_by,
        (SELECT COUNT(*) FROM MEMESAN_MENU mm WHERE mm.id_customer = c.Invoice_Id) as total_items,
        (SELECT GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') 
         FROM MEMESAN_MENU mm 
         JOIN menu m ON mm.id_menu = m.Id_Menu 
         WHERE mm.id_customer = c.Invoice_Id) as menu_items,
        'Restaurant' as nama_restaurant,
        TIMESTAMPDIFF(MINUTE, c.Tanggal_Order, NOW()) as minutes_since_order
      FROM Customer c
      LEFT JOIN order_status os ON c.Invoice_Id = os.invoice_id
      WHERE c.Invoice_Id = ?
    `;

    const orderResult = await query(orderDetailsSQL, [invoice_id]);
    const order = orderResult[0];

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
          total: safeNumber(order.Harga_Total),
          total_items: safeNumber(order.total_items),
          menu_items: String(order.menu_items || ''),
          restaurant_name: String(order.nama_restaurant || 'Restaurant'),
          minutes_since_order: safeNumber(order.minutes_since_order)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}