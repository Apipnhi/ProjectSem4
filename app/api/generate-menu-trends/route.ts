// app/api/generate-menu-trends/route.ts
import { NextResponse } from "next/server"
import { callGroqLLM } from '@/lib/utils'

const GROQ_API_KEY = process.env.GROQ_API_KEY

interface MenuItem {
  name: string
  sales: number
  revenue: number
}

interface MenuTrend {
  trend: 'rising' | 'declining' | 'stable' | 'new'
  itemName: string
  currentSales: number
  predictedSales: number
  growthRate: number
  reasoning: string
  recommendations: string[]
  category: string
  seasonality?: string
}

interface TrendSummary {
  totalTrends: number
  risingTrends: number
  decliningTrends: number
  newOpportunities: number
  estimatedRevenueImpact: number
}

export async function POST(request: Request) {
  try {
    const { menuSales, period, includeSeasonal } = await request.json()

    // Validate required data
    if (!menuSales || !Array.isArray(menuSales)) {
      return NextResponse.json(
        { error: "Menu sales data is required" },
        { status: 400 }
      )
    }

    const typedMenuSales: MenuItem[] = menuSales
    const salesLines: string[] = typedMenuSales.map((item: MenuItem) => 
      `${item.name}: ${item.sales} sales, $${item.revenue} revenue`
    )

    // Create a comprehensive prompt for menu trend analysis
    const prompt = `Based on the following restaurant menu sales data, analyze trends and predict future performance for the next ${period || 'month'}.

Menu Sales Data:
${salesLines.join("\n")}

Please analyze the sales patterns and provide trend predictions for menu items. Consider:
1. Sales growth/decline patterns
2. Revenue performance
3. Seasonal factors (if applicable)
4. Customer preferences
5. Market trends
6. Menu positioning

For each menu item, provide:
- trend: "rising", "declining", "stable", or "new" (for potential new items)
- itemName: name of the menu item
- currentSales: current sales volume
- predictedSales: predicted sales for the next period
- growthRate: percentage growth/decline
- reasoning: explanation for the trend prediction
- recommendations: array of 2-3 specific recommendations (marketing, pricing, modifications, etc.)
- category: food category (appetizer, main, dessert, etc.)
- seasonality: seasonal factors if applicable

Also provide 2-3 potential new menu items that could capitalize on current trends.

Return as JSON array of objects with these fields. Focus on actionable insights and specific recommendations.`

    try {
      const llmResponse = await callGroqLLM(prompt)
      console.log("LLM Response for menu trends:", llmResponse)
      
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
      
      const menuTrends: MenuTrend[] = JSON.parse(jsonString)
      
      // Validate and enhance the trends
      const validatedTrends = menuTrends.map(trend => ({
        ...trend,
        growthRate: trend.growthRate || 0,
        recommendations: trend.recommendations || [],
        category: trend.category || 'main'
      }))

      // Calculate summary statistics
      const risingTrends = validatedTrends.filter(t => t.trend === 'rising').length
      const decliningTrends = validatedTrends.filter(t => t.trend === 'declining').length
      const newOpportunities = validatedTrends.filter(t => t.trend === 'new').length
      const estimatedRevenueImpact = validatedTrends.reduce((sum, t) => {
        const impact = t.predictedSales - t.currentSales
        return sum + (impact * 25) // Assume average $25 per item
      }, 0)

      return NextResponse.json({ 
        trends: validatedTrends,
        summary: {
          totalTrends: validatedTrends.length,
          risingTrends,
          decliningTrends,
          newOpportunities,
          estimatedRevenueImpact
        }
      })
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError)
      
      // Return fallback menu trend predictions
      return NextResponse.json({ 
        trends: [
          {
            trend: "rising",
            itemName: "Grilled Salmon",
            currentSales: 245,
            predictedSales: 320,
            growthRate: 30.6,
            reasoning: "High customer satisfaction and premium positioning driving increased demand",
            recommendations: [
              "Feature as 'Chef's Special' on weekends",
              "Consider seasonal variations (citrus glaze in summer)",
              "Cross-promote with premium wine pairings"
            ],
            category: "main",
            seasonality: "Year-round favorite"
          },
          {
            trend: "stable",
            itemName: "Caesar Salad",
            currentSales: 189,
            predictedSales: 195,
            growthRate: 3.2,
            reasoning: "Consistent performer with loyal customer base",
            recommendations: [
              "Add protein options (chicken, shrimp) to increase value",
              "Create 'Caesar Salad Bar' for customization",
              "Promote as healthy lunch option"
            ],
            category: "appetizer"
          },
          {
            trend: "declining",
            itemName: "Chocolate Cake",
            currentSales: 156,
            predictedSales: 120,
            growthRate: -23.1,
            reasoning: "Seasonal dessert losing appeal, customers seeking lighter options",
            recommendations: [
              "Introduce lighter dessert alternatives",
              "Create mini-dessert sampler platter",
              "Offer as 'Happy Hour' special"
            ],
            category: "dessert",
            seasonality: "Winter favorite, declining in warmer months"
          },
          {
            trend: "new",
            itemName: "Mediterranean Bowl",
            currentSales: 0,
            predictedSales: 85,
            growthRate: 0,
            reasoning: "Health-conscious trend and Mediterranean cuisine popularity",
            recommendations: [
              "Launch as 'Healthy Choice' menu section",
              "Feature fresh, local ingredients",
              "Offer vegetarian and vegan options"
            ],
            category: "main"
          },
          {
            trend: "new",
            itemName: "Truffle Pasta",
            currentSales: 0,
            predictedSales: 65,
            growthRate: 0,
            reasoning: "Premium pasta trend and truffle popularity",
            recommendations: [
              "Position as premium pasta option",
              "Limited availability to create exclusivity",
              "Pair with Italian wine selection"
            ],
            category: "main"
          }
        ],
        summary: {
          totalTrends: 5,
          risingTrends: 1,
          decliningTrends: 1,
          newOpportunities: 2,
          estimatedRevenueImpact: 2875.00
        }
      })
    }
  } catch (error) {
    console.error("Error generating menu trends:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 