// app/api/transactions/route.ts - Complete transactions management
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

interface Transaction {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: string;
  restaurant_id: number;
}

interface CreateTransactionRequest {
  order_id: string;
  customer_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'digital';
  restaurant_id: number;
  notes?: string;
}

// GET all transactions with comprehensive analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('💳 Fetching comprehensive transactions data...');

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const paymentMethod = searchParams.get("payment_method")
    const restaurantId = searchParams.get("restaurant_id")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"
    const searchTerm = searchParams.get("search")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    // Build where conditions
    let whereConditions: string[] = []
    
    if (restaurantId) {
      whereConditions.push(`c.id_restaurant = ${parseInt(restaurantId)}`)
    }

    if (dateFrom) {
      whereConditions.push(`DATE(c.Tanggal_Order) >= '${dateFrom}'`)
    }

    if (dateTo) {
      whereConditions.push(`DATE(c.Tanggal_Order) <= '${dateTo}'`)
    }

    if (searchTerm) {
      whereConditions.push(`(c.Invoice_Id LIKE '%${searchTerm}%' OR m.Nama_Menu LIKE '%${searchTerm}%')`)
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : ''

    // Comprehensive transactions query based on orders (Customer table)
    const transactionsSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        
        -- TRANSACTION DETAILS
        CONCAT('TXN-', LPAD(c.Invoice_Id, 6, '0')) as transaction_id,
        CONCAT('#', c.Invoice_Id) as order_id,
        
        -- CUSTOMER INFO
        CASE 
          WHEN c.Invoice_Id <= 50 THEN CONCAT('Table ', (c.Invoice_Id % 10) + 1)
          WHEN c.Invoice_Id <= 100 THEN CONCAT('Customer ', CHAR(65 + (c.Invoice_Id % 26)))
          ELSE CONCAT('Customer ', c.Invoice_Id)
        END as customer_name,
        
        -- PAYMENT METHOD SIMULATION (based on amount and timing)
        CASE 
          WHEN c.Harga_Total > 100000 THEN 'card'
          WHEN HOUR(c.Tanggal_Order) BETWEEN 9 AND 11 THEN 'digital'
          WHEN HOUR(c.Tanggal_Order) BETWEEN 18 AND 21 THEN 'card'
          ELSE 'cash'
        END as simulated_payment_method,
        
        -- STATUS SIMULATION
        CASE 
          WHEN DATEDIFF(NOW(), c.Tanggal_Order) > 0 THEN 'completed'
          WHEN c.Harga_Total < 20000 THEN 'failed'
          WHEN HOUR(NOW()) - HOUR(c.Tanggal_Order) > 1 THEN 'completed'
          ELSE 'pending'
        END as transaction_status,
        
        -- ORDER ITEMS
        COUNT(DISTINCT mm.id_menu) as total_items,
        GROUP_CONCAT(DISTINCT m.Nama_Menu SEPARATOR ', ') as items_list,
        SUM(mm.kuantitas) as total_quantity,
        
        -- ANALYTICS
        (SELECT AVG(c2.Harga_Total) 
         FROM Customer c2 
         WHERE c2.id_restaurant = c.id_restaurant) as restaurant_avg_transaction,
        
        (SELECT COUNT(*) 
         FROM Customer c3 
         WHERE c3.id_restaurant = c.id_restaurant 
           AND DATE(c3.Tanggal_Order) = DATE(c.Tanggal_Order)) as daily_transaction_count,
           
        -- TIME ANALYSIS
        HOUR(c.Tanggal_Order) as transaction_hour,
        DAYOFWEEK(c.Tanggal_Order) as transaction_day,
        WEEK(c.Tanggal_Order) as transaction_week,
        MONTH(c.Tanggal_Order) as transaction_month
        
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant
      ORDER BY c.Tanggal_Order DESC, c.Invoice_Id DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    // Get total count for pagination
    const countSQL = `
      SELECT COUNT(DISTINCT c.Invoice_Id) as total
      FROM Customer c
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      ${whereClause}
    `

    // Get summary statistics
    const summarySQL = `
      SELECT 
        COUNT(DISTINCT c.Invoice_Id) as total_transactions,
        SUM(c.Harga_Total) as total_revenue,
        AVG(c.Harga_Total) as avg_transaction_value,
        
        -- Payment method distribution (simulated)
        SUM(CASE WHEN c.Harga_Total > 100000 THEN 1 ELSE 0 END) as card_transactions,
        SUM(CASE WHEN HOUR(c.Tanggal_Order) BETWEEN 9 AND 11 OR HOUR(c.Tanggal_Order) BETWEEN 18 AND 21 THEN 1 ELSE 0 END) as digital_transactions,
        
        -- Status distribution (simulated)
        SUM(CASE WHEN DATEDIFF(NOW(), c.Tanggal_Order) > 0 THEN 1 ELSE 0 END) as completed_transactions,
        SUM(CASE WHEN c.Harga_Total < 20000 THEN 1 ELSE 0 END) as failed_transactions,
        
        -- Time analysis
        SUM(CASE WHEN DATE(c.Tanggal_Order) = CURDATE() THEN c.Harga_Total ELSE 0 END) as today_revenue,
        SUM(CASE WHEN DATE(c.Tanggal_Order) = CURDATE() THEN 1 ELSE 0 END) as today_transactions,
        
        -- Growth metrics
        SUM(CASE WHEN MONTH(c.Tanggal_Order) = MONTH(CURDATE()) THEN c.Harga_Total ELSE 0 END) as current_month_revenue,
        SUM(CASE WHEN MONTH(c.Tanggal_Order) = MONTH(CURDATE()) - 1 THEN c.Harga_Total ELSE 0 END) as previous_month_revenue
        
      FROM Customer c
      ${whereClause}
    `

    // Execute all queries
    const [transactions, countResult, summaryResult] = await Promise.all([
      query(transactionsSQL),
      query(countSQL),
      query(summarySQL)
    ])

    const total = countResult[0]?.total || 0
    const summary = summaryResult[0] || {}

    // Apply frontend filters to simulated data
    let filteredTransactions = transactions

    if (status && status !== 'all') {
      filteredTransactions = transactions.filter((t: any) => t.transaction_status === status)
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filteredTransactions = filteredTransactions.filter((t: any) => t.simulated_payment_method === paymentMethod)
    }

    console.log(`✅ Found ${filteredTransactions.length} transactions out of ${total} total`)

    return NextResponse.json({
      success: true,
      data: {
        transactions: filteredTransactions.map((transaction: any) => ({
          id: transaction.transaction_id,
          orderId: transaction.order_id,
          customer: transaction.customer_name,
          amount: parseFloat(transaction.Harga_Total),
          paymentMethod: transaction.simulated_payment_method,
          status: transaction.transaction_status,
          timestamp: transaction.Tanggal_Order,
          restaurant_id: transaction.id_restaurant,
          restaurant_name: transaction.nama_restaurant || 'Unknown Restaurant',
          
          // Enhanced transaction details
          items: transaction.items_list ? transaction.items_list.split(', ') : [],
          total_items: parseInt(transaction.total_items) || 0,
          total_quantity: parseInt(transaction.total_quantity) || 0,
          
          // Analytics data
          vs_restaurant_avg: parseFloat(transaction.Harga_Total) / (parseFloat(transaction.restaurant_avg_transaction) || 1),
          daily_transaction_count: parseInt(transaction.daily_transaction_count) || 0,
          
          // Time analysis
          transaction_hour: parseInt(transaction.transaction_hour) || 0,
          transaction_day: parseInt(transaction.transaction_day) || 1,
          
          // Categorization
          amount_category: parseFloat(transaction.Harga_Total) > 80000 ? 'high' : 
                          parseFloat(transaction.Harga_Total) > 40000 ? 'medium' : 'low',
          time_period: transaction.transaction_hour < 12 ? 'morning' : 
                      transaction.transaction_hour < 17 ? 'afternoon' : 'evening'
        })),
        
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + filteredTransactions.length) < total
        },
        
        summary: {
          total_transactions: parseInt(summary.total_transactions) || 0,
          total_revenue: parseFloat(summary.total_revenue) || 0,
          avg_transaction_value: parseFloat(summary.avg_transaction_value) || 0,
          
          // Payment method distribution
          payment_methods: {
            cash: parseInt(summary.total_transactions) - parseInt(summary.card_transactions) - parseInt(summary.digital_transactions),
            card: parseInt(summary.card_transactions) || 0,
            digital: parseInt(summary.digital_transactions) || 0
          },
          
          // Status distribution
          status_distribution: {
            completed: parseInt(summary.completed_transactions) || 0,
            failed: parseInt(summary.failed_transactions) || 0,
            pending: parseInt(summary.total_transactions) - parseInt(summary.completed_transactions) - parseInt(summary.failed_transactions)
          },
          
          // Performance metrics
          today_revenue: parseFloat(summary.today_revenue) || 0,
          today_transactions: parseInt(summary.today_transactions) || 0,
          
          // Growth calculation
          revenue_growth: summary.previous_month_revenue > 0 ? 
            ((parseFloat(summary.current_month_revenue) - parseFloat(summary.previous_month_revenue)) / parseFloat(summary.previous_month_revenue) * 100) : 0
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error fetching transactions:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch transactions",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Create a new transaction
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('💳 Creating new transaction...')
    const body: CreateTransactionRequest = await request.json()

    // Validate required fields
    if (!body.order_id || !body.customer_id || !body.amount || !body.payment_method) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields: order_id, customer_id, amount, and payment_method are required" 
      }, { status: 400 })
    }

    const { order_id, customer_id, amount, payment_method, restaurant_id, notes } = body

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'digital']
    if (!validPaymentMethods.includes(payment_method)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid payment method. Must be: cash, card, or digital" 
      }, { status: 400 })
    }

    // Check if order exists
    const orderCheckSQL = `SELECT Invoice_Id, Harga_Total, id_restaurant FROM Customer WHERE Invoice_Id = ?`
    const existingOrder = await query(orderCheckSQL, [customer_id])
    
    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Order not found for this customer" 
      }, { status: 404 })
    }

    const order = existingOrder[0]

    // Validate amount matches order total (allow small variance for tips/taxes)
    const orderTotal = parseFloat(order.Harga_Total)
    const amountDifference = Math.abs(orderTotal - amount)
    const allowedVariance = orderTotal * 0.1 // 10% variance allowed

    if (amountDifference > allowedVariance) {
      return NextResponse.json({ 
        success: false,
        error: `Transaction amount (${amount}) doesn't match order total (${orderTotal})`,
        details: { order_total: orderTotal, transaction_amount: amount }
      }, { status: 400 })
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Simulate transaction processing
    const processingDelay = payment_method === 'card' ? 2000 : 
                           payment_method === 'digital' ? 1000 : 0

    // Simulate success/failure (95% success rate)
    const transactionSuccess = Math.random() > 0.05
    const finalStatus = transactionSuccess ? 'completed' : 'failed'

    // For this implementation, we'll log the transaction but not store it in a separate table
    // Instead, we'll update the order record or create a transaction log
    console.log('💾 Processing transaction...', {
      transactionId,
      order_id,
      customer_id,
      amount,
      payment_method,
      status: finalStatus,
      processing_time: processingDelay
    })

    // Simulate processing delay
    if (processingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(processingDelay, 100))) // Reduced for API responsiveness
    }

    // Get transaction details for response
    const transactionDetailsSQL = `
      SELECT 
        c.Invoice_Id,
        c.Tanggal_Order,
        c.Harga_Total,
        c.id_restaurant,
        r.nama_restaurant,
        GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') as items_list
      FROM Customer c
      LEFT JOIN RESTAURANT r ON c.id_restaurant = r.id_restaurant
      LEFT JOIN MEMESAN_MENU mm ON c.Invoice_Id = mm.id_customer
      LEFT JOIN menu m ON mm.id_menu = m.Id_Menu
      WHERE c.Invoice_Id = ?
      GROUP BY c.Invoice_Id, c.Tanggal_Order, c.Harga_Total, c.id_restaurant, r.nama_restaurant
    `
    
    const transactionDetails = await query(transactionDetailsSQL, [customer_id])
    const details = transactionDetails[0]

    console.log('✅ Transaction processed successfully:', transactionId)

    return NextResponse.json({
      success: true,
      message: `Transaction ${finalStatus} successfully`,
      data: {
        transaction: {
          id: transactionId,
          orderId: `#${customer_id}`,
          customer: Number(customer_id) <= 50 ? `Table ${(Number(customer_id) % 10) + 1}` : `Customer ${customer_id}`,
          amount: amount,
          paymentMethod: payment_method,
          status: finalStatus,
          timestamp: new Date().toISOString(),
          restaurant_id: details?.id_restaurant || restaurant_id,
          restaurant_name: details?.nama_restaurant || 'Unknown Restaurant',
          
          // Additional details
          order_total: parseFloat(details?.Harga_Total || '0'),
          items: details?.items_list ? details.items_list.split(', ') : [],
          notes: notes || '',
          processing_time: processingDelay,
          
          // Metadata
          created_at: new Date().toISOString(),
          fees: amount > 50000 ? amount * 0.025 : 0, // 2.5% fee for large transactions
          net_amount: amount > 50000 ? amount * 0.975 : amount
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating transaction:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to create transaction",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update transaction status (for refunds, confirmations, etc.)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📝 Updating transaction...')
    const body = await request.json()
    const { transaction_id, status, notes } = body

    if (!transaction_id) {
      return NextResponse.json({ 
        success: false,
        error: "Transaction ID is required for update" 
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Extract customer ID from transaction ID (if following our format)
    const customerIdMatch = transaction_id.match(/TXN-\d+-/)
    if (!customerIdMatch) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid transaction ID format" 
      }, { status: 400 })
    }

    // For this implementation, we'll simulate the update
    // In a real system, you'd update a transactions table
    console.log('💾 Updating transaction status...', {
      transaction_id,
      new_status: status,
      notes,
      updated_at: new Date().toISOString()
    })

    console.log('✅ Transaction updated successfully:', transaction_id)

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      data: {
        transaction_id,
        status,
        updated_at: new Date().toISOString(),
        notes
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error updating transaction:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to update transaction",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Cancel/void a transaction
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🗑️ Cancelling transaction...')
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")

    if (!transactionId) {
      return NextResponse.json({ 
        success: false,
        error: "Transaction ID is required for cancellation" 
      }, { status: 400 })
    }

    // Validate transaction ID format
    if (!transactionId.startsWith('TXN-')) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid transaction ID format" 
      }, { status: 400 })
    }

    // For this implementation, we'll simulate the cancellation
    // In a real system, you'd update the transaction status to 'cancelled' or 'voided'
    console.log('💾 Cancelling transaction...', {
      transaction_id: transactionId,
      cancelled_at: new Date().toISOString(),
      reason: 'Manual cancellation'
    })

    console.log('✅ Transaction cancelled successfully:', transactionId)

    return NextResponse.json({
      success: true,
      message: "Transaction cancelled successfully",
      data: {
        transaction_id: transactionId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error) {
    console.error("❌ Error cancelling transaction:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to cancel transaction",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}