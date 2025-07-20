// app/api/menu/route.ts - Correct Implementation
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryLLM, gatherRestaurantContext } from '@/lib/llm';

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  rating?: number;
  orders_count?: number;
  total_quantity?: number;
  total_revenue?: number;
  unique_customers?: number;
}

interface FoodPack {
  pack_id: number;
  name: string;
  description: string;
  items: string[];
  item_ids: number[];
  total_price: number;
  discount_price: number;
  discount_percent: number;
  category: string;
  generated?: boolean;
}

// Helper function for safe number conversion
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Get menu items with optional analytics data
async function getMenuItemsWithAnalytics(restaurantId: string, includeAnalytics: boolean = false): Promise<MenuItem[]> {
  try {
    console.log('🍽️ Fetching menu data for restaurant:', restaurantId);
    
    let menuSQL = '';
    const params = [parseInt(restaurantId)];
    
    if (includeAnalytics) {
      // Enhanced query with analytics data
      menuSQL = `
        SELECT 
          m.Id_Menu as id,
          m.Nama_Menu as name,
          m.Deskripsi as description,
          m.Kategori as category,
          m.Harga as price,
          m.Gambar as image,
          m.Status as available,
          COUNT(mm.id_menu) as orders_count,
          COALESCE(SUM(mm.kuantitas), 0) as total_quantity,
          COALESCE(AVG(cf.rating), 4.0) as avg_rating,
          COALESCE(SUM(mm.kuantitas * m.Harga), 0) as total_revenue,
          COUNT(DISTINCT mm.id_customer) as unique_customers
        FROM menu m
        LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
        LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
        LEFT JOIN CUSTOMER_FEEDBACK cf ON c.Invoice_Id = cf.id_customer
        WHERE m.id_restaurant = ?
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Deskripsi, m.Kategori, m.Harga, m.Gambar, m.Status
        ORDER BY orders_count DESC, avg_rating DESC
      `;
    } else {
      // Basic query without analytics
      menuSQL = `
        SELECT 
          Id_Menu as id,
          Nama_Menu as name,
          Deskripsi as description,
          Kategori as category,
          Harga as price,
          Gambar as image,
          Status as available
        FROM menu 
        WHERE id_restaurant = ?
        ORDER BY Kategori, Nama_Menu
      `;
    }

    const result = await query(menuSQL, params);
    console.log(`✅ Found ${result?.length || 0} menu items`);

    return (result || []).map((item: any) => ({
      id: item.id,
      name: item.name || 'Unknown Item',
      description: item.description || 'No description available',
      category: item.category || 'Other',
      price: safeNumber(item.price),
      image: item.image ? `data:image/jpeg;base64,${Buffer.from(item.image).toString('base64')}` : '/placeholder-food.jpg',
      available: Boolean(item.available),
      rating: includeAnalytics ? safeNumber(item.avg_rating) : undefined,
      orders_count: includeAnalytics ? safeNumber(item.orders_count) : undefined,
      total_quantity: includeAnalytics ? safeNumber(item.total_quantity) : undefined,
      total_revenue: includeAnalytics ? safeNumber(item.total_revenue) : undefined,
      unique_customers: includeAnalytics ? safeNumber(item.unique_customers) : undefined
    }));

  } catch (error) {
    console.error('❌ Error fetching menu items:', error);
    return [];
  }
}

// Get existing food packs from database
async function getExistingFoodPacks(restaurantId: string): Promise<FoodPack[]> {
  try {
    const packsSQL = `
      SELECT DISTINCT
        p.id_paket as pack_id,
        GROUP_CONCAT(m.Nama_Menu ORDER BY m.Nama_Menu SEPARATOR ', ') as items,
        GROUP_CONCAT(m.Id_Menu ORDER BY m.Nama_Menu SEPARATOR ',') as item_ids,
        SUM(m.Harga) as total_price,
        COUNT(m.Id_Menu) as item_count,
        GROUP_CONCAT(DISTINCT m.Kategori SEPARATOR ', ') as categories
      FROM PAKET p
      JOIN menu m ON p.id_menu = m.Id_Menu
      WHERE p.id_restaurant = ? AND m.Status = 1
      GROUP BY p.id_paket
      HAVING item_count >= 2
      ORDER BY p.id_paket
    `;

    const result = await query(packsSQL, [parseInt(restaurantId)]);
    console.log(`✅ Found ${result?.length || 0} existing food packs`);
    
    return (result || []).map((pack: any) => ({
      pack_id: pack.pack_id,
      name: `Paket ${pack.pack_id}`,
      description: `Kombinasi ${pack.item_count} menu pilihan`,
      items: pack.items ? pack.items.split(', ') : [],
      item_ids: pack.item_ids ? pack.item_ids.split(',').map((id: string) => parseInt(id)) : [],
      total_price: safeNumber(pack.total_price),
      discount_price: Math.round(safeNumber(pack.total_price) * 0.85), // 15% discount
      discount_percent: 15,
      category: pack.categories || 'Mixed',
      generated: false
    }));

  } catch (error) {
    console.error('❌ Error fetching existing packs:', error);
    return [];
  }
}

// Generate AI-powered food pack recommendations
async function generateAIFoodPacks(restaurantId: string): Promise<any[]> {
  try {
    console.log('🤖 Generating AI-powered food packs...');
    
    // Gather restaurant context
    const context = await gatherRestaurantContext(restaurantId);
    
    // Build prompt for food pack recommendations
    const prompt = `
    Berdasarkan data menu dan penjualan restoran, buatkan 5-6 rekomendasi paket makanan strategis:

    MENU ITEMS: ${context.menuItems?.length || 0} items tersedia
    SALES DATA: ${context.salesData?.length || 0} items dengan data penjualan
    CUSTOMER FEEDBACK: ${context.feedbackData?.length || 0} feedback entries

    Untuk setiap paket, berikan:
    1. Nama paket yang menarik
    2. Deskripsi singkat (max 100 kata)
    3. Item yang disertakan (2-4 items)
    4. Harga dengan diskon 15-25%
    5. Alasan strategis mengapa paket ini bagus

    Format JSON array:
    [
      {
        "name": "nama paket",
        "description": "deskripsi",
        "items": ["item1", "item2"],
        "price": harga_number,
        "originalPrice": harga_asli,
        "discountPercent": persentase,
        "reasoning": "alasan strategis",
        "estimatedDemand": "High/Medium/Low"
      }
    ]
    `;

    const systemMessage = `Anda adalah AI strategis restoran yang ahli dalam analisis menu dan rekomendasi paket makanan yang menguntungkan.`;

    const llmResponse = await queryLLM(prompt, systemMessage, {
      temperature: 0.7,
      maxTokens: 2000
    });

    // Parse LLM response
    try {
      const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
      const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      // Process recommendations
      const processedPacks = recommendations.map((rec: any, index: number) => ({
        id: `ai_pack_${Date.now()}_${index}`,
        name: rec.name || `Paket AI ${index + 1}`,
        description: rec.description || 'Paket rekomendasi AI',
        items: Array.isArray(rec.items) ? rec.items : ['Menu 1', 'Menu 2'],
        price: rec.price || 50000,
        originalPrice: rec.originalPrice || 60000,
        discountPercent: rec.discountPercent || 15,
        reasoning: rec.reasoning || 'Rekomendasi berdasarkan analisis AI',
        estimatedDemand: rec.estimatedDemand || 'Medium',
        category: 'AI Recommendation',
        generated: true,
        aiGenerated: true
      }));

      console.log(`✅ Generated ${processedPacks.length} AI food pack recommendations`);
      return processedPacks;

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generateFallbackPacks();
    }

  } catch (error) {
    console.error('❌ Error generating AI food packs:', error);
    return generateFallbackPacks();
  }
}

// Fallback pack generation when AI fails
function generateFallbackPacks(): any[] {
  return [
    {
      id: `fallback_pack_${Date.now()}`,
      name: "Paket Hemat Spesial",
      description: "Kombinasi menu pilihan dengan harga hemat",
      items: ["Menu Utama", "Minuman"],
      price: 45000,
      originalPrice: 55000,
      discountPercent: 18,
      reasoning: "Paket dasar untuk memberikan value terbaik kepada pelanggan",
      estimatedDemand: "High",
      category: "Value Pack",
      generated: true,
      aiGenerated: false
    }
  ];
}

// Enhanced analytics for menu performance
async function getMenuAnalytics(restaurantId: string): Promise<any> {
  try {
    // Get sales performance summary
    const performanceSQL = `
      SELECT 
        COUNT(DISTINCT m.Id_Menu) as total_menu_items,
        COUNT(DISTINCT mm.id_customer) as total_customers,
        COUNT(mm.id_menu) as total_orders,
        SUM(mm.kuantitas) as total_quantity_sold,
        SUM(mm.kuantitas * m.Harga) as total_revenue,
        AVG(mm.kuantitas * m.Harga) as avg_order_value,
        COUNT(DISTINCT DATE(c.Tanggal_Order)) as active_days
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
    `;

    const performanceResult = await query(performanceSQL, [parseInt(restaurantId)]);
    const performance = performanceResult?.[0] || {};

    // Get category performance
    const categorySQL = `
      SELECT 
        m.Kategori as category,
        COUNT(DISTINCT m.Id_Menu) as items_count,
        COUNT(mm.id_menu) as orders_count,
        SUM(mm.kuantitas) as quantity_sold,
        SUM(mm.kuantitas * m.Harga) as revenue,
        AVG(m.Harga) as avg_price
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      WHERE m.id_restaurant = ?
      GROUP BY m.Kategori
      ORDER BY revenue DESC
    `;

    const categoryResult = await query(categorySQL, [parseInt(restaurantId)]);
    const categoryPerformance = categoryResult || [];

    // Get top performers
    const topPerformersSQL = `
      SELECT 
        m.Nama_Menu as name,
        m.Kategori as category,
        COUNT(mm.id_menu) as orders,
        SUM(mm.kuantitas) as quantity,
        SUM(mm.kuantitas * m.Harga) as revenue
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      WHERE m.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const topPerformers = await query(topPerformersSQL, [parseInt(restaurantId)]);

    return {
      overall: {
        total_menu_items: safeNumber(performance.total_menu_items),
        total_customers: safeNumber(performance.total_customers),
        total_orders: safeNumber(performance.total_orders),
        total_revenue: safeNumber(performance.total_revenue),
        avg_order_value: safeNumber(performance.avg_order_value),
        active_days: safeNumber(performance.active_days)
      },
      categories: categoryPerformance.map((cat: any) => ({
        category: cat.category,
        items_count: safeNumber(cat.items_count),
        orders_count: safeNumber(cat.orders_count),
        revenue: safeNumber(cat.revenue),
        avg_price: safeNumber(cat.avg_price)
      })),
      top_performers: (topPerformers || []).map((item: any) => ({
        name: item.name,
        category: item.category,
        orders: safeNumber(item.orders),
        quantity: safeNumber(item.quantity),
        revenue: safeNumber(item.revenue)
      }))
    };

  } catch (error) {
    console.error('❌ Error generating menu analytics:', error);
    return {
      overall: {},
      categories: [],
      top_performers: []
    };
  }
}

// Main GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const includePacks = searchParams.get('include_packs') !== 'false'; // Default true
    const includeAIPacks = searchParams.get('include_ai_packs') === 'true';

    console.log('📊 Menu API Request:', { restaurantId, includeAnalytics, includePacks, includeAIPacks });

    // Fetch menu items
    const menuItems = await getMenuItemsWithAnalytics(restaurantId, includeAnalytics);

    // Prepare response data
    const responseData: any = {
      menuItems,
      totalItems: menuItems.length,
      categories: [...new Set(menuItems.map((item: MenuItem) => item.category))],
    };

    // Include food packs if requested
    if (includePacks) {
      const existingPacks = await getExistingFoodPacks(restaurantId);
      responseData.foodPacks = existingPacks;
      responseData.totalPacks = existingPacks.length;
    }

    // Include AI-generated packs if requested
    if (includeAIPacks) {
      const aiPacks = await generateAIFoodPacks(restaurantId);
      responseData.aiRecommendedPacks = aiPacks;
      responseData.totalAIPacks = aiPacks.length;
    }

    // Include analytics if requested
    if (includeAnalytics) {
      const analytics = await getMenuAnalytics(restaurantId);
      responseData.analytics = analytics;
    }

    console.log('✅ Menu data fetched:', {
      items: responseData.totalItems,
      packs: responseData.totalPacks || 0,
      aiPacks: responseData.totalAIPacks || 0,
      analytics: includeAnalytics
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        restaurant_id: restaurantId,
        timestamp: new Date().toISOString(),
        include_analytics: includeAnalytics,
        include_packs: includePacks,
        include_ai_packs: includeAIPacks
      }
    });

  } catch (error) {
    console.error('❌ Menu API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch menu data',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: {
        menuItems: [],
        foodPacks: [],
        totalItems: 0,
        totalPacks: 0
      }
    }, { status: 500 });
  }
}

// POST handler for creating new menu items or packs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, restaurant_id = '1' } = body;

    console.log('📝 Menu POST Request:', { action, restaurant_id });

    switch (action) {
      case 'create_menu_item':
        return await createMenuItem(body);
      
      case 'create_food_pack':
        return await createFoodPack(body);
      
      case 'generate_ai_recommendations':
        return await generateAIRecommendations(body);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Menu POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new menu item
async function createMenuItem(data: any): Promise<NextResponse> {
  try {
    const { restaurant_id, name, description, category, price, image } = data;
    
    if (!name || !category || !price) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, category, price'
      }, { status: 400 });
    }

    const insertSQL = `
      INSERT INTO menu (Nama_Menu, Deskripsi, Kategori, Harga, Status, id_restaurant, Gambar)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `;

    // Handle image data (convert from base64 if provided)
    let imageBuffer = null;
    if (image && image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    const result = await query(insertSQL, [
      name,
      description || 'No description provided',
      category,
      parseInt(price),
      parseInt(restaurant_id),
      imageBuffer
    ]);

    console.log('✅ Menu item created successfully');

    return NextResponse.json({
      success: true,
      message: 'Menu item created successfully',
      data: {
        id: (result as any).insertId,
        name,
        category,
        price: parseInt(price)
      }
    });

  } catch (error) {
    console.error('❌ Error creating menu item:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create menu item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new food pack
async function createFoodPack(data: any): Promise<NextResponse> {
  try {
    const { restaurant_id, pack_id, item_ids } = data;
    
    if (!pack_id || !item_ids || !Array.isArray(item_ids) || item_ids.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pack data: need pack_id and at least 2 item_ids'
      }, { status: 400 });
    }

    // Verify all items exist and belong to the restaurant
    const verifySQL = `
      SELECT Id_Menu, Nama_Menu, Harga 
      FROM menu 
      WHERE Id_Menu IN (${item_ids.map(() => '?').join(',')}) 
        AND id_restaurant = ? 
        AND Status = 1
    `;

    const items = await query(verifySQL, [...item_ids, parseInt(restaurant_id)]);
    
    if (!items || items.length !== item_ids.length) {
      return NextResponse.json({
        success: false,
        error: 'Some menu items not found or not available'
      }, { status: 400 });
    }

    // Delete existing pack entries for this pack_id
    await query('DELETE FROM PAKET WHERE id_paket = ? AND id_restaurant = ?', [
      pack_id, 
      parseInt(restaurant_id)
    ]);

    // Insert new pack entries
    const insertPromises = item_ids.map((itemId: number) => 
      query('INSERT INTO PAKET (id_paket, id_menu, id_restaurant) VALUES (?, ?, ?)', [
        pack_id,
        itemId,
        parseInt(restaurant_id)
      ])
    );

    await Promise.all(insertPromises);

    console.log(`✅ Food pack ${pack_id} created with ${item_ids.length} items`);

    return NextResponse.json({
      success: true,
      message: 'Food pack created successfully',
      data: {
        pack_id,
        item_count: item_ids.length,
        items: items.map((item: any) => item.Nama_Menu),
        total_price: items.reduce((sum: number, item: any) => sum + item.Harga, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error creating food pack:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create food pack',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate AI recommendations
async function generateAIRecommendations(data: any): Promise<NextResponse> {
  try {
    const { restaurant_id, recommendation_type = 'food_packs', options = {} } = data;
    
    console.log('🤖 Generating AI recommendations:', { restaurant_id, recommendation_type });

    let recommendations: any[] = [];

    switch (recommendation_type) {
      case 'food_packs':
        recommendations = await generateAIFoodPacks(restaurant_id);
        break;
      
      case 'menu_optimization':
        recommendations = await generateMenuOptimizationRecommendations(restaurant_id);
        break;
      
      case 'pricing_strategy':
        recommendations = await generatePricingRecommendations(restaurant_id);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid recommendation type'
        }, { status: 400 });
    }

    console.log(`✅ Generated ${recommendations.length} AI recommendations`);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        type: recommendation_type,
        count: recommendations.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating AI recommendations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate AI recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Placeholder functions for additional AI features
async function generateMenuOptimizationRecommendations(restaurantId: string): Promise<any[]> {
  return [
    {
      type: 'menu_optimization',
      title: 'Menu Performance Analysis',
      description: 'AI-powered analysis of menu item performance with optimization suggestions',
      recommendations: [
        'Consider promoting high-margin items',
        'Review underperforming items for recipe improvements',
        'Optimize menu layout for better sales'
      ]
    }
  ];
}

async function generatePricingRecommendations(restaurantId: string): Promise<any[]> {
  return [
    {
      type: 'pricing_strategy',
      title: 'Dynamic Pricing Recommendations',
      description: 'AI-generated pricing strategy based on market analysis and customer behavior',
      recommendations: [
        'Implement time-based pricing for peak hours',
        'Consider bundle pricing for popular combinations',
        'Review competitor pricing for market positioning'
      ]
    }
  ];
}