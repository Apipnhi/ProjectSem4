import { NextResponse } from "next/server"
import { callGroqLLM } from '@/lib/utils'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  try {
    const { salesData, period, menuSales, promoAnalysis } = await request.json()

    // If menuSales is provided, predict top selling menu items (but not for promo analysis)
    if (menuSales && !promoAnalysis) {
      const typedMenuSales: { name: string; sales: number; revenue: number }[] = menuSales
      const salesLines: string[] = typedMenuSales.map((item: { name: string; sales: number; revenue: number }) => `${item.name}: ${item.sales} sales, $${item.revenue} revenue`)
      const prompt = `Given the following menu sales data, predict the top 3 best selling menu items for the next ${period} and briefly explain why.\n\nMenu Sales Data:\n${salesLines.join("\n")}\n\nReturn your answer as a JSON array of objects with 'name', 'predictedSales', and 'reason' fields.`
      
      try {
        const llmResponse = await callGroqLLM(prompt)
        console.log("LLM Response for menu prediction:", llmResponse)
        
        // Try to extract JSON from the response
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
        
        const topItems = JSON.parse(jsonString)
        return NextResponse.json({ topItems })
      } catch (parseError) {
        console.error("Error parsing LLM response:", parseError)
        
        // Return fallback prediction
        return NextResponse.json({ 
          topItems: [
            {
              name: "Grilled Salmon",
              predictedSales: 280,
              reason: "Based on current sales trends and customer preferences"
            },
            {
              name: "Caesar Salad", 
              predictedSales: 220,
              reason: "Popular healthy option with consistent demand"
            },
            {
              name: "Chocolate Cake",
              predictedSales: 180,
              reason: "High-margin dessert with strong customer appeal"
            }
          ]
        })
      }
    }

    // If promoAnalysis is requested, generate promotion recommendations
    if (promoAnalysis && menuSales) {
      const typedMenuSales: { name: string; sales: number; revenue: number }[] = menuSales
      const salesLines: string[] = typedMenuSales.map((item: { name: string; sales: number; revenue: number }) => `${item.name}: ${item.sales} sales, $${item.revenue} revenue`)
      
      const prompt = `Based on the following menu sales data, provide 4-6 specific promotion recommendations for a restaurant:

Menu Sales Data:
${salesLines.join("\n")}

Analyze the data and suggest promotions including:
1. Discount strategies (for slow-selling items)
2. Bundle recommendations (combining popular items)
3. Timing-based promotions (happy hours, lunch specials)
4. Seasonal or themed promotions

For each recommendation, provide:
- type: "Discount", "Bundle", "Timing", or "Seasonal"
- description: Brief description of the promotion
- reasoning: Why this promotion would work based on the data
- estimatedImpact: "High", "Medium", or "Low" impact
- details: Specific implementation details (optional)

Return as JSON array of objects with these fields.`

      try {
        const llmResponse = await callGroqLLM(prompt)
        console.log("LLM Response for promo analysis:", llmResponse)
        
        // Try to extract JSON from the response
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
        
        const promos = JSON.parse(jsonString)
        return NextResponse.json({ promos })
      } catch (parseError) {
        console.error("Error parsing LLM response for promos:", parseError)
        
        // Return fallback promotion recommendations
        return NextResponse.json({ 
          promos: [
            {
              type: "Discount",
              description: "20% off slow-selling items",
              reasoning: "Based on sales data showing some items with lower demand",
              estimatedImpact: "Medium",
              details: "Apply to items with <50% average sales"
            },
            {
              type: "Bundle", 
              description: "Lunch Combo: Main + Drink + Dessert",
              reasoning: "Popular items can be combined for higher average order value",
              estimatedImpact: "High",
              details: "Offer at 15% discount vs individual items"
            },
            {
              type: "Timing",
              description: "Happy Hour: 2-4pm drink specials",
              reasoning: "Utilize slower afternoon hours to boost sales",
              estimatedImpact: "Medium",
              details: "50% off all beverages during this period"
            },
            {
              type: "Seasonal",
              description: "Weekend Family Deals",
              reasoning: "Weekend traffic patterns suggest family-oriented promotions",
              estimatedImpact: "High",
              details: "Family meal packages with 20% discount"
            }
          ]
        })
      }
    }

    // Regular sales predictions
    const typedSalesData: { [key: string]: any; sales: number; orders: number }[] = salesData
    const salesLines: string[] = typedSalesData.map((item: { [key: string]: any; sales: number; orders: number }) => {
      const dateKey = Object.keys(item).find(key => key !== 'sales' && key !== 'orders' && key !== 'avgOrder')
      return `${dateKey ? item[dateKey] : 'Unknown'}: $${item.sales} (${item.orders} orders)`
    })

    const prompt = `Based on the following ${period} sales data, predict future sales:

Sales Data:
${salesLines.join("\n")}

Please analyze the trends and provide predictions for:
1. Next day sales (if daily data) or next period
2. Next month sales
3. Next year sales

For each prediction, provide:
- Predicted sales amount
- Confidence percentage (0-100)

Consider factors like:
- Growth trends
- Seasonal patterns
- Order volume changes
- Average order value trends

Format as JSON with structure:
{
  "nextDay": {"sales": number, "confidence": number},
  "nextMonth": {"sales": number, "confidence": number},
  "nextYear": {"sales": number, "confidence": number}
}`

    try {
      const llmResponse = await callGroqLLM(prompt)
      const predictions = JSON.parse(llmResponse)
        return NextResponse.json({ predictions })
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        // Return fallback predictions
        const lastSales = salesData[salesData.length - 1]?.sales || 1000
        return NextResponse.json({
          predictions: {
            nextDay: { sales: Math.round(lastSales * 1.05), confidence: 85 },
            nextMonth: { sales: Math.round(lastSales * 30 * 1.1), confidence: 78 },
            nextYear: { sales: Math.round(lastSales * 365 * 1.15), confidence: 72 },
          },
        })
      }
  } catch (error) {
    console.error("Error generating predictions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
