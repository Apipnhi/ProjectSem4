// app/api/food-packs/route.ts
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

// GET - Fetch existing food packs and AI recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const type = searchParams.get('type') || 'existing'; // 'existing' or 'recommendations'

    console.log('Fetching food packs:', { restaurantId, type });

    if (type === 'recommendations') {
      // Generate AI recommendations based on ALL TIME sales data
      return await generateComprehensivePackRecommendations(parseInt(restaurantId));
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

    console.log('Packs SQL:', packsSQL);

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
      pack.price = Math.round(originalPrice * 0.9); // 10% discount
      pack.description = `${pack.items.join(' + ')} (10% discount)`;
    });

    console.log(`Found ${packs.length} existing food packs`);

    return NextResponse.json({
      success: true,
      data: packs,
      summary: {
        total: packs.length,
        averageDiscount: 10
      }
    });

  } catch (error) {
    console.error('Error fetching food packs:', error);
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

// Generate comprehensive AI pack recommendations using ALL TIME DATA
async function generateComprehensivePackRecommendations(restaurantId: number) {
  try {
    console.log('Generating comprehensive AI pack recommendations...');

    // Get menu items with comprehensive sales data (ALL TIME)
    const menuSalesSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Harga,
        m.Kategori,
        
        -- ALL TIME sales data
        COALESCE(SUM(mm.kuantitas), 0) as total_sold,
        COALESCE(COUNT(DISTINCT mm.id_customer), 0) as unique_customers,
        COALESCE(SUM(mm.kuantitas * m.Harga), 0) as total_revenue,
        
        -- Average sales per month (if data available)
        CASE 
          WHEN MIN(c.Tanggal_Order) IS NOT NULL THEN
            COALESCE(SUM(mm.kuantitas), 0) / GREATEST(1, DATEDIFF(CURDATE(), MIN(c.Tanggal_Order)) / 30)
          ELSE 0
        END as avg_monthly_sales,
        
        -- Recent performance (last 3 months)
        COALESCE(SUM(CASE 
          WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) 
          THEN mm.kuantitas ELSE 0 END), 0) as recent_sales,
        
        -- Peak month performance
        (SELECT MAX(monthly_sales) FROM (
          SELECT SUM(mm2.kuantitas) as monthly_sales
          FROM MEMESAN_MENU mm2 
          JOIN Customer c2 ON mm2.id_customer = c2.Invoice_Id 
          WHERE mm2.id_menu = m.Id_Menu 
          GROUP BY DATE_FORMAT(c2.Tanggal_Order, '%Y-%m')
        ) peak_data) as peak_monthly_sales,
        
        -- Category popularity
        (SELECT COUNT(*) FROM menu m2 WHERE m2.Kategori = m.Kategori AND m2.id_restaurant = m.id_restaurant) as category_count,
        
        -- Price positioning within category
        (SELECT AVG(m3.Harga) FROM menu m3 WHERE m3.Kategori = m.Kategori AND m3.id_restaurant = m.id_restaurant) as category_avg_price
        
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ${restaurantId}
        AND m.Status = 1
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Harga, m.Kategori
      ORDER BY total_sold DESC, total_revenue DESC
    `;

    const menuSales = await query(menuSalesSQL);
    console.log(`Found ${menuSales.length} menu items for comprehensive pack generation`);

    if (menuSales.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No menu data available for recommendations'
      });
    }

    // Create comprehensive prompt for AI
    const prompt = `
Berdasarkan data penjualan KOMPREHENSIF menu restoran berikut, buatkan 5-6 rekomendasi paket makanan yang strategis:

DATA MENU & ANALISIS LENGKAP:
${menuSales.map((item: any) => 
  `- ${item.Nama_Menu} (${item.Kategori}) - Harga: Rp${item.Harga.toLocaleString()}
    ALL TIME: ${item.total_sold} terjual | ${item.unique_customers} customers unik | Revenue: Rp${item.total_revenue.toLocaleString()}
    Avg Monthly: ${Math.round(item.avg_monthly_sales)} | Recent 3mo: ${item.recent_sales} | Peak: ${item.peak_monthly_sales || 0}
    Category: ${item.category_count} items | Avg Price: Rp${Math.round(item.category_avg_price).toLocaleString()}`
).join('\n')}

ANALISIS MENDALAM UNTUK PAKET:
1. Gunakan ALL TIME data untuk mengidentifikasi menu yang benar-benar populer
2. Kombinasi yang saling melengkapi berdasarkan kategori dan harga
3. Berdasarkan customer behavior (unique customers vs total sales)
4. Leverage menu dengan peak performance tinggi
5. Pertimbangkan price positioning dalam kategori

KRITERIA PAKET YANG DIINGINKAN:
- Paket Value: Kombinasi best seller + complementary items
- Paket Premium: High-revenue items dengan margin baik
- Paket Family: Multiple portions untuk sharing
- Paket Discovery: Introduce lesser-known items dengan popular ones
- Paket Seasonal: Berdasarkan peak performance patterns
- Paket Budget: Affordable combination dengan value tinggi

Format JSON response:
{
  "recommendations": [
    {
      "name": "Nama Paket",
      "description": "Deskripsi strategis paket",
      "items": ["Menu 1", "Menu 2", "Menu 3"],
      "estimatedPrice": 75000,
      "reasoning": "Alasan mendalam berdasarkan data historis dan customer behavior",
      "type": "Value Pack/Premium Pack/Family Pack/Discovery Pack/Seasonal Pack/Budget Pack",
      "discountPercent": 18
    }
  ]
}

PENTING: Berikan rekomendasi yang didasarkan pada ANALISIS MENDALAM dari seluruh data historis, bukan hanya asumsi.
`;

    try {
      const aiResponse = await callGroqLLM(prompt, 2048, 0.4);
      console.log('AI Response received for comprehensive pack recommendations');
      
      // Parse AI response
      let cleanedContent = aiResponse.trim();
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonString = cleanedContent.substring(jsonStart, jsonEnd);
      const aiResult = JSON.parse(jsonString);
      
      if (aiResult.recommendations && Array.isArray(aiResult.recommendations)) {
        // Format recommendations for frontend
        const formattedRecs = aiResult.recommendations.map((rec: any, index: number) => ({
          id: Date.now() + index,
          name: rec.name || `AI Pack ${index + 1}`,
          description: rec.description || 'AI generated food pack based on comprehensive data',
          items: rec.items || [],
          price: rec.estimatedPrice || 50000,
          type: rec.type || 'AI Recommended',
          generated: true,
          reasoning: rec.reasoning || 'Based on comprehensive historical sales data analysis',
          discountPercent: rec.discountPercent || 15
        }));

        console.log(`Generated ${formattedRecs.length} comprehensive AI pack recommendations`);

        return NextResponse.json({
          success: true,
          data: formattedRecs,
          summary: {
            total: formattedRecs.length,
            source: 'AI Generated (Comprehensive Data)',
            basedOn: `${menuSales.length} menu items with complete sales history`
          }
        });
      } else {
        throw new Error('Invalid AI response format');
      }

    } catch (aiError) {
      console.error('AI generation failed, using comprehensive fallback:', aiError);
      
      // Comprehensive fallback recommendations based on ALL TIME data
      const fallbackRecs = generateComprehensiveFallbackRecommendations(menuSales);
      
      return NextResponse.json({
        success: true,
        data: fallbackRecs,
        summary: {
          total: fallbackRecs.length,
          source: 'Comprehensive Fallback Algorithm',
          basedOn: `${menuSales.length} menu items with complete sales history`
        }
      });
    }

  } catch (error) {
    console.error('Error generating comprehensive pack recommendations:', error);
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

// Comprehensive fallback recommendation generator using ALL TIME DATA
function generateComprehensiveFallbackRecommendations(menuSales: any[]): any[] {
  const recommendations = [];
  
  // Sort by different metrics for comprehensive analysis
  const byTotalSales = [...menuSales].sort((a, b) => b.total_sold - a.total_sold);
  const byRevenue = [...menuSales].sort((a, b) => b.total_revenue - a.total_revenue);
  const byRecentPerformance = [...menuSales].sort((a, b) => b.recent_sales - a.recent_sales);
  const byCustomerReach = [...menuSales].sort((a, b) => b.unique_customers - a.unique_customers);
  
  // Get items by category
  const categories = [...new Set(menuSales.map((item: any) => item.Kategori))];
  const mainCourse = menuSales.filter((item: any) => item.Kategori === 'Main Course');
  const beverages = menuSales.filter((item: any) => item.Kategori === 'Beverage');
  const appetizers = menuSales.filter((item: any) => item.Kategori === 'Appetizer');
  const desserts = menuSales.filter((item: any) => item.Kategori === 'Dessert');
  
  // Pack 1: All-Time Best Seller Pack
  if (byTotalSales.length >= 2 && beverages.length > 0) {
    const bestSeller = byTotalSales[0];
    const drink = beverages.sort((a, b) => b.total_sold - a.total_sold)[0];
    const originalPrice = bestSeller.Harga + drink.Harga;
    
    recommendations.push({
      id: Date.now() + 1,
      name: 'Paket All-Time Favorite',
      description: `${bestSeller.Nama_Menu} + ${drink.Nama_Menu}`,
      items: [bestSeller.Nama_Menu, drink.Nama_Menu],
      price: Math.round(originalPrice * 0.82), // 18% discount
      type: 'Value Pack',
      generated: true,
      reasoning: `Berdasarkan data historis, ${bestSeller.Nama_Menu} terjual ${bestSeller.total_sold} kali dengan ${bestSeller.unique_customers} customers unik. Kombinasi terbaik untuk customer satisfaction.`,
      discountPercent: 18
    });
  }
  
  // Pack 2: Revenue Champion Pack
  if (byRevenue.length >= 2 && appetizers.length > 0) {
    const revenueChamp = byRevenue[0];
    const appetizer = appetizers.sort((a, b) => b.total_revenue - a.total_revenue)[0];
    const originalPrice = revenueChamp.Harga + appetizer.Harga;
    
    recommendations.push({
      id: Date.now() + 2,
      name: 'Paket Premium Revenue',
      description: `${revenueChamp.Nama_Menu} + ${appetizer.Nama_Menu}`,
      items: [revenueChamp.Nama_Menu, appetizer.Nama_Menu],
      price: Math.round(originalPrice * 0.85), // 15% discount
      type: 'Premium Pack',
      generated: true,
      reasoning: `Menu dengan revenue tertinggi Rp${revenueChamp.total_revenue.toLocaleString()} sepanjang masa. Peak performance ${revenueChamp.peak_monthly_sales || 0} per bulan.`,
      discountPercent: 15
    });
  }
  
  // Pack 3: Customer Favorite Pack  
  if (byCustomerReach.length >= 3) {
    const customerFav1 = byCustomerReach[0];
    const customerFav2 = byCustomerReach[1];
    const customerFav3 = byCustomerReach[2];
    const originalPrice = customerFav1.Harga + customerFav2.Harga + customerFav3.Harga;
    
    recommendations.push({
      id: Date.now() + 3,
      name: 'Paket Customer Champion',
      description: `${customerFav1.Nama_Menu} + ${customerFav2.Nama_Menu} + ${customerFav3.Nama_Menu}`,
      items: [customerFav1.Nama_Menu, customerFav2.Nama_Menu, customerFav3.Nama_Menu],
      price: Math.round(originalPrice * 0.78), // 22% discount
      type: 'Family Pack',
      generated: true,
      reasoning: `Kombinasi menu dengan jangkauan customer terluas: ${customerFav1.unique_customers} + ${customerFav2.unique_customers} + ${customerFav3.unique_customers} unique customers.`,
      discountPercent: 22
    });
  }
  
  // Pack 4: Rising Star Pack (Recent Performance)
  if (byRecentPerformance.length >= 2 && desserts.length > 0) {
    const risingStar = byRecentPerformance[0];
    const dessert = desserts.sort((a, b) => b.recent_sales - a.recent_sales)[0];
    const originalPrice = risingStar.Harga + dessert.Harga;
    
    recommendations.push({
      id: Date.now() + 4,
      name: 'Paket Rising Star',
      description: `${risingStar.Nama_Menu} + ${dessert.Nama_Menu}`,
      items: [risingStar.Nama_Menu, dessert.Nama_Menu],
      price: Math.round(originalPrice * 0.88), // 12% discount
      type: 'Discovery Pack',
      generated: true,
      reasoning: `Berdasarkan performa 3 bulan terakhir: ${risingStar.recent_sales} penjualan. Trend naik dari rata-rata bulanan ${Math.round(risingStar.avg_monthly_sales)}.`,
      discountPercent: 12
    });
  }
  
  // Pack 5: Balanced Value Pack
  if (mainCourse.length >= 2 && beverages.length > 0) {
    const balancedMain = mainCourse.sort((a, b) => 
      (b.total_sold / b.Harga) - (a.total_sold / a.Harga)
    )[0]; // Best value for money
    const drink = beverages[0];
    const originalPrice = balancedMain.Harga + drink.Harga;
    
    recommendations.push({
      id: Date.now() + 5,
      name: 'Paket Balanced Value',
      description: `${balancedMain.Nama_Menu} + ${drink.Nama_Menu}`,
      items: [balancedMain.Nama_Menu, drink.Nama_Menu],
      price: Math.round(originalPrice * 0.85), // 15% discount
      type: 'Budget Pack',
      generated: true,
      reasoning: `Menu dengan value terbaik: ${balancedMain.total_sold} penjualan dengan harga Rp${balancedMain.Harga.toLocaleString()}. Ratio penjualan/harga optimal.`,
      discountPercent: 15
    });
  }
  
  // Pack 6: Peak Performance Pack
  const peakPerformers = menuSales.filter(item => item.peak_monthly_sales > 0)
    .sort((a, b) => b.peak_monthly_sales - a.peak_monthly_sales);
  
  if (peakPerformers.length >= 2) {
    const peak1 = peakPerformers[0];
    const peak2 = peakPerformers[1];
    const originalPrice = peak1.Harga + peak2.Harga;
    
    recommendations.push({
      id: Date.now() + 6,
      name: 'Paket Peak Performance',
      description: `${peak1.Nama_Menu} + ${peak2.Nama_Menu}`,
      items: [peak1.Nama_Menu, peak2.Nama_Menu],
      price: Math.round(originalPrice * 0.80), // 20% discount
      type: 'Seasonal Pack',
      generated: true,
      reasoning: `Kombinasi menu dengan peak performance tertinggi: ${peak1.peak_monthly_sales} dan ${peak2.peak_monthly_sales} penjualan per bulan pada masa terbaik.`,
      discountPercent: 20
    });
  }
  
  return recommendations;
}

// POST - Save selected AI recommendation to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedPack, restaurantId = 1 } = body;

    console.log('Saving selected pack to database:', selectedPack);

    if (!selectedPack || !selectedPack.items || selectedPack.items.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid pack data or no items selected'
        },
        { status: 400 }
      );
    }

    // Get menu IDs for the selected items
    const itemNames = selectedPack.items.map((item: string) => `'${item.replace(/'/g, "''")}'`).join(',');
    const menuQuery = `
      SELECT Id_Menu, Nama_Menu 
      FROM menu 
      WHERE Nama_Menu IN (${itemNames}) 
        AND id_restaurant = ${parseInt(restaurantId)}
    `;

    const menuItems = await query(menuQuery);
    
    if (menuItems.length !== selectedPack.items.length) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Some menu items not found in database'
        },
        { status: 400 }
      );
    }

    // Insert pack items into PAKET table
    const insertPromises = menuItems.map((item: any) => {
      const insertSQL = `
        INSERT INTO PAKET (id_menu, id_restaurant) 
        VALUES (${item.Id_Menu}, ${parseInt(restaurantId)})
      `;
      return query(insertSQL);
    });

    await Promise.all(insertPromises);

    console.log('Pack saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Food pack saved successfully',
      data: {
        name: selectedPack.name,
        items: selectedPack.items,
        menuIds: menuItems.map((item: any) => item.Id_Menu)
      }
    });

  } catch (error) {
    console.error('Error saving food pack:', error);
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

    console.log(`Deleting food pack with ID: ${packId}`);

    // Delete all items in the pack
    const deleteSQL = `DELETE FROM PAKET WHERE id_paket = ${parseInt(packId)}`;
    await query(deleteSQL);

    console.log('Food pack deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Food pack deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting food pack:', error);
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