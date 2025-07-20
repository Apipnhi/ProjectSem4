// app/api/menu/food-packs/route.ts - Correct Implementation
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryLLM } from '@/lib/llm';

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
  item_ids: number[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  reasoning: string;
  estimatedDemand: string;
  profitMargin: number;
  category: string;
  generated: boolean;
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

async function generateDataDrivenFoodPacks(restaurantId: string): Promise<FoodPackRecommendation[]> {
  try {
    console.log('🤖 Generating AI-powered food pack recommendations...');

    const menuSQL = `
      SELECT Id_Menu, Nama_Menu, Harga, Kategori, Deskripsi
      FROM menu 
      WHERE id_restaurant = ? AND Status = 1
      ORDER BY Kategori, Harga
    `;

    const menuResult = await query(menuSQL, [parseInt(restaurantId)]);
    const menuItems: MenuItem[] = menuResult || [];

    if (menuItems.length < 2) {
      console.log('❌ Not enough menu items to generate packs');
      return [];
    }

    const salesSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as order_count,
        COALESCE(SUM(mm.kuantitas), COUNT(mm.id_menu)) as total_quantity,
        COALESCE(SUM(mm.kuantitas * m.Harga), COUNT(mm.id_menu) * m.Harga) as total_revenue
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ? AND m.Status = 1
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY order_count DESC
    `;

    const salesResult = await query(salesSQL, [parseInt(restaurantId)]);
    const salesData = salesResult || [];

    const menuSummary = menuItems.map(item => 
      `${item.Nama_Menu} (${item.Kategori}) - Rp${item.Harga.toLocaleString()} - ${item.Deskripsi}`
    ).join('\n');

    const salesSummary = salesData.map((item: any) => 
      `${item.Nama_Menu}: ${item.order_count} orders, ${item.total_quantity} quantity, Rp${(item.total_revenue || 0).toLocaleString()} revenue`
    ).join('\n');

    const prompt = `
    Sebagai AI strategis untuk restoran, analisis data berikut dan buatkan 5-6 rekomendasi paket makanan yang strategis:

    === DATA MENU ===
    ${menuSummary}

    === DATA PENJUALAN & PERFORMA ===
    ${salesSummary}

    === FORMAT RESPONSE ===
    Berikan response dalam format JSON array yang valid dengan struktur berikut:
    [
      {
        "name": "Nama Paket yang Menarik",
        "description": "Deskripsi singkat yang menarik (max 100 kata)",
        "items": ["Nama Menu 1", "Nama Menu 2", "Nama Menu 3"],
        "price": harga_paket_number,
        "originalPrice": total_harga_asli_number,
        "discountPercent": persentase_diskon_number,
        "reasoning": "Analisis mengapa paket ini strategis (max 150 kata)",
        "estimatedDemand": "High|Medium|Low",
        "category": "kategori_paket"
      }
    ]

    PENTING:
    - Berikan minimal 5 paket dan maksimal 6 paket
    - Harga paket harus 10-25% lebih murah dari harga asli
    - Setiap paket minimal 2 item, maksimal 4 item
    - Kombinasikan item dari kategori berbeda (makanan utama + minuman + snack/dessert)
    - Response harus berupa JSON array yang valid, tidak ada teks tambahan
    `;

    const systemMessage = `Anda adalah AI strategis restoran yang ahli dalam analisis data penjualan dan optimasi menu.`;

    const llmResponse = await queryLLM(prompt, systemMessage);
    console.log('🤖 LLM Raw Response:', llmResponse);

    let recommendations: any[] = [];
    try {
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
      
      recommendations = JSON.parse(jsonString);
      console.log('✅ Successfully parsed LLM recommendations:', recommendations.length);
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response, using fallback strategy');
      recommendations = generateIntelligentFallbacks(menuItems, salesData);
    }

    const processedPacks: FoodPackRecommendation[] = [];
    
    for (let i = 0; i < recommendations.length && i < 6; i++) {
      const rec = recommendations[i];
      
      const itemIds: number[] = [];
      const validItems: string[] = [];
      
      if (Array.isArray(rec.items)) {
        for (const itemName of rec.items) {
          const foundItem = menuItems.find(m => 
            m.Nama_Menu.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(m.Nama_Menu.toLowerCase())
          );
          
          if (foundItem) {
            itemIds.push(foundItem.Id_Menu);
            validItems.push(foundItem.Nama_Menu);
          }
        }
      }

      if (itemIds.length < 2) continue;

      const actualOriginalPrice = itemIds.reduce((sum, id) => {
        const item = menuItems.find(m => m.Id_Menu === id);
        return sum + (item ? item.Harga : 0);
      }, 0);

      const discountPercent = Math.max(10, Math.min(25, rec.discountPercent || 15));
      const calculatedPrice = Math.round(actualOriginalPrice * (1 - discountPercent / 100));

      const pack: FoodPackRecommendation = {
        id: `llm_pack_${i + 1}_${Date.now()}`,
        name: rec.name || `Paket Spesial ${i + 1}`,
        description: rec.description || 'Paket hemat pilihan terbaik',
        items: validItems,
        item_ids: itemIds,
        price: calculatedPrice,
        originalPrice: actualOriginalPrice,
        discountPercent: discountPercent,
        reasoning: rec.reasoning || 'Kombinasi strategis berdasarkan analisis data penjualan',
        estimatedDemand: rec.estimatedDemand || 'Medium',
        profitMargin: Math.round((calculatedPrice / actualOriginalPrice) * 100),
        category: rec.category || 'Paket Kombinasi',
        generated: true
      };

      processedPacks.push(pack);
    }

    console.log(`✅ Generated ${processedPacks.length} AI-powered food pack recommendations`);
    return processedPacks;

  } catch (error) {
    console.error('❌ Error generating AI food packs:', error);
    const menuResult = await query('SELECT Id_Menu, Nama_Menu, Harga, Kategori FROM menu WHERE id_restaurant = ? AND Status = 1 LIMIT 10', [parseInt(restaurantId)]);
    return generateBasicFallbacks(menuResult || []);
  }
}

function generateIntelligentFallbacks(menuItems: MenuItem[], salesData: any[]): any[] {
  const fallbacks = [];
  
  const topItems = salesData ? salesData.sort((a, b) => (b.order_count || 0) - (a.order_count || 0)).slice(0, 10) : [];
  
  if (topItems.length >= 2) {
    const bestSellers = topItems.slice(0, 3);
    fallbacks.push({
      name: "Paket Best Seller",
      description: "Kombinasi menu terlaris yang paling disukai pelanggan",
      items: bestSellers.map((item: any) => item.Nama_Menu),
      price: Math.round(bestSellers.reduce((sum: number, item: any) => sum + (item.Harga || 0), 0) * 0.85),
      originalPrice: bestSellers.reduce((sum: number, item: any) => sum + (item.Harga || 0), 0),
      discountPercent: 15,
      reasoning: "Paket ini menggabungkan item dengan penjualan tertinggi berdasarkan data historis",
      estimatedDemand: "High",
      category: "Best Seller"
    });
  }
  
  const mainCourse = menuItems.find(item => item.Kategori === 'Makanan Utama');
  const drink = menuItems.find(item => item.Kategori === 'Minuman');
  
  if (mainCourse && drink) {
    const items = [mainCourse, drink];
    
    fallbacks.push({
      name: "Paket Hemat Lengkap",
      description: "Paket lengkap dengan makanan utama dan minuman",
      items: items.map(item => item.Nama_Menu),
      price: Math.round(items.reduce((sum, item) => sum + (item.Harga || 0), 0) * 0.8),
      originalPrice: items.reduce((sum, item) => sum + (item.Harga || 0), 0),
      discountPercent: 20,
      reasoning: "Kombinasi strategis lintas kategori untuk memberikan pengalaman makan lengkap",
      estimatedDemand: "High",
      category: "Value Pack"
    });
  }
  
  return fallbacks;
}

function generateBasicFallbacks(menuItems: MenuItem[]): FoodPackRecommendation[] {
  if (menuItems.length < 2) return [];
  
  const pack: FoodPackRecommendation = {
    id: `fallback_${Date.now()}`,
    name: "Paket Kombinasi Spesial",
    description: "Paket hemat dengan kombinasi menu pilihan",
    items: menuItems.slice(0, 3).map(item => item.Nama_Menu),
    item_ids: menuItems.slice(0, 3).map(item => item.Id_Menu),
    price: Math.round(menuItems.slice(0, 3).reduce((sum, item) => sum + item.Harga, 0) * 0.85),
    originalPrice: menuItems.slice(0, 3).reduce((sum, item) => sum + item.Harga, 0),
    discountPercent: 15,
    reasoning: "Paket dasar berdasarkan menu yang tersedia",
    estimatedDemand: "Medium",
    profitMargin: 85,
    category: "Paket Kombinasi",
    generated: true
  };
  
  return [pack];
}

async function getExistingFoodPacks(restaurantId: string): Promise<any[]> {
  try {
    const packsSQL = `
      SELECT DISTINCT
        p.id_paket as pack_id,
        GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') as items,
        GROUP_CONCAT(m.Id_Menu SEPARATOR ',') as item_ids,
        SUM(m.Harga) as total_price,
        COUNT(m.Id_Menu) as item_count,
        GROUP_CONCAT(DISTINCT m.Kategori SEPARATOR ', ') as categories
      FROM PAKET p
      JOIN menu m ON p.id_menu = m.Id_Menu
      WHERE p.id_restaurant = ? AND m.Status = 1
      GROUP BY p.id_paket
      ORDER BY p.id_paket
    `;

    const result = await query(packsSQL, [parseInt(restaurantId)]);
    
    return (result || []).map((pack: any) => ({
      id: `existing_pack_${pack.pack_id}`,
      name: `Paket ${pack.pack_id}`,
      description: `Paket kombinasi dengan ${pack.item_count} item`,
      items: pack.items ? pack.items.split(', ') : [],
      item_ids: pack.item_ids ? pack.item_ids.split(',').map((id: string) => parseInt(id)) : [],
      price: Math.round((pack.total_price || 0) * 0.9),
      originalPrice: pack.total_price || 0,
      discountPercent: 10,
      reasoning: "Paket yang sudah tersedia di database",
      estimatedDemand: "Medium",
      profitMargin: 90,
      category: pack.categories || "Mixed",
      generated: false
    }));
  } catch (error) {
    console.error('Error fetching existing packs:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const type = searchParams.get('type') || 'all';

    console.log('🍽️ Fetching food pack recommendations:', { restaurantId, type });

    let packs: FoodPackRecommendation[] = [];

    if (type === 'recommendations' || type === 'all') {
      const aiRecommendations = await generateDataDrivenFoodPacks(restaurantId);
      packs = [...packs, ...aiRecommendations];
    }

    if (type === 'existing' || type === 'all') {
      const existingPacks = await getExistingFoodPacks(restaurantId);
      packs = [...packs, ...existingPacks];
    }

    console.log(`✅ Food pack recommendations generated: ${packs.length} packs`);

    return NextResponse.json({
      success: true,
      data: {
        packs,
        total: packs.length,
        type,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Food packs API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate food pack recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}