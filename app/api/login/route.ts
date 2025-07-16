// app/api/login/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // Demo credentials for testing without database
  const demoCredentials = {
    email: "admin@restomate.com",
    password: "admin123"
  }

  // Check demo credentials first
  if (email === demoCredentials.email && password === demoCredentials.password) {
    return NextResponse.json({
      success: true,
      user: {
        id: 1,
        name: "Admin User",
        email: "admin@restomate.com",
        role: "manager"
      },
      token: "demo-jwt-token",
    })
  }

  // Try database connection if demo credentials don't match
  try {
    const rows = await query(
      "SELECT * FROM RESTAURANT WHERE email = ? AND password = ?",
      [email, password]
    )

    const user = (rows as any[])[0]

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id_restaurant,
        name: user.name || "Restaurant Manager",
        email: user.email,
        role: "manager"
      },
      token: "mock-jwt-token",
    })
  } catch (error) {
    console.error("Database connection error:", error)
    
    // Return error with helpful message
    return NextResponse.json(
      { 
        success: false, 
        message: "Database connection failed. Please use demo credentials: admin@restomate.com / admin123" 
      },
      { status: 500 }
    )
  }
}
