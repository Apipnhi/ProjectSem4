import { NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  try {
    const { menuItems } = await request.json()

    const prompt = `Based on the following menu items, generate 3 food pack combinations:

Menu Items:
${menuItems.map((item) => `- ${item.name} (${item.category}) - $${item.price}`).join("\n")}

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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      try {
        const generatedPacks = JSON.parse(data.choices[0].message.content)
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
              description: "Perfect lunch combination",
              items: ["Main Course", "Beverage"],
              price: 18.99,
              type: "Pack 1",
              generated: true,
            },
          ],
        })
      }
    }

    return NextResponse.json({ error: "Failed to generate packs" }, { status: 500 })
  } catch (error) {
    console.error("Error generating packs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
