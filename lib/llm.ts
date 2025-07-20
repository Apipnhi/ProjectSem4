// lib/llm.ts - GROQ API Integration for LLM Features
import { query } from './db';

// GROQ API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Generic LLM query function with updated model
export async function queryLLM(prompt: string, systemMessage?: string): Promise<string> {
  try {
    if (!GROQ_API_KEY) {
      console.warn('⚠️ GROQ API key not found, using fallback responses');
      return generateFallbackResponse(prompt);
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Updated to active model
        messages: [
          {
            role: 'system',
            content: systemMessage || 'You are a helpful restaurant management AI assistant specializing in data analysis and business insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GROQ API error:', response.status, errorText);
      throw new Error(`GROQ API error (${response.status}): ${errorText}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';

  } catch (error) {
    console.error('LLM query error:', error);
    return generateFallbackResponse(prompt);
  }
}

// Generate food pack recommendations using LLM
export async function generateFoodPackRecommendations(menuItems: any[], salesData: any[]): Promise<any[]> {
  try {
    const menuSummary = menuItems.map(item => `${item.Nama_Menu} (${item.Kategori}) - Rp${item.Harga}`).join('\n');
    const salesSummary = salesData.map(item => `${item.nama_menu}: ${item.total_orders} orders`).join('\n');
    
    const prompt = `
    Berdasarkan data menu dan penjualan berikut, buatkan 3-5 rekomendasi paket makanan yang strategis:

    MENU ITEMS:
    ${menuSummary}

    SALES DATA:
    ${salesSummary}

    Untuk setiap paket, berikan:
    1. Nama paket yang menarik
    2. Deskripsi singkat
    3. Item yang disertakan
    4. Harga yang disarankan (dengan diskon 10-20%)
    5. Alasan strategis mengapa paket ini bagus
    6. Estimasi demand (High/Medium/Low)

    Format response dalam JSON array dengan struktur:
    [
      {
        "name": "nama paket",
        "description": "deskripsi",
        "items": ["item1", "item2"],
        "price": harga_number,
        "originalPrice": harga_asli,
        "discountPercent": persentase_diskon,
        "reasoning": "alasan strategis",
        "estimatedDemand": "High/Medium/Low"
      }
    ]
    `;

    const systemMessage = 'You are a restaurant business strategist. Analyze menu and sales data to create profitable food pack recommendations. Respond with valid JSON only.';
    
    const llmResponse = await queryLLM(prompt, systemMessage);
    
    // Try to parse JSON from response
    let packs;
    try {
      // Extract JSON from response if it contains extra text
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
      packs = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      packs = generateFallbackPacks(menuItems);
    }

    // Validate and format packs
    return packs.map((pack: any, index: number) => ({
      id: `ai_pack_${Date.now()}_${index}`,
      name: pack.name || `Paket AI ${index + 1}`,
      description: pack.description || 'Paket makanan rekomendasi AI',
      items: Array.isArray(pack.items) ? pack.items : ['Menu Pilihan'],
      price: typeof pack.price === 'number' ? pack.price : 25000,
      originalPrice: typeof pack.originalPrice === 'number' ? pack.originalPrice : 30000,
      discountPercent: typeof pack.discountPercent === 'number' ? pack.discountPercent : 15,
      reasoning: pack.reasoning || 'Kombinasi menu yang strategis',
      estimatedDemand: pack.estimatedDemand || 'Medium',
      profitMargin: 25,
      category: 'AI Generated',
      generated: true
    }));

  } catch (error) {
    console.error('Error generating LLM food pack recommendations:', error);
    return generateFallbackPacks(menuItems);
  }
}

// Fallback response generator
function generateFallbackResponse(prompt: string): string {
  if (prompt.includes('food pack') || prompt.includes('paket')) {
    return JSON.stringify([
      {
        name: "Paket Hemat Pilihan",
        description: "Kombinasi menu terpopuler dengan harga hemat",
        items: ["Menu Utama", "Minuman"],
        price: 25000,
        originalPrice: 30000,
        discountPercent: 16,
        reasoning: "Paket ini menggabungkan menu favorit pelanggan",
        estimatedDemand: "High"
      }
    ]);
  }

  if (prompt.includes('prediction') || prompt.includes('prediksi')) {
    return JSON.stringify({
      predictions: {
        nextDay: { sales: 85000, confidence: 75 },
        nextMonth: { sales: 2500000, confidence: 70 },
        nextYear: { sales: 32000000, confidence: 65 }
      }
    });
  }

  return 'Unable to process request. Please try again later.';
}

// Generate fallback food packs when LLM fails
function generateFallbackPacks(menuItems: any[]): any[] {
  const fallbackPacks = [];
  
  if (menuItems.length >= 2) {
    // Basic combo pack
    fallbackPacks.push({
      id: `fallback_pack_${Date.now()}`,
      name: "Paket Hemat Standar",
      description: "Paket kombinasi menu pilihan dengan harga hemat",
      items: [menuItems[0]?.Nama_Menu || "Menu Utama", "Minuman"],
      price: 25000,
      originalPrice: 30000,
      discountPercent: 16,
      reasoning: "Paket dasar yang cocok untuk semua kalangan",
      estimatedDemand: "Medium",
      profitMargin: 25,
      category: "Standard",
      generated: true
    });
  }

  return fallbackPacks;
}