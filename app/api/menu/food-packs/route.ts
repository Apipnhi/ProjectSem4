// app/api/menu/food-packs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface MenuItem {
  Id_Menu: number;
  Nama_Menu: string;
  Harga: number;
  Kategori: string;
  Deskripsi: string;
}

interface FoodPackRecommendation {
  id: string;
  name: string;
  description: string;
  items: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  reasoning: string;
  estimatedDemand: string;
  profitMargin: number;
  category: string;
  generated: boolean;
}

// Helper function
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// LLM-powered food pack generation using GROQ with retry mechanism
async function generateDataDrivenFoodPacks(restaurantId: string): Promise<FoodPackRecommendation[]> {
  try {
    console.log('🤖 Generating AI-powered food pack recommendations...');

    // Get all menu items for this restaurant
    const menuSQL = `
      SELECT Id_Menu, Nama_Menu, Harga, Kategori, Deskripsi
      FROM menu 
      WHERE id_restaurant = ?
      ORDER BY Kategori, Harga
    `;

    const menuResult = await query(menuSQL, [parseInt(restaurantId)]);
    const menuItems: MenuItem[] = menuResult || [];

    if (menuItems.length < 2) {
      console.log('❌ Not enough menu items to generate packs');
      return [];
    }

    // Get sales data for popularity analysis
    const salesSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as order_count,
        COALESCE(SUM(mm.kuantitas), COUNT(mm.id_menu)) as total_quantity
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_quantity DESC, order_count DESC
    `;

    const salesResult = await query(salesSQL, [parseInt(restaurantId)]);
    const salesData = salesResult || [];

    console.log(`📊 Data retrieved: ${menuItems.length} menu items, ${salesData.length} sales records`);

    // Try LLM generation with retry mechanism
    const llmPacks = await generateLLMFoodPacks(menuItems, salesData);
    
    if (llmPacks.length > 0) {
      return llmPacks;
    }

    // Fallback to enhanced algorithmic generation
    return generateEnhancedFallbackPacks(menuItems, salesData);

  } catch (error) {
    console.error('❌ Error generating food packs:', error);
    return generateBasicFallbackPacks();
  }
}

// LLM generation with retry and error handling
async function generateLLMFoodPacks(menuItems: MenuItem[], salesData: any[]): Promise<FoodPackRecommendation[]> {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 LLM Query Attempt ${attempt}/${maxRetries}`);
      
      const menuSummary = menuItems.map(item => 
        `${item.Nama_Menu} (${item.Kategori}) - Rp${item.Harga}`
      ).join(', ');
      
      const salesSummary = salesData.length > 0 
        ? salesData.map(item => `${item.Nama_Menu}: ${item.total_quantity || 0} orders`).join(', ')
        : 'No sales data available';

      const prompt = `Berdasarkan data menu dan penjualan restoran Indonesia berikut, buat 3-5 rekomendasi paket makanan yang strategis:

MENU: ${menuSummary}
SALES: ${salesSummary}

Buat paket yang:
1. Menggabungkan menu populer dengan kurang populer
2. Memberikan value yang baik untuk customer
3. Meningkatkan profit margin
4. Sesuai selera Indonesia

Response format JSON:
[
  {
    "name": "nama paket",
    "description": "deskripsi singkat",
    "items": ["menu1", "menu2"],
    "price": harga_number,
    "originalPrice": harga_asli,
    "discountPercent": persentase,
    "reasoning": "alasan strategis",
    "estimatedDemand": "High/Medium/Low"
  }
]`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // Updated model
          messages: [
            {
              role: 'system',
              content: 'You are a restaurant business strategist. Create profitable food pack recommendations in valid JSON format only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ LLM query error (attempt ${attempt}): GROQ API error (${response.status}): ${errorText}`);
        
        if (attempt === maxRetries) {
          throw new Error(`GROQ API error (${response.status}): ${errorText}`);
        }
        continue;
      }

      const data = await response.json();
      const llmResponse = data.choices[0]?.message?.content;

      if (!llmResponse) {
        throw new Error('No response content from LLM');
      }

      console.log('🤖 LLM Raw Response:', llmResponse.substring(0, 500));

      // Parse JSON response
      let parsedPacks;
      try {
        // Try to extract JSON from response
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
        parsedPacks = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        if (attempt === maxRetries) {
          break;
        }
        continue;
      }

      if (!Array.isArray(parsedPacks)) {
        console.error('❌ LLM response is not an array');
        if (attempt === maxRetries) {
          break;
        }
        continue;
      }

      // Format and validate packs
      const formattedPacks = parsedPacks.map((pack: any, index: number) => ({
        id: `llm_pack_${Date.now()}_${index}`,
        name: pack.name || `Paket AI ${index + 1}`,
        description: pack.description || 'Paket makanan rekomendasi AI',
        items: Array.isArray(pack.items) ? pack.items : ['Menu Pilihan'],
        price: safeNumber(pack.price) || 25000,
        originalPrice: safeNumber(pack.originalPrice) || 30000,
        discountPercent: safeNumber(pack.discountPercent) || 15,
        reasoning: pack.reasoning || 'Kombinasi menu yang strategis',
        estimatedDemand: pack.estimatedDemand || 'Medium',
        profitMargin: Math.round(((safeNumber(pack.originalPrice) - safeNumber(pack.price)) / safeNumber(pack.originalPrice)) * 100) || 20,
        category: 'AI Generated',
        generated: true
      }));

      console.log(`✅ Successfully parsed LLM recommendations: ${formattedPacks.length}`);
      return formattedPacks;

    } catch (error) {
      console.error(`❌ LLM query error (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        console.log('🔄 All attempts failed, using enhanced fallback');
        break;
      }
    }
  }

  return [];
}

// Enhanced fallback generation using data-driven approach
function generateEnhancedFallbackPacks(menuItems: MenuItem[], salesData: any[]): FoodPackRecommendation[] {
  console.log('🔄 Generating enhanced fallback response...');
  
  const packs: FoodPackRecommendation[] = [];
  
  // Sort menu items by category and price for better combinations
  const sortedMenus = [...menuItems].sort((a, b) => {
    if (a.Kategori !== b.Kategori) {
      return a.Kategori.localeCompare(b.Kategori);
    }
    return a.Harga - b.Harga;
  });

  // Get different categories
  const categories = [...new Set(menuItems.map(item => item.Kategori))];
  const mainDishes = sortedMenus.filter(item => 
    item.Kategori.toLowerCase().includes('makanan') || 
    item.Kategori.toLowerCase().includes('utama')
  );
  const drinks = sortedMenus.filter(item => 
    item.Kategori.toLowerCase().includes('minuman')
  );
  const snacks = sortedMenus.filter(item => 
    item.Kategori.toLowerCase().includes('snack') || 
    item.Kategori.toLowerCase().includes('dessert')
  );

  // Pack 1: Basic combo (main + drink)
  if (mainDishes.length > 0 && drinks.length > 0) {
    const mainDish = mainDishes[0];
    const drink = drinks[0];
    const originalPrice = mainDish.Harga + drink.Harga;
    const packPrice = Math.round(originalPrice * 0.9); // 10% discount

    packs.push({
      id: `fallback_basic_${Date.now()}`,
      name: "Paket Hemat Spesial",
      description: "Kombinasi strategis menu terpilih dengan harga hemat untuk meningkatkan nilai pembelian pelanggan",
      items: [mainDish.Nama_Menu, drink.Nama_Menu],
      price: packPrice,
      originalPrice: originalPrice,
      discountPercent: 10,
      reasoning: "Paket ini menggabungkan makanan utama populer dengan minuman segar, memberikan value yang baik untuk pelanggan",
      estimatedDemand: "High",
      profitMargin: 25,
      category: "Value Pack",
      generated: true
    });
  }

  // Pack 2: Family pack (multiple mains)
  if (mainDishes.length >= 2) {
    const items = [mainDishes[0].Nama_Menu, mainDishes[1].Nama_Menu];
    if (drinks.length > 0) items.push(drinks[0].Nama_Menu);
    
    const originalPrice = mainDishes[0].Harga + mainDishes[1].Harga + (drinks.length > 0 ? drinks[0].Harga : 0);
    const packPrice = Math.round(originalPrice * 0.84); // 16% discount

    packs.push({
      id: `fallback_family_${Date.now()}`,
      name: "Paket Keluarga",
      description: "Paket lengkap untuk makan bersama keluarga dengan variasi menu",
      items: items,
      price: packPrice,
      originalPrice: originalPrice,
      discountPercent: 16,
      reasoning: "Kombinasi yang pas untuk keluarga dengan porsi yang cukup dan rasa yang disukai semua kalangan",
      estimatedDemand: "Medium",
      profitMargin: 28,
      category: "Family Pack",
      generated: true
    });
  }

  // Pack 3: Complete experience (main + drink + snack)
  if (mainDishes.length > 0 && drinks.length > 0 && snacks.length > 0) {
    const items = [mainDishes[0].Nama_Menu, drinks[0].Nama_Menu, snacks[0].Nama_Menu];
    const originalPrice = mainDishes[0].Harga + drinks[0].Harga + snacks[0].Harga;
    const packPrice = Math.round(originalPrice * 0.85); // 15% discount

    packs.push({
      id: `fallback_complete_${Date.now()}`,
      name: "Paket Komplit",
      description: "Paket lengkap dengan makanan utama, minuman, dan cemilan",
      items: items,
      price: packPrice,
      originalPrice: originalPrice,
      discountPercent: 15,
      reasoning: "Paket all-in-one yang memberikan pengalaman makan lengkap dengan hemat",
      estimatedDemand: "High",
      profitMargin: 30,
      category: "Complete Pack",
      generated: true
    });
  }

  console.log(`✅ Generated ${packs.length} enhanced fallback packs`);
  return packs;
}

// Basic fallback when everything else fails
function generateBasicFallbackPacks(): FoodPackRecommendation[] {
  return [{
    id: `basic_fallback_${Date.now()}`,
    name: "Paket Standar",
    description: "Paket standar dengan menu pilihan restoran",
    items: ["Menu Utama", "Minuman"],
    price: 25000,
    originalPrice: 30000,
    discountPercent: 16,
    reasoning: "Paket dasar yang selalu tersedia untuk pelanggan",
    estimatedDemand: "Medium",
    profitMargin: 25,
    category: "Standard",
    generated: false
  }];
}

// GET endpoint for food pack recommendations
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const type = searchParams.get('type') || 'recommendations';

    console.log('🍽️ Fetching food pack recommendations:', { restaurantId, type });

    const foodPacks = await generateDataDrivenFoodPacks(restaurantId);

    const response = {
      success: true,
      data: {
        packs: foodPacks,
        summary: {
          totalPacks: foodPacks.length,
          generatedPacks: foodPacks.filter(p => p.generated).length,
          existingPacks: foodPacks.filter(p => !p.generated).length,
          avgDiscount: foodPacks.length > 0 
            ? Math.round(foodPacks.reduce((sum, p) => sum + p.discountPercent, 0) / foodPacks.length)
            : 0,
          estimatedRevenue: foodPacks.reduce((sum, p) => sum + p.price, 0)
        }
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        generation_method: 'hybrid_llm_with_fallback',
        includes_ai: true,
        generated_at: new Date().toISOString()
      }
    };

    console.log(`✅ Food pack recommendations generated: ${foodPacks.length} packs`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in food pack recommendations:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate food pack recommendations',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          packs: [],
          summary: {
            totalPacks: 0,
            generatedPacks: 0,
            existingPacks: 0,
            avgDiscount: 0,
            estimatedRevenue: 0
          }
        }
      },
      { status: 500 }
    );
  }
}