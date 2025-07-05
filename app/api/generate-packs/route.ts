import { NextResponse } from "next/server"
import { callGroqLLM } from '@/lib/utils'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  try {
    const { menuItems } = await request.json()

    const prompt = `Based on the following menu items, generate 3 food pack combinations:

Menu Items:
${menuItems.map((item: any) => `- ${item.name} (${item.category}) - $${item.price}`).join("\n")}

Please create:
1. Pack 1: 1 main food item + 1 drink
2. Pack 2: 1 main food item + 1 drink + 1 dessert/snack
3. Pack 3: The most popular combination based on typical restaurant pairings

For each pack, provide:
- Name
- Description
- Items included
- Suggested price (with discount)

Format as JSON array with objects containing: name, description, items (array), price, type`

    try {
      const llmResponse = await callGroqLLM(prompt)
      console.log("LLM Response for pack generation:", llmResponse)
      
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse
      
      const generatedPacks = JSON.parse(jsonString)
      const packs = generatedPacks.map((pack: any, index: number) => ({
        id: Date.now() + index,
        name: pack.name,
        description: pack.description,
        items: pack.items,
        price: pack.price,
        type: pack.type || `Pack ${index + 1}`,
        generated: true,
      }))

      return NextResponse.json({ packs })
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      // Return fallback packs
      return NextResponse.json({
        packs: [
          {
            id: Date.now() + 1,
            name: "AI Lunch Special",
            description: "Perfect lunch combination with main course and beverage",
            items: ["Grilled Salmon", "Coca Cola"],
            price: 18.99,
            type: "Pack 1",
            generated: true,
          },
          {
            id: Date.now() + 2,
            name: "AI Dinner Combo",
            description: "Complete dinner experience with dessert",
            items: ["Caesar Salad", "Coca Cola", "Chocolate Cake"],
            price: 22.99,
            type: "Pack 2",
            generated: true,
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error generating packs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
