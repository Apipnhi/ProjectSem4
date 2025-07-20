// app/api/promotions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Types
interface Promotion {
  type: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  details?: string;
}

interface AppliedPromotion extends Promotion {
  id: string;
  appliedAt: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  performance?: {
    orders: number;
    revenue: number;
    conversionRate: number;
  };
  restaurant_id: number;
}

// Helper function to safely convert to number
function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Helper function to call Groq API for AI promotion generation
async function callGroqAPI(prompt: string): Promise<string> {
  try {
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
            content: 'You are an expert restaurant marketing strategist specializing in promotional campaigns, customer acquisition, and revenue optimization. Provide creative, data-driven promotional strategies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate promotions';
  } catch (error) {
    console.error('❌ Error calling Groq API:', error);
    return 'AI promotion service temporarily unavailable. Using fallback promotions.';
  }
}

// Enhanced promotion generation with fallback
async function generateDataDrivenPromotions(restaurantId: number): Promise<Promotion[]> {
  try {
    console.log('🎯 Generating data-driven promotions...');

    // Get comprehensive restaurant data
    const [menuData, salesData, feedbackData] = await Promise.all([
      // Menu data
      query(`
        SELECT Id_Menu, Nama_Menu, Kategori, Harga, Deskripsi
        FROM menu 
        WHERE id_restaurant = ?
        ORDER BY Kategori, Harga
      `, [restaurantId]),

      // Sales performance data
      query(`
        SELECT 
          m.Nama_Menu,
          m.Kategori,
          m.Harga,
          COUNT(mm.id_menu) as order_count,
          SUM(mm.kuantitas) as total_quantity,
          AVG(c.Harga_Total) as avg_order_value
        FROM menu m
        LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
        LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
        WHERE m.id_restaurant = ?
        GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
        ORDER BY total_quantity DESC
      `, [restaurantId]),

      // Customer feedback data
      query(`
        SELECT 
          rating,
          feedback_text,
          feedback_date,
          COUNT(*) as feedback_count
        FROM CUSTOMER_FEEDBACK 
        WHERE id_restaurant = ?
        GROUP BY rating
        ORDER BY rating DESC
      `, [restaurantId])
    ]);

    // Prepare data summary for LLM
    const menuSummary = (menuData || []).map((item: any) => 
      `${item.Nama_Menu} (${item.Kategori}) - Rp${item.Harga}`
    ).join(', ');

    const salesSummary = (salesData || []).slice(0, 10).map((item: any) => 
      `${item.Nama_Menu}: ${item.total_quantity || 0} orders, avg Rp${item.avg_order_value || 0}`
    ).join(', ');

    const feedbackSummary = (feedbackData || []).map((item: any) => 
      `Rating ${item.rating}: ${item.feedback_count} reviews`
    ).join(', ');

    // Try LLM generation first
    try {
      const prompt = `Berdasarkan data restoran Indonesia berikut, buat 3-5 strategi promosi yang efektif:

MENU: ${menuSummary || 'No menu data'}
SALES: ${salesSummary || 'No sales data'}  
FEEDBACK: ${feedbackSummary || 'No feedback data'}

Buat promosi yang:
1. Meningkatkan penjualan menu kurang populer
2. Menarik pelanggan baru
3. Meningkatkan repeat orders
4. Sesuai dengan pasar Indonesia

Format JSON:
[
  {
    "type": "jenis promosi",
    "description": "deskripsi promosi",
    "reasoning": "alasan strategis",
    "estimatedImpact": "estimasi dampak",
    "details": "detail implementasi"
  }
]`;

      const llmResponse = await callGroqAPI(prompt);
      
      if (!llmResponse.includes('temporarily unavailable')) {
        try {
          // Try to parse JSON from LLM response
          const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
          const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
          const promotions = JSON.parse(jsonString);
          
          if (Array.isArray(promotions) && promotions.length > 0) {
            console.log('✅ Successfully generated LLM promotions');
            return promotions.map((promo: any) => ({
              type: promo.type || 'Promosi Spesial',
              description: promo.description || 'Promosi menarik untuk pelanggan',
              reasoning: promo.reasoning || 'Strategi untuk meningkatkan penjualan',
              estimatedImpact: promo.estimatedImpact || '+15% sales',
              details: promo.details || 'Detail implementasi promosi'
            }));
          }
        } catch (parseError) {
          console.error('❌ Failed to parse LLM promotion response:', parseError);
        }
      }
    } catch (llmError) {
      console.error('❌ LLM promotion generation failed:', llmError);
    }

    // Fallback to data-driven algorithmic promotions
    return generateAlgorithmicPromotions(menuData, salesData, feedbackData);

  } catch (error) {
    console.error('❌ Error generating promotions:', error);
    return getBasicFallbackPromotions();
  }
}

// Generate algorithmic promotions based on data analysis
function generateAlgorithmicPromotions(menuData: any[], salesData: any[], feedbackData: any[]): Promotion[] {
  console.log('🔄 Generating algorithmic promotions...');
  
  const promotions: Promotion[] = [];

  // Analyze sales data for underperforming items
  const sortedSales = (salesData || []).sort((a, b) => (a.total_quantity || 0) - (b.total_quantity || 0));
  const underperformingItems = sortedSales.slice(0, 3);
  const popularItems = sortedSales.slice(-3);

  // Promotion 1: Bundle Deal for underperforming items
  if (underperformingItems.length > 0 && popularItems.length > 0) {
    promotions.push({
      type: "Bundle Deal",
      description: `Paket hemat ${popularItems[0]?.Nama_Menu || 'menu populer'} + ${underperformingItems[0]?.Nama_Menu || 'menu pilihan'} dengan diskon 20%`,
      reasoning: "Menggabungkan menu populer dengan menu kurang laris untuk meningkatkan penjualan keseluruhan",
      estimatedImpact: "+25% sales pada menu kurang populer",
      details: "Diskon 20% untuk pembelian paket, berlaku setiap hari"
    });
  }

  // Promotion 2: Happy Hour for beverages
  const beverages = (menuData || []).filter((item: any) => 
    item.Kategori && item.Kategori.toLowerCase().includes('minuman')
  );
  
  if (beverages.length > 0) {
    promotions.push({
      type: "Happy Hour",
      description: "Diskon 30% untuk semua minuman dari pukul 14:00-16:00",
      reasoning: "Meningkatkan traffic pada jam sepi dan mendorong pembelian minuman",
      estimatedImpact: "+40% beverage sales during slow hours",
      details: "Berlaku Senin-Jumat, pukul 14:00-16:00, maksimal 2 minuman per customer"
    });
  }

  // Promotion 3: Loyalty program based on feedback
  const avgRating = feedbackData && feedbackData.length > 0 
    ? feedbackData.reduce((sum: number, item: any) => sum + (item.rating * item.feedback_count), 0) / 
      feedbackData.reduce((sum: number, item: any) => sum + item.feedback_count, 0)
    : 4.0;

  promotions.push({
    type: "Customer Loyalty",
    description: "Dapatkan 1 poin setiap pembelian Rp10,000. Tukar 10 poin dengan diskon 15%",
    reasoning: `Dengan rating rata-rata ${avgRating.toFixed(1)}, program loyalitas akan meningkatkan retention rate`,
    estimatedImpact: "+30% customer return rate",
    details: "Berlaku untuk semua transaksi, poin tidak expired, dapat dikombinasi dengan promo lain"
  });

  // Promotion 4: Weekend Special
  if (popularItems.length > 0) {
    promotions.push({
      type: "Weekend Special",
      description: `Weekend combo: ${popularItems[0]?.Nama_Menu || 'Menu spesial'} + minuman + dessert hanya Rp35,000`,
      reasoning: "Memanfaatkan traffic tinggi weekend dengan paket value yang menarik",
      estimatedImpact: "+20% weekend revenue",
      details: "Berlaku Sabtu-Minggu, tersedia sepanjang hari, hingga stok habis"
    });
  }

  // Promotion 5: New Customer Incentive
  promotions.push({
    type: "New Customer Welcome",
    description: "Diskon 25% untuk customer pertama kali + gratis minuman",
    reasoning: "Menarik customer baru dan memberikan experience positif untuk first impression",
    estimatedImpact: "+15% new customer acquisition",
    details: "Berlaku dengan menunjukkan ID, maksimal 1x per customer, tidak berlaku untuk delivery"
  });

  console.log(`✅ Generated ${promotions.length} algorithmic promotions`);
  return promotions;
}

// Basic fallback promotions
function getBasicFallbackPromotions(): Promotion[] {
  return [
    {
      type: "Basic Discount",
      description: "Diskon 15% untuk pembelian minimal Rp50,000",
      reasoning: "Promosi dasar untuk meningkatkan average order value",
      estimatedImpact: "+10% sales",
      details: "Berlaku setiap hari untuk dine-in dan takeaway"
    },
    {
      type: "Buy 2 Get 1",
      description: "Beli 2 menu utama, gratis 1 minuman",
      reasoning: "Promosi sederhana yang mudah dipahami customer",
      estimatedImpact: "+15% transaction size",
      details: "Berlaku untuk semua menu utama, pilih minuman termurah gratis"
    }
  ];
}

// GET endpoint to fetch promotions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const type = searchParams.get('type') || 'active';

    console.log(`🎯 Fetching promotions for restaurant ${restaurantId}, type: ${type}`);

    if (type === 'generate') {
      // Generate new promotion recommendations
      const promotions = await generateDataDrivenPromotions(restaurantId);
      
      return NextResponse.json({
        success: true,
        data: {
          promotions,
          summary: {
            totalPromotions: promotions.length,
            generatedAt: new Date().toISOString(),
            restaurantId: restaurantId
          }
        },
        metadata: {
          type: 'generated_recommendations',
          method: 'hybrid_llm_with_fallback'
        }
      });
    }

    // Fetch applied promotions from database
    const appliedPromotions = await query(`
      SELECT * FROM applied_promotions 
      WHERE id_restaurant = ? 
      ORDER BY applied_at DESC
    `, [restaurantId]);

    return NextResponse.json({
      success: true,
      data: {
        appliedPromotions: appliedPromotions || [],
        summary: {
          totalApplied: (appliedPromotions || []).length,
          active: (appliedPromotions || []).filter((p: any) => p.status === 'active').length,
          completed: (appliedPromotions || []).filter((p: any) => p.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching promotions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch promotions',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        promotions: [],
        appliedPromotions: []
      }
    }, { status: 500 });
  }
}

// POST endpoint to apply promotions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotion, restaurantId } = body;

    if (!promotion || !restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: promotion and restaurantId'
      }, { status: 400 });
    }

    // Generate unique ID for the promotion
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert applied promotion into database
    await query(`
      INSERT INTO applied_promotions (
        id, type, description, reasoning, estimated_impact, details,
        applied_at, status, start_date, id_restaurant
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active', NOW(), ?)
    `, [
      promotionId,
      promotion.type,
      promotion.description,
      promotion.reasoning,
      promotion.estimatedImpact,
      promotion.details || '',
      restaurantId
    ]);

    console.log(`✅ Applied promotion ${promotionId} for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        promotionId,
        appliedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error applying promotion:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to apply promotion',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}