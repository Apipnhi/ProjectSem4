import { NextResponse } from "next/server"

interface Promotion {
  type: string
  description: string
  reasoning: string
  estimatedImpact: string
  details?: string
}

interface AppliedPromotion extends Promotion {
  id: string
  appliedAt: string
  status: 'active' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  performance?: {
    orders: number
    revenue: number
    conversionRate: number
  }
}

// In-memory storage for applied promotions (in production, this would be a database)
let appliedPromotions: AppliedPromotion[] = []

export async function POST(request: Request) {
  try {
    const { promotion, startDate, endDate } = await request.json()

    // Validate required fields
    if (!promotion || !promotion.type || !promotion.description) {
      return NextResponse.json(
        { error: "Invalid promotion data" },
        { status: 400 }
      )
    }

    // Generate unique ID for the promotion
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create applied promotion object
    const appliedPromotion: AppliedPromotion = {
      id: promotionId,
      type: promotion.type,
      description: promotion.description,
      reasoning: promotion.reasoning,
      estimatedImpact: promotion.estimatedImpact,
      details: promotion.details,
      appliedAt: new Date().toISOString(),
      status: 'active',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate,
      performance: {
        orders: 0,
        revenue: 0,
        conversionRate: 0
      }
    }

    // Add to storage
    appliedPromotions.push(appliedPromotion)

    // In a real application, you would:
    // 1. Save to database
    // 2. Update menu prices/availability
    // 3. Send notifications to staff
    // 4. Update POS system
    // 5. Create marketing materials

    return NextResponse.json({
      success: true,
      promotion: appliedPromotion,
      message: `Promotion "${promotion.description}" has been successfully applied!`
    })

  } catch (error) {
    console.error("Error applying promotion:", error)
    return NextResponse.json(
      { error: "Failed to apply promotion" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return all applied promotions
    return NextResponse.json({
      promotions: appliedPromotions
    })
  } catch (error) {
    console.error("Error fetching applied promotions:", error)
    return NextResponse.json(
      { error: "Failed to fetch applied promotions" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { promotionId, status } = await request.json()

    const promotion = appliedPromotions.find(p => p.id === promotionId)
    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      )
    }

    promotion.status = status

    return NextResponse.json({
      success: true,
      promotion,
      message: `Promotion status updated to ${status}`
    })

  } catch (error) {
    console.error("Error updating promotion:", error)
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    )
  }
} 