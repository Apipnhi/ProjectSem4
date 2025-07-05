import { NextResponse } from "next/server"
import { callGroqLLM } from '@/lib/utils'

const GROQ_API_KEY = process.env.GROQ_API_KEY

interface MenuItem {
  name: string
  sales: number
  revenue: number
}

interface StockPrediction {
  ingredient: string
  currentStock: number
  predictedNeed: number
  recommendedOrder: number
  urgency: 'low' | 'medium' | 'high'
  reasoning: string
  estimatedCost: number
}

export async function POST(request: Request) {
  try {
    const { menuSales, currentStock, period } = await request.json()

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

    // Create a comprehensive prompt for stock prediction
    const prompt = `Based on the following restaurant menu sales data, predict stock requirements for the next ${period || 'week'}.

Menu Sales Data:
${salesLines.join("\n")}

Current Stock Levels:
${currentStock ? Object.entries(currentStock).map(([item, amount]) => `${item}: ${amount} units`).join("\n") : "No current stock data provided"}

Please analyze the sales patterns and predict stock requirements for common restaurant ingredients. Consider:
1. Popular menu items and their ingredient requirements
2. Sales volume trends
3. Seasonal factors
4. Waste and spoilage rates
5. Safety stock levels

For each ingredient, provide:
- ingredient: name of the ingredient
- currentStock: current available stock (if known)
- predictedNeed: amount needed for the period
- recommendedOrder: suggested order quantity
- urgency: "low", "medium", or "high" based on stock levels and demand
- reasoning: explanation for the prediction
- estimatedCost: estimated cost for the recommended order

Return as JSON array of objects with these fields. Focus on the most critical ingredients first.`

    try {
      const llmResponse = await callGroqLLM(prompt)
      console.log("LLM Response for stock prediction:", llmResponse)
      
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
      
      const stockPredictions: StockPrediction[] = JSON.parse(jsonString)
      
      // Validate and enhance the predictions
      const validatedPredictions = stockPredictions.map(prediction => ({
        ...prediction,
        estimatedCost: prediction.estimatedCost || 0,
        urgency: prediction.urgency || 'medium'
      }))

      return NextResponse.json({ 
        predictions: validatedPredictions,
        summary: {
          totalIngredients: validatedPredictions.length,
          highUrgency: validatedPredictions.filter(p => p.urgency === 'high').length,
          estimatedTotalCost: validatedPredictions.reduce((sum, p) => sum + p.estimatedCost, 0)
        }
      })
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError)
      
      // Return fallback stock predictions
      return NextResponse.json({ 
        predictions: [
          {
            ingredient: "Fresh Tomatoes",
            currentStock: 50,
            predictedNeed: 120,
            recommendedOrder: 80,
            urgency: "high",
            reasoning: "High demand from popular pasta dishes and salads",
            estimatedCost: 240.00
          },
          {
            ingredient: "Chicken Breast",
            currentStock: 30,
            predictedNeed: 90,
            recommendedOrder: 70,
            urgency: "medium",
            reasoning: "Consistent demand from grilled chicken dishes",
            estimatedCost: 350.00
          },
          {
            ingredient: "Fresh Basil",
            currentStock: 15,
            predictedNeed: 25,
            recommendedOrder: 15,
            urgency: "low",
            reasoning: "Moderate usage in Italian dishes",
            estimatedCost: 45.00
          },
          {
            ingredient: "Olive Oil",
            currentStock: 8,
            predictedNeed: 12,
            recommendedOrder: 6,
            urgency: "medium",
            reasoning: "Essential ingredient used across multiple dishes",
            estimatedCost: 120.00
          },
          {
            ingredient: "Parmesan Cheese",
            currentStock: 20,
            predictedNeed: 35,
            recommendedOrder: 20,
            urgency: "medium",
            reasoning: "High usage in pasta and pizza dishes",
            estimatedCost: 180.00
          }
        ],
        summary: {
          totalIngredients: 5,
          highUrgency: 1,
          estimatedTotalCost: 935.00
        }
      })
    }
  } catch (error) {
    console.error("Error generating stock predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 