import { NextResponse } from "next/server"
import { query, insert } from "@/lib/db"

// GET all restaurant configurations
export async function GET() {
  try {
    const restaurants = await query(`
      SELECT 
        id,
        name,
        slug,
        primary_color,
        secondary_color,
        description,
        phone,
        address,
        logo_url,
        created_at,
        updated_at
      FROM restaurants 
      WHERE active = 1
    `)

    return NextResponse.json({ restaurants }, { status: 200 })
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 })
  }
}

// POST a new restaurant configuration
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if slug already exists
    const existingRestaurant = await query("SELECT id FROM restaurants WHERE slug = ?", [body.slug])
    if (Array.isArray(existingRestaurant) && existingRestaurant.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    const restaurantData = {
      name: body.name,
      slug: body.slug,
      primary_color: body.primaryColor || "#0f2b5b",
      secondary_color: body.secondaryColor || "#ffffff",
      description: body.description || "",
      phone: body.phone || "",
      address: body.address || "",
      logo_url: body.logoUrl || "",
      active: 1,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await insert("restaurants", restaurantData)

    return NextResponse.json(
      {
        message: "Restaurant configuration created successfully",
        restaurantId: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 })
  }
}
