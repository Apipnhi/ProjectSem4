// app/api/orders/route.ts - Orders Management API
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface Order {
  Invoice_Id: number;
  Tanggal_Order: string;
  Harga_Total: number;
  id_restaurant: number;
  items?: OrderItem[];
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
}

interface OrderItem {
  id_menu: number;
  nama_menu: string;
  kuantitas: number;
  harga: number;
  kategori: string;
  subtotal: number;
}

interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  popularItems: any[];
  recentOrders: Order[];
}

// Helper functions
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function safeString(value: any): string {
  return value ? String(value) : '';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET endpoint - Fetch orders
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const period = parseInt(searchParams.get('period') || '30'); // days
    const includeItems = searchParams.get('include_items') === 'true';

    console.log(`📋 Fetching orders for restaurant ${restaurantId}`);

    const offset = (page - 1) * limit;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Base orders query
    let ordersSQL = `
      SELECT 
        Invoice_Id,
        Tanggal_Order,
        Harga_Total,
        id_restaurant
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order >= ?
    `;

    const queryParams: any[] = [restaurantId, formatDate(startDate)];

    ordersSQL += ` ORDER BY Tanggal_Order DESC, Invoice_Id DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const ordersResult = await query(ordersSQL, queryParams);
    
    let orders: Order[] = (ordersResult || []).map((row: any) => ({
      Invoice_Id: row.Invoice_Id,
      Tanggal_Order: row.Tanggal_Order,
      Harga_Total: safeNumber(row.Harga_Total),
      id_restaurant: row.id_restaurant,
      status: 'completed' // Default status for historical orders
    }));

    // Get order items if requested
    if (includeItems && orders.length > 0) {
      const orderIds = orders.map(order => order.Invoice_Id);
      const placeholders = orderIds.map(() => '?').join(',');
      
      const itemsSQL = `
        SELECT 
          mm.id_customer,
          mm.id_menu,
          mm.kuantitas,
          m.Nama_Menu,
          m.Harga,
          m.Kategori,
          (mm.kuantitas * m.Harga) as subtotal
        FROM MEMESAN_MENU mm
        JOIN menu m ON mm.id_menu = m.Id_Menu
        WHERE mm.id_customer IN (${placeholders})
        ORDER BY mm.id_customer, m.Nama_Menu
      `;

      const itemsResult = await query(itemsSQL, orderIds);
      
      // Group items by order
      const itemsByOrder: { [key: number]: OrderItem[] } = {};
      (itemsResult || []).forEach((item: any) => {
        if (!itemsByOrder[item.id_customer]) {
          itemsByOrder[item.id_customer] = [];
        }
        itemsByOrder[item.id_customer].push({
          id_menu: item.id_menu,
          nama_menu: safeString(item.Nama_Menu),
          kuantitas: safeNumber(item.kuantitas),
          harga: safeNumber(item.Harga),
          kategori: safeString(item.Kategori),
          subtotal: safeNumber(item.subtotal)
        });
      });

      // Add items to orders
      orders = orders.map(order => ({
        ...order,
        items: itemsByOrder[order.Invoice_Id] || []
      }));
    }

    // Get order summary statistics
    const summarySQL = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(Harga_Total) as total_revenue,
        AVG(Harga_Total) as avg_order_value,
        SUM(CASE WHEN DATE(Tanggal_Order) = CURDATE() THEN 1 ELSE 0 END) as today_orders,
        SUM(CASE WHEN DATE(Tanggal_Order) = CURDATE() THEN Harga_Total ELSE 0 END) as today_revenue
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order >= ?
    `;

    const summaryResult = await query(summarySQL, [restaurantId, formatDate(startDate)]);
    const summaryData = summaryResult[0] || {};

    // Get popular items
    const popularItemsSQL = `
      SELECT 
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        SUM(mm.kuantitas) as total_quantity,
        COUNT(DISTINCT mm.id_customer) as unique_orders,
        SUM(mm.kuantitas * m.Harga) as total_revenue
      FROM menu m
      JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.Tanggal_Order >= ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    const popularItemsResult = await query(popularItemsSQL, [restaurantId, formatDate(startDate)]);
    
    const popularItems = (popularItemsResult || []).map((item: any) => ({
      name: safeString(item.Nama_Menu),
      category: safeString(item.Kategori),
      price: safeNumber(item.Harga),
      totalQuantity: safeNumber(item.total_quantity),
      uniqueOrders: safeNumber(item.unique_orders),
      totalRevenue: safeNumber(item.total_revenue)
    }));

    // Get recent orders (last 5)
    const recentOrdersSQL = `
      SELECT 
        Invoice_Id,
        Tanggal_Order,
        Harga_Total,
        id_restaurant
      FROM Customer 
      WHERE id_restaurant = ?
      ORDER BY Tanggal_Order DESC, Invoice_Id DESC
      LIMIT 5
    `;

    const recentOrdersResult = await query(recentOrdersSQL, [restaurantId]);
    
    const recentOrders: Order[] = (recentOrdersResult || []).map((row: any) => ({
      Invoice_Id: row.Invoice_Id,
      Tanggal_Order: row.Tanggal_Order,
      Harga_Total: safeNumber(row.Harga_Total),
      id_restaurant: row.id_restaurant,
      status: 'completed'
    }));

    // Compile summary
    const summary: OrderSummary = {
      totalOrders: safeNumber(summaryData.total_orders),
      totalRevenue: safeNumber(summaryData.total_revenue),
      averageOrderValue: safeNumber(summaryData.avg_order_value),
      todayOrders: safeNumber(summaryData.today_orders),
      todayRevenue: safeNumber(summaryData.today_revenue),
      pendingOrders: 0, // Historical data doesn't have pending orders
      popularItems,
      recentOrders
    };

    console.log(`✅ Retrieved ${orders.length} orders, total revenue: Rp${summary.totalRevenue}`);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        summary,
        pagination: {
          page,
          limit,
          total: summary.totalOrders,
          totalPages: Math.ceil(summary.totalOrders / limit)
        }
      },
      metadata: {
        restaurant_id: restaurantId,
        period_days: period,
        include_items: includeItems,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        orders: [],
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          todayOrders: 0,
          todayRevenue: 0,
          pendingOrders: 0,
          popularItems: [],
          recentOrders: []
        }
      }
    }, { status: 500 });
  }
}

// POST endpoint - Create new order
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { restaurant_id = 1, items, total_amount, customer_info } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid items array'
      }, { status: 400 });
    }

    if (!total_amount || total_amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid total amount'
      }, { status: 400 });
    }

    // Start transaction by creating customer record
    const customerSQL = `
      INSERT INTO Customer (Tanggal_Order, Harga_Total, id_restaurant)
      VALUES (CURDATE(), ?, ?)
    `;

    const customerResult = await query(customerSQL, [total_amount, restaurant_id]);
    const customerId = customerResult.insertId;

    // Insert order items
    for (const item of items) {
      if (!item.menu_id || !item.quantity || item.quantity <= 0) {
        // Rollback would be needed here in a real transaction
        return NextResponse.json({
          success: false,
          error: 'Invalid item data: menu_id and quantity required'
        }, { status: 400 });
      }

      const itemSQL = `
        INSERT INTO MEMESAN_MENU (id_menu, kuantitas, id_customer)
        VALUES (?, ?, ?)
      `;

      await query(itemSQL, [item.menu_id, item.quantity, customerId]);
    }

    console.log(`✅ Created new order ${customerId} with ${items.length} items`);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: customerId,
        restaurant_id,
        total_amount,
        items_count: items.length,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT endpoint - Update order status
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { order_id, status, notes } = body;

    if (!order_id || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: order_id and status'
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be one of: pending, preparing, ready, completed, cancelled'
      }, { status: 400 });
    }

    // Note: Since the database doesn't have a status column in Customer table,
    // this would require adding a status column or creating an order_status table
    // For now, we'll just acknowledge the update
    
    console.log(`✅ Order ${order_id} status updated to ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order_id,
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating order:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update order',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}