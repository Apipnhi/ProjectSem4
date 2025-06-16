import { NextResponse } from "next/server"
import { getById, update, remove } from "@/lib/db"

// GET a specific order
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const order = await getById("orders", id)

    if (!order || (Array.isArray(order) && order.length === 0)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order: Array.isArray(order) ? order[0] : order }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

// PUT/PATCH to update an order
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Add updated timestamp
    const updateData = {
      ...body,
      updated_at: new Date(),
    }

    const result = await update("orders", id, updateData)

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Order updated successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`Error updating order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

// DELETE an order
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const result = await remove("orders", id)

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Order deleted successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`Error deleting order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
