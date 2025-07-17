// app/api/food-packs/route.ts - Fixed with proper data type handling
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface FoodPack {
  id_paket: number;
  id_menu: number;
  id_restaurant: number;
  nama_paket?: string;
  deskripsi_paket?: string;
  harga_paket?: number;
  status_paket?: boolean;
  created_at?: string;
}

interface PackRecommendation {
  name: string;
  description: string;
  items: string[];
  estimatedPrice: number;
  reasoning: string;
  type: string;
  discountPercent: number;
}

// GET - Fetch existing food packs and comprehensive AI recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const type = searchParams.get('type') || 'existing';

    console.log('🔍 Fetching food packs with ALL TIME data analysis:', { restaurantId, type });

    if (type === 'recommendations') {
      // Generate comprehensive AI recommendations using ALL TIME sales data
      return await generateUltraComprehensivePackRecommendations(parseInt(restaurantId));
    }

    // Get existing packs from database
    const packsSQL = `
      SELECT 
        p.id_paket,
        p.id_menu,
        p.id_restaurant,
        m.Nama_Menu,
        m.Harga,
        m.Kategori,
        m.Deskripsi
      FROM PAKET p
      JOIN menu m ON p.id_menu = m.Id_Menu
      WHERE p.id_restaurant = ${parseInt(restaurantId)}
      ORDER BY p.id_paket
    `;

    const packsResult = await query(packsSQL);

    // Group by pack ID to create pack objects
    const packsMap = new Map();
    
    packsResult.forEach((row: any) => {
      const packId = row.id_paket;
      if (!packsMap.has(packId)) {
        packsMap.set(packId, {
          id: packId,
          name: `Food Pack ${packId}`,
          description: `Combination pack`,
          items: [],
          price: 0,
          type: "Existing Pack",
          generated: false
        });
      }
      
      const pack = packsMap.get(packId);
      pack.items.push(row.Nama_Menu);
      pack.price += row.Harga;
    });

    const packs = Array.from(packsMap.values());

    // Apply discount to existing packs (10% default)
    packs.forEach(pack => {
      const originalPrice = pack.price;
      pack.price = Math.round(originalPrice * 0.9);
      pack.description = `${pack.items.join(' + ')} (10% discount)`;
    });

    console.log(`✅ Found ${packs.length} existing food packs`);

    return NextResponse.json({
      success: true,
      data: packs,
      summary: {
        total: packs.length,
        averageDiscount: 10
      }
    });

  } catch (error) {
    console.error('❌ Error fetching food packs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch food packs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Save AI-generated pack to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedPack, restaurantId } = body;

    if (!selectedPack || !selectedPack.items || !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack data or restaurant ID' },
        { status: 400 }
      );
    }

    console.log(`💾 Saving selected pack: ${selectedPack.name} for restaurant ${restaurantId}`);

    // Get menu IDs for the selected items
    const menuItemsSQL = `
      SELECT Id_Menu, Nama_Menu 
      FROM menu 
      WHERE Nama_Menu IN (${selectedPack.items.map(() => '?').join(',')}) 
        AND id_restaurant = ?
    `;

    const menuItems = await query(menuItemsSQL, [...selectedPack.items, restaurantId]);

    if (menuItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching menu items found' },
        { status: 400 }
      );
    }

    // Get next pack ID
    const maxPackIdSQL = `SELECT COALESCE(MAX(id_paket), 0) + 1 as next_id FROM PAKET`;
    const maxPackResult = await query(maxPackIdSQL);
    const nextPackId = maxPackResult[0]?.next_id || 1;

    // Insert pack items
    for (const menuItem of menuItems) {
      const insertSQL = `
        INSERT INTO PAKET (id_paket, id_menu, id_restaurant)
        VALUES (?, ?, ?)
      `;
      await query(insertSQL, [nextPackId, menuItem.Id_Menu, restaurantId]);
    }

    console.log(`✅ Saved pack with ID ${nextPackId} containing ${menuItems.length} items`);

    return NextResponse.json({
      success: true,
      message: 'Food pack saved successfully',
      packId: nextPackId,
      itemsSaved: menuItems.length
    });

  } catch (error) {
    console.error('❌ Error saving food pack:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save food pack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate ULTRA COMPREHENSIVE AI pack recommendations using ALL TIME DATA
async function generateUltraComprehensivePackRecommendations(restaurantId: number) {
  try {
    console.log('🤖 Generating ULTRA COMPREHENSIVE AI pack recommendations using ALL TIME data...');

    // Get COMPLETE menu items with comprehensive sales data (ALL TIME) - FIXED QUERY
    const menuSalesSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Harga,
        m.Kategori,
        
        -- COMPREHENSIVE ALL TIME METRICS
        COALESCE(COUNT(DISTINCT mm.id_customer), 0) as total_orders,
        COALESCE(SUM(mm.kuantitas), 0) as total_quantity,
        COALESCE(COUNT(DISTINCT c.Invoice_Id), 0) as unique_customers,
        COALESCE(SUM(mm.kuantitas * m.Harga), 0) as total_revenue,
        
        -- TEMPORAL ANALYSIS (Complete History)
        CASE 
          WHEN COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m')) > 0 
          THEN COALESCE(SUM(mm.kuantitas), 0) / COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m'))
          ELSE 0 
        END as avg_monthly_quantity,
        
        CASE 
          WHEN COUNT(DISTINCT DATE(c.Tanggal_Order)) > 0 
          THEN COALESCE(SUM(mm.kuantitas), 0) / COUNT(DISTINCT DATE(c.Tanggal_Order))
          ELSE 0 
        END as avg_daily_quantity,
        
        -- PEAK PERFORMANCE ANALYSIS
        (SELECT DATE_FORMAT(c2.Tanggal_Order, '%Y-%m') 
         FROM MEMESAN_MENU mm2 
         JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id 
         WHERE mm2.id_menu = m.Id_Menu 
         GROUP BY DATE_FORMAT(c2.Tanggal_Order, '%Y-%m')
         ORDER BY SUM(mm2.kuantitas) DESC 
         LIMIT 1) as peak_month,
        
        (SELECT COALESCE(MAX(monthly_quantity), 0) FROM (
          SELECT SUM(mm3.kuantitas) as monthly_quantity
          FROM MEMESAN_MENU mm3 
          JOIN Customer c3 ON mm3.id_customer = c3.Invoice_Id 
          WHERE mm3.id_menu = m.Id_Menu 
          GROUP BY DATE_FORMAT(c3.Tanggal_Order, '%Y-%m')
        ) peak_data) as peak_monthly_quantity,
        
        -- CUSTOMER BEHAVIOR ANALYSIS - FIXED to handle division by zero
        CASE 
          WHEN COUNT(DISTINCT c.Invoice_Id) > 0 
          THEN ROUND(COALESCE(SUM(mm.kuantitas), 0) / COUNT(DISTINCT c.Invoice_Id), 2)
          ELSE 0 
        END as avg_quantity_per_customer,
        
        -- RECENT vs HISTORICAL PERFORMANCE
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) 
          THEN mm.kuantitas ELSE 0 END), 0) as recent_3months_quantity,
        
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
          THEN mm.kuantitas ELSE 0 END), 0) as recent_1month_quantity,
        
        -- PRICE PERFORMANCE METRICS - FIXED with proper NULL handling
        CASE 
          WHEN (SELECT AVG(m2.Harga) FROM menu m2 WHERE m2.Kategori = m.Kategori AND m2.id_restaurant = m.id_restaurant) > 0
          THEN m.Harga / (SELECT AVG(m2.Harga) FROM menu m2 WHERE m2.Kategori = m.Kategori AND m2.id_restaurant = m.id_restaurant)
          ELSE 1 
        END as price_vs_category_avg,
        
        CASE 
          WHEN SUM(mm.kuantitas) > 0
          THEN COALESCE(SUM(mm.kuantitas * m.Harga), 0) / SUM(mm.kuantitas)
          ELSE m.Harga
        END as revenue_per_unit,
        
        -- PAIRING POTENTIAL ANALYSIS
        (SELECT COUNT(DISTINCT mm4.id_customer) 
         FROM MEMESAN_MENU mm4 
         JOIN MEMESAN_MENU mm5 ON mm4.id_customer = mm5.id_customer 
         WHERE mm4.id_menu = m.Id_Menu AND mm5.id_menu != m.Id_Menu) as customers_who_order_other_items,
        
        -- CONSISTENCY METRICS - FIXED with proper NULL handling
        CASE 
          WHEN COUNT(DISTINCT DATE_FORMAT(c.Tanggal_Order, '%Y-%m')) >= 3 THEN
            COALESCE((
              SELECT 
                CASE WHEN AVG(monthly_quantity) > 0 
                THEN (MAX(monthly_quantity) - MIN(monthly_quantity)) / AVG(monthly_quantity)
                ELSE 0 END
              FROM (
                SELECT SUM(mm_sub.kuantitas) as monthly_quantity
                FROM MEMESAN_MENU mm_sub
                JOIN Customer c_sub ON mm_sub.id_customer = c_sub.Invoice_Id
                WHERE mm_sub.id_menu = m.Id_Menu
                GROUP BY DATE_FORMAT(c_sub.Tanggal_Order, '%Y-%m')
              ) monthly_data
            ), 0)
          ELSE 0
        END as consistency_coefficient
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ${restaurantId}
        AND m.Status = 1
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga, m.Kategori
      ORDER BY total_revenue DESC, total_quantity DESC
    `;

    console.log('🔍 Executing SQL:', menuSalesSQL.substring(0, 200) + '...');
    console.log('📋 Parameters:', restaurantId);

    const menuSales = await query(menuSalesSQL);
    console.log(`✅ Query successful, rows returned: ${menuSales.length}`);
    console.log(`📊 Found ${menuSales.length} menu items with COMPLETE historical analysis`);

    if (menuSales.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No comprehensive menu data available for recommendations'
      });
    }

    // Get COMPREHENSIVE pairing analysis (ALL TIME)
    const pairingAnalysisSQL = `
      SELECT 
        m1.Nama_Menu as item1,
        m2.Nama_Menu as item2,
        m1.Kategori as category1,
        m2.Kategori as category2,
        m1.Harga as price1,
        m2.Harga as price2,
        COUNT(DISTINCT mm1.id_customer) as co_occurrence_customers,
        COUNT(*) as co_occurrence_frequency,
        COALESCE(AVG(c.Harga_Total), 0) as avg_order_value_when_paired,
        
        -- PAIRING STRENGTH METRICS - FIXED with proper NULL handling
        CASE 
          WHEN (SELECT COUNT(DISTINCT mm_total.id_customer) FROM MEMESAN_MENU mm_total WHERE mm_total.id_menu = m1.Id_Menu) > 0
          THEN COUNT(DISTINCT mm1.id_customer) * 100.0 / (SELECT COUNT(DISTINCT mm_total.id_customer) FROM MEMESAN_MENU mm_total WHERE mm_total.id_menu = m1.Id_Menu)
          ELSE 0
        END as pairing_percentage_item1,
        
        CASE 
          WHEN (SELECT COUNT(DISTINCT mm_total2.id_customer) FROM MEMESAN_MENU mm_total2 WHERE mm_total2.id_menu = m2.Id_Menu) > 0
          THEN COUNT(DISTINCT mm1.id_customer) * 100.0 / (SELECT COUNT(DISTINCT mm_total2.id_customer) FROM MEMESAN_MENU mm_total2 WHERE mm_total2.id_menu = m2.Id_Menu)
          ELSE 0
        END as pairing_percentage_item2
        
      FROM MEMESAN_MENU mm1
      JOIN MEMESAN_MENU mm2 ON mm1.id_customer = mm2.id_customer 
        AND mm1.id_menu < mm2.id_menu
      JOIN menu m1 ON mm1.id_menu = m1.Id_Menu
      JOIN menu m2 ON mm2.id_menu = m2.Id_Menu
      JOIN Customer c ON mm1.id_customer = c.Invoice_Id
      WHERE m1.id_restaurant = ${restaurantId} 
        AND m2.id_restaurant = ${restaurantId}
        AND m1.Status = 1 AND m2.Status = 1
      GROUP BY m1.Id_Menu, m2.Id_Menu, m1.Nama_Menu, m2.Nama_Menu, 
               m1.Kategori, m2.Kategori, m1.Harga, m2.Harga
      HAVING co_occurrence_customers >= 2
      ORDER BY co_occurrence_customers DESC, avg_order_value_when_paired DESC
      LIMIT 50
    `;

    console.log('🔍 Executing SQL:', pairingAnalysisSQL.substring(0, 200) + '...');
    console.log('📋 Parameters:', restaurantId);

    const pairingData = await query(pairingAnalysisSQL);
    console.log(`✅ Query successful, rows returned: ${pairingData.length}`);
    console.log(`🔗 Found ${pairingData.length} significant pairing combinations from ALL TIME data`);

    // Create ULTRA COMPREHENSIVE prompt for AI
    const prompt = `
Berdasarkan ANALISIS KOMPREHENSIF data penjualan restoran SEPANJANG MASA, buatkan 6-8 rekomendasi paket makanan yang strategis dan data-driven:

COMPREHENSIVE MENU PERFORMANCE DATA (ALL TIME):
${menuSales.map((item: any) => 
  `🍽️ ${item.Nama_Menu} (${item.Kategori}) - Harga: Rp${Number(item.Harga || 0).toLocaleString()}
  📊 COMPLETE PERFORMANCE METRICS:
  - Total Orders: ${item.total_orders} | Total Quantity: ${item.total_quantity} | Revenue: Rp${Number(item.total_revenue || 0).toLocaleString()}
  - Unique Customers: ${item.unique_customers} | Avg per Customer: ${Number(item.avg_quantity_per_customer || 0).toFixed(2)}
  - Monthly Average: ${Number(item.avg_monthly_quantity || 0).toFixed(1)} | Daily Average: ${Number(item.avg_daily_quantity || 0).toFixed(2)}
  - Peak Performance: ${item.peak_month || 'N/A'} (${item.peak_monthly_quantity || 0} quantity)
  - Recent Trends: Last 90 days: ${item.recent_3months_quantity}, Last 30 days: ${item.recent_1month_quantity}
  
  🎯 STRATEGIC METRICS:
  - Price Position: ${Number(item.price_vs_category_avg || 1).toFixed(2)}x category average
  - Revenue per Unit: Rp${Number(item.revenue_per_unit || 0).toFixed(0)}
  - Cross-sell Potential: ${item.customers_who_order_other_items} customers order other items
  - Consistency Score: ${Number(item.consistency_coefficient || 0).toFixed(2)} (0=consistent, higher=volatile)`
).join('\n\n')}

COMPREHENSIVE PAIRING INTELLIGENCE (ALL TIME):
${pairingData.slice(0, 20).map((pair: any) => 
  `🤝 ${pair.item1} + ${pair.item2}
  - Categories: ${pair.category1} + ${pair.category2} | Prices: Rp${Number(pair.price1 || 0).toLocaleString()} + Rp${Number(pair.price2 || 0).toLocaleString()}
  - Co-occurrence: ${pair.co_occurrence_customers} customers, ${pair.co_occurrence_frequency} times
  - Pairing Strength: ${Number(pair.pairing_percentage_item1 || 0).toFixed(1)}% + ${Number(pair.pairing_percentage_item2 || 0).toFixed(1)}%
  - Avg Order Value when Paired: Rp${Number(pair.avg_order_value_when_paired || 0).toLocaleString()}`
).join('\n')}

ULTRA COMPREHENSIVE ANALYSIS FRAMEWORK:
Gunakan SELURUH DATA HISTORIS untuk rekomendasi paket yang akurat:

1. **DATA-DRIVEN PAIRING STRATEGY:**
   - Leverage proven pairing combinations dengan co-occurrence tinggi
   - Optimize berdasarkan avg order value when paired
   - Consider cross-category synergies dari pairing data

2. **PERFORMANCE-BASED SELECTION:**
   - Prioritize items dengan consistent performance (low consistency coefficient)
   - Balance high performers dengan complementary items
   - Leverage peak performance timing untuk seasonal packs

3. **REVENUE OPTIMIZATION:**
   - Create value propositions berdasarkan price positioning
   - Maximize revenue per unit potential
   - Strategic discount calculations berdasarkan historical margins

4. **CUSTOMER BEHAVIOR INSIGHTS:**
   - Leverage customer retention patterns (avg quantity per customer)
   - Utilize cross-sell potential data
   - Consider customer journey optimization

COMPREHENSIVE PACK CATEGORIES:
- **Champion Pack**: Top performers + proven pairings
- **Discovery Pack**: High potential + underperforming items boost
- **Value Pack**: High volume + optimal price points
- **Premium Pack**: High revenue per unit + luxury positioning
- **Seasonal Pack**: Peak performance timing + seasonal advantages
- **Family Pack**: High quantity per customer + sharing-friendly items
- **Cross-Category Pack**: Different categories + proven pairing data
- **Retention Pack**: High repeat customers + loyalty drivers

Format JSON response dengan reasoning mendalam:
{
  "recommendations": [
    {
      "name": "Data-Driven Pack Name",
      "description": "Strategic description berdasarkan comprehensive analysis",
      "items": ["Item 1", "Item 2", "Item 3"],
      "estimatedPrice": 85000,
      "reasoning": "Comprehensive reasoning berdasarkan ALL TIME data: [specific metrics], pairing data menunjukkan [co-occurrence stats], customer behavior [retention patterns], revenue optimization [calculations], seasonal advantage [peak performance data]",
      "type": "Champion Pack / Discovery Pack / Value Pack / Premium Pack / Seasonal Pack / Family Pack / Cross-Category Pack / Retention Pack",
      "discountPercent": 18
    }
  ]
}

CRITICAL: Berikan rekomendasi yang 100% berdasarkan COMPREHENSIVE ALL TIME DATA untuk akurasi dan efektivitas maksimal.
`;

    try {
      const aiResponse = await callGroqLLM(prompt, 4096, 0.3); // Max tokens for comprehensive analysis
      console.log('🤖 AI Response received for ultra comprehensive pack recommendations');
      
      // Enhanced parsing with comprehensive error handling
      let cleanedContent = aiResponse.trim();
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in comprehensive AI response');
      }
      
      const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
      const aiResult = JSON.parse(jsonString);
      
      if (aiResult.recommendations && Array.isArray(aiResult.recommendations)) {
        // Enhanced formatting for comprehensive recommendations
        const formattedRecs = aiResult.recommendations.map((rec: any, index: number) => ({
          id: Date.now() + index,
          name: rec.name || `Ultra AI Pack ${index + 1}`,
          description: rec.description || 'Comprehensive AI generated food pack based on complete historical data analysis',
          items: rec.items || [],
          price: rec.estimatedPrice || 75000,
          type: rec.type || 'AI Comprehensive Pack',
          generated: true,
          reasoning: rec.reasoning || 'Based on comprehensive ALL TIME sales data, pairing analysis, customer behavior patterns, and revenue optimization calculations',
          discountPercent: rec.discountPercent || 15
        }));

        console.log(`✅ Generated ${formattedRecs.length} ultra comprehensive AI pack recommendations`);

        return NextResponse.json({
          success: true,
          data: formattedRecs,
          summary: {
            total: formattedRecs.length,
            source: 'Ultra Comprehensive AI Analysis',
            basedOn: `ALL TIME data: ${menuSales.length} menu items, ${pairingData.length} pairing combinations`,
            dataDepth: 'Complete historical sales, customer behavior, pairing intelligence, performance metrics'
          }
        });
      } else {
        throw new Error('Invalid comprehensive AI response format');
      }

    } catch (aiError) {
      console.error('🔄 Comprehensive AI generation failed, using enhanced ALL TIME fallback:', aiError);
      
      // Ultra comprehensive fallback recommendations using ALL TIME data
      const fallbackRecs = generateUltraComprehensiveFallbackRecommendations(menuSales, pairingData);
      
      return NextResponse.json({
        success: true,
        data: fallbackRecs,
        summary: {
          total: fallbackRecs.length,
          source: 'Ultra Comprehensive Fallback Algorithm',
          basedOn: `ALL TIME data: ${menuSales.length} menu items with complete historical analysis`,
          dataDepth: 'Complete performance metrics, pairing analysis, customer behavior patterns'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error generating ultra comprehensive pack recommendations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate comprehensive pack recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Ultra comprehensive fallback recommendation generator using ALL TIME DATA
function generateUltraComprehensiveFallbackRecommendations(menuSales: any[], pairingData: any[]): any[] {
  const recommendations = [];
  
  // Sort by different comprehensive metrics with proper fallback values
  const byTotalRevenue = [...menuSales].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
  const byCustomerRetention = [...menuSales].sort((a, b) => (b.avg_quantity_per_customer || 0) - (a.avg_quantity_per_customer || 0));
  const byConsistency = [...menuSales].sort((a, b) => (a.consistency_coefficient || 0) - (b.consistency_coefficient || 0));
  const byCrossSellPotential = [...menuSales].sort((a, b) => (b.customers_who_order_other_items || 0) - (a.customers_who_order_other_items || 0));
  
  // Get best pairing combinations
  const topPairings = pairingData.slice(0, 10);
  
  // Categories analysis
  const categories = [...new Set(menuSales.map((item: any) => item.Kategori))];
  const getByCategory = (cat: string) => menuSales.filter((item: any) => item.Kategori === cat);
  
  // Pack 1: Revenue Champion Pack (ALL TIME best performers)
  if (byTotalRevenue.length >= 2) {
    const champion1 = byTotalRevenue[0];
    const champion2 = byTotalRevenue[1];
    const drinkCategory = getByCategory('Minuman').sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))[0];
    
    const items = [champion1.Nama_Menu, champion2.Nama_Menu];
    if (drinkCategory) items.push(drinkCategory.Nama_Menu);
    
    const originalPrice = (champion1.Harga || 0) + (champion2.Harga || 0) + (drinkCategory?.Harga || 0);
    
    recommendations.push({
      id: Date.now() + 1,
      name: 'Paket Revenue Champion',
      description: `${items.join(' + ')} - Kombinasi terbaik berdasarkan ALL TIME revenue performance`,
      items: items,
      price: Math.round(originalPrice * 0.82), // 18% discount
      type: 'Champion Pack',
      generated: true,
      reasoning: `Berdasarkan analisis ALL TIME: ${champion1.Nama_Menu} menghasilkan Rp${Number(champion1.total_revenue || 0).toLocaleString()} total revenue dengan ${champion1.unique_customers} unique customers. ${champion2.Nama_Menu} mencapai Rp${Number(champion2.total_revenue || 0).toLocaleString()}. Kombinasi terbukti mengoptimalkan revenue per transaction.`,
      discountPercent: 18
    });
  }
  
  // Pack 2: Customer Loyalty Pack (High retention + consistency)
  if (byCustomerRetention.length >= 2 && byConsistency.length >= 1) {
    const loyal1 = byCustomerRetention[0];
    const loyal2 = byCustomerRetention[1];
    const consistent = byConsistency[0];
    
    const items = [loyal1.Nama_Menu, loyal2.Nama_Menu];
    if (consistent.Nama_Menu !== loyal1.Nama_Menu && consistent.Nama_Menu !== loyal2.Nama_Menu) {
      items.push(consistent.Nama_Menu);
    }
    
    const originalPrice = (loyal1.Harga || 0) + (loyal2.Harga || 0) + (items.length > 2 ? (consistent.Harga || 0) : 0);
    
    recommendations.push({
      id: Date.now() + 2,
      name: 'Paket Customer Loyalty',
      description: `${items.join(' + ')} - Dirancang untuk customer retention maksimal`,
      items: items,
      price: Math.round(originalPrice * 0.85), // 15% discount
      type: 'Retention Pack',
      generated: true,
      reasoning: `ALL TIME data menunjukkan ${loyal1.Nama_Menu} memiliki avg ${Number(loyal1.avg_quantity_per_customer || 0).toFixed(2)} per customer dengan consistency coefficient ${Number(loyal1.consistency_coefficient || 0).toFixed(2)}. ${loyal2.Nama_Menu} mencapai ${Number(loyal2.avg_quantity_per_customer || 0).toFixed(2)} per customer. Kombinasi terbukti mendorong repeat orders.`,
      discountPercent: 15
    });
  }
  
  // Pack 3: Data-Driven Pairing Pack (Based on actual co-occurrence)
  if (topPairings.length > 0) {
    const bestPairing = topPairings[0];
    const items = [bestPairing.item1, bestPairing.item2];
    const originalPrice = (bestPairing.price1 || 0) + (bestPairing.price2 || 0);
    
    // Add complementary item from different category
    const complementary = menuSales.find(item => 
      item.Nama_Menu !== bestPairing.item1 && 
      item.Nama_Menu !== bestPairing.item2 && 
      item.Kategori !== bestPairing.category1 && 
      item.Kategori !== bestPairing.category2
    );
    
    if (complementary) {
      items.push(complementary.Nama_Menu);
    }
    
    const finalPrice = originalPrice + (complementary?.Harga || 0);
    
    recommendations.push({
      id: Date.now() + 3,
      name: 'Paket Perfect Pairing',
      description: `${items.join(' + ')} - Berdasarkan data pairing ALL TIME customers`,
      items: items,
      price: Math.round(finalPrice * 0.80), // 20% discount
      type: 'Cross-Category Pack',
      generated: true,
      reasoning: `ALL TIME pairing analysis: ${bestPairing.item1} + ${bestPairing.item2} dipilih bersama oleh ${bestPairing.co_occurrence_customers} customers dengan frequency ${bestPairing.co_occurrence_frequency}x. Average order value saat dipasangkan: Rp${Number(bestPairing.avg_order_value_when_paired || 0).toLocaleString()}.`,
      discountPercent: 20
    });
  }
  
  // Pack 4: Value Pack (High volume + affordable pricing)
  const valueItems = menuSales
    .filter(item => (item.total_quantity || 0) > 0)
    .sort((a, b) => (b.total_quantity || 0) - (a.total_quantity || 0))
    .slice(0, 4);
  
  if (valueItems.length >= 3) {
    const items = valueItems.slice(0, 3).map(item => item.Nama_Menu);
    const originalPrice = valueItems.slice(0, 3).reduce((sum, item) => sum + (item.Harga || 0), 0);
    
    recommendations.push({
      id: Date.now() + 4,
      name: 'Paket Value Maksimal',
      description: `${items.join(' + ')} - Paket hemat dengan volume terbesar`,
      items: items,
      price: Math.round(originalPrice * 0.75), // 25% discount
      type: 'Value Pack',
      generated: true,
      reasoning: `Pack berdasarkan item dengan volume tertinggi: ${valueItems[0].Nama_Menu} (${valueItems[0].total_quantity} total quantity), ${valueItems[1].Nama_Menu} (${valueItems[1].total_quantity}), ${valueItems[2].Nama_Menu} (${valueItems[2].total_quantity}). Memberikan value terbaik untuk customers.`,
      discountPercent: 25
    });
  }
  
  // Pack 5: Premium Pack (High revenue per unit)
  const premiumItems = menuSales
    .filter(item => (item.revenue_per_unit || 0) > 0)
    .sort((a, b) => (b.revenue_per_unit || 0) - (a.revenue_per_unit || 0))
    .slice(0, 3);
  
  if (premiumItems.length >= 2) {
    const items = premiumItems.slice(0, 2).map(item => item.Nama_Menu);
    const originalPrice = premiumItems.slice(0, 2).reduce((sum, item) => sum + (item.Harga || 0), 0);
    
    recommendations.push({
      id: Date.now() + 5,
      name: 'Paket Premium Experience',
      description: `${items.join(' + ')} - Pengalaman premium dengan revenue optimal`,
      items: items,
      price: Math.round(originalPrice * 0.88), // 12% discount
      type: 'Premium Pack',
      generated: true,
      reasoning: `Pack premium berdasarkan revenue per unit tertinggi: ${premiumItems[0].Nama_Menu} (Rp${Number(premiumItems[0].revenue_per_unit || 0).toFixed(0)} per unit), ${premiumItems[1].Nama_Menu} (Rp${Number(premiumItems[1].revenue_per_unit || 0).toFixed(0)} per unit). Mengoptimalkan profitability dan customer experience.`,
      discountPercent: 12
    });
  }
  
  // Pack 6: Cross-Sell Champion Pack
  if (byCrossSellPotential.length >= 2) {
    const crossSell1 = byCrossSellPotential[0];
    const crossSell2 = byCrossSellPotential[1];
    const items = [crossSell1.Nama_Menu, crossSell2.Nama_Menu];
    const originalPrice = (crossSell1.Harga || 0) + (crossSell2.Harga || 0);
    
    recommendations.push({
      id: Date.now() + 6,
      name: 'Paket Cross-Sell Master',
      description: `${items.join(' + ')} - Mendorong pembelian item tambahan`,
      items: items,
      price: Math.round(originalPrice * 0.85), // 15% discount
      type: 'Cross-Category Pack',
      generated: true,
      reasoning: `Items dengan cross-sell potential tertinggi: ${crossSell1.Nama_Menu} (${crossSell1.customers_who_order_other_items} customers order other items), ${crossSell2.Nama_Menu} (${crossSell2.customers_who_order_other_items} customers). Terbukti mendorong additional purchases.`,
      discountPercent: 15
    });
  }
  
  return recommendations.filter(rec => rec.items.length > 0 && rec.price > 0);
}

// DELETE - Remove food pack
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('pack_id');

    if (!packId) {
      return NextResponse.json(
        { success: false, error: 'Pack ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting food pack with ID: ${packId}`);

    // Delete all items in the pack
    const deleteSQL = `DELETE FROM PAKET WHERE id_paket = ?`;
    await query(deleteSQL, [parseInt(packId)]);

    console.log('✅ Food pack deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Food pack deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting food pack:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete food pack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}