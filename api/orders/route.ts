import { NextResponse } from "next/server"
import { query, getAll, insert } from "@/lib/db"

// GET all orders
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let orders
    if (status) {
      orders = await query("SELECT * FROM orders WHERE status = ?", [status])
    } else {
      orders = await getAll("orders")
    }

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST a new order
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.customer || !body.items || !body.total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Set default values
    const orderData = {
      ...body,
      status: body.status || "pending",
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await insert("orders", orderData)

    return NextResponse.json(
      {
        message: "Order created successfully",
        orderId: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
