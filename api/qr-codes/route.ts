import { NextResponse } from "next/server"
import { query, insert } from "@/lib/db"

// GET QR codes for a restaurant
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurant_id")

    let qrCodes
    if (restaurantId) {
      qrCodes = await query(
        `
        SELECT 
          qc.*,
          r.name as restaurant_name,
          r.slug as restaurant_slug
        FROM qr_codes qc
        JOIN restaurants r ON qc.restaurant_id = r.id
        WHERE qc.restaurant_id = ?
        ORDER BY qc.created_at DESC
      `,
        [restaurantId],
      )
    } else {
      qrCodes = await query(`
        SELECT 
          qc.*,
          r.name as restaurant_name,
          r.slug as restaurant_slug
        FROM qr_codes qc
        JOIN restaurants r ON qc.restaurant_id = r.id
        ORDER BY qc.created_at DESC
      `)
    }

    return NextResponse.json({ qrCodes }, { status: 200 })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 })
  }
}

// POST a new QR code
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.restaurantId || !body.url) {
      return NextResponse.json({ error: "Restaurant ID and URL are required" }, { status: 400 })
    }

    const qrCodeData = {
      restaurant_id: body.restaurantId,
      name: body.name || `QR Code ${Date.now()}`,
      url: body.url,
      qr_type: body.type || "menu",
      scan_count: 0,
      active: 1,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await insert("qr_codes", qrCodeData)

    return NextResponse.json(
      {
        message: "QR code created successfully",
        qrCodeId: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating QR code:", error)
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 })
  }
}
