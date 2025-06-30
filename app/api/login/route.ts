import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(req: Request) {
  const { email, password } = await req.json()

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
        id: user.id,
        name: user.name,
        email: user.email,

 
      },
      token: "mock-jwt-token",
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
