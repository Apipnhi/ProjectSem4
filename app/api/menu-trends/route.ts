// app/api/menu-trends/route.ts - Fixed Version with Updated Model
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Types
interface MenuTrendItem {
  trend: 'rising' | 'stable' | 'declining';
  itemName: string;
  currentSales: number;
  predictedSales: number;
  growthRate: number;
  confidence: number;
  reasoning: string;
  recommendations: string[];
  category: string;
  seasonality: string;
  competitiveAdvantage: string;
}

// Helper function to safely convert to number
function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// Rate limiter for Groq API
class SimpleRateLimiter {
  private lastRequest = 0;
  private minDelay = 3000; // 3 seconds between requests

  canMakeRequest(): boolean {
    const now = Date.now();
    return (now - this.lastRequest) >= this.minDelay;
  }

  recordRequest(): void {
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new SimpleRateLimiter();

// Groq API call with proper error handling and updated model
async function callGroqSafely(prompt: string): Promise<string | null> {
  try {
    // Check rate limit
    if (!rateLimiter.canMakeRequest()) {
      console.log('🚫 Rate limit - skipping Groq API call');
      return null;
    }

    rateLimiter.recordRequest();

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
            content: 'You are a restaurant analyst. Provide brief, practical insights in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (response.status === 429) {
      console.log('🚫 Groq API rate limited (429)');
      return null;
    }

    if (!response.ok) {
      console.log(`⚠️ Groq API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
    
  } catch (error) {
    console.log('⚠️ Groq API call failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Enhanced menu trends generation with LLM integration
async function generateMenuTrends(restaurantId: number): Promise<MenuTrendItem[]> {
  try {
    console.log('📈 Generating menu trends analysis...');

    // Get comprehensive sales data with time series
    const salesDataSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as total_orders,
        SUM(mm.kuantitas) as total_quantity,
        DATE(c.Tanggal_Order) as order_date,
        MONTH(c.Tanggal_Order) as order_month,
        YEAR(c.Tanggal_Order) as order_year
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga, DATE(c.Tanggal_Order)
      ORDER BY m.Nama_Menu, c.Tanggal_Order
    `;

    const salesData = await query(salesDataSQL, [restaurantId]);
    
    // Get menu items with aggregated sales
    const menuSQL = `
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COALESCE(SUM(mm.kuantitas), 0) as total_sales,
        COUNT(DISTINCT c.Invoice_Id) as unique_orders
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY total_sales DESC
    `;

    const menuData = await query(menuSQL, [restaurantId]);

    if (!menuData || menuData.length === 0) {
      console.log('❌ No menu data found');
      return [];
    }

    console.log(`📊 Processing ${menuData.length} menu items for trend analysis`);

    // Try LLM-powered analysis first
    const llmTrends = await generateLLMTrends(menuData, salesData);
    if (llmTrends.length > 0) {
      return llmTrends;
    }

    // Fallback to algorithmic analysis
    return generateAlgorithmicTrends(menuData, salesData);

  } catch (error) {
    console.error('❌ Error generating menu trends:', error);
    return getBasicFallbackTrends();
  }
}

// LLM-powered trend analysis
async function generateLLMTrends(menuData: any[], salesData: any[]): Promise<MenuTrendItem[]> {
  try {
    // Prepare concise data summary for LLM
    const topItems = menuData.slice(0, 5).map(item => 
      `${item.Nama_Menu} (${item.Kategori}): ${item.total_sales} sales`
    ).join(', ');

    const bottomItems = menuData.slice(-3).map(item => 
      `${item.Nama_Menu} (${item.Kategori}): ${item.total_sales} sales`
    ).join(', ');

    const prompt = `Analisis trend menu restoran Indonesia:

TOP PERFORMERS: ${topItems}
UNDERPERFORMERS: ${bottomItems}

Buat prediksi trend untuk 3 menu utama. Format JSON:
[
  {
    "itemName": "nama menu",
    "trend": "rising/stable/declining", 
    "currentSales": number,
    "predictedSales": number,
    "growthRate": percentage,
    "confidence": percentage,
    "reasoning": "alasan singkat",
    "recommendations": ["rekomendasi1", "rekomendasi2"],
    "category": "kategori",
    "seasonality": "musiman/tidak",
    "competitiveAdvantage": "keunggulan"
  }
]`;

    const llmResponse = await callGroqSafely(prompt);
    
    if (llmResponse) {
      try {
        // Extract JSON from response
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : llmResponse;
        const trends = JSON.parse(jsonString);
        
        if (Array.isArray(trends) && trends.length > 0) {
          console.log('✅ Successfully generated LLM trends');
          return trends.map((trend: any) => ({
            trend: trend.trend || 'stable',
            itemName: trend.itemName || 'Unknown Item',
            currentSales: safeNumber(trend.currentSales),
            predictedSales: safeNumber(trend.predictedSales),
            growthRate: safeNumber(trend.growthRate),
            confidence: safeNumber(trend.confidence) || 70,
            reasoning: trend.reasoning || 'Analysis based on current data',
            recommendations: Array.isArray(trend.recommendations) ? trend.recommendations : ['Monitor performance'],
            category: trend.category || 'Unknown',
            seasonality: trend.seasonality || 'Stable',
            competitiveAdvantage: trend.competitiveAdvantage || 'Standard offering'
          }));
        }
      } catch (parseError) {
        console.error('❌ Failed to parse LLM trends response:', parseError);
      }
    }
  } catch (error) {
    console.error('❌ LLM trend analysis failed:', error);
  }

  return [];
}

// Algorithmic trend analysis as fallback
function generateAlgorithmicTrends(menuData: any[], salesData: any[]): Promise<MenuTrendItem[]> {
  console.log('🔄 Generating algorithmic trend analysis...');
  
  const trends: MenuTrendItem[] = [];
  
  // Sort menu items by sales performance
  const sortedMenus = menuData.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));
  
  // Analyze top performers
  const topPerformers = sortedMenus.slice(0, 3);
  const midPerformers = sortedMenus.slice(3, 6);
  const underPerformers = sortedMenus.slice(-3);

  // Generate trends for top performers
  topPerformers.forEach((item, index) => {
    const currentSales = safeNumber(item.total_sales);
    const predictedGrowth = index === 0 ? 15 : 10; // Top item gets higher growth prediction
    
    trends.push({
      trend: 'rising',
      itemName: item.Nama_Menu,
      currentSales: currentSales,
      predictedSales: Math.round(currentSales * (1 + predictedGrowth / 100)),
      growthRate: predictedGrowth,
      confidence: 85,
      reasoning: `Menu dengan performa terbaik (#${index + 1}). Konsisten diminati pelanggan`,
      recommendations: [
        'Pertahankan kualitas dan konsistensi',
        'Pertimbangkan variasi atau bundle deals',
        'Fokus pada optimalisasi margin'
      ],
      category: item.Kategori || 'Unknown',
      seasonality: 'Stabil sepanjang tahun',
      competitiveAdvantage: 'Menu signature dengan demand tinggi'
    });
  });

  // Generate trends for mid performers
  if (midPerformers.length > 0) {
    const midItem = midPerformers[0];
    const currentSales = safeNumber(midItem.total_sales);
    
    trends.push({
      trend: 'stable',
      itemName: midItem.Nama_Menu,
      currentSales: currentSales,
      predictedSales: Math.round(currentSales * 1.05), // 5% growth
      growthRate: 5,
      confidence: 70,
      reasoning: 'Menu dengan performa stabil. Memiliki customer base yang loyal',
      recommendations: [
        'Tingkatkan promosi dan visibility',
        'Analisis feedback customer untuk improvement',
        'Pertimbangkan penyesuaian harga'
      ],
      category: midItem.Kategori || 'Unknown',
      seasonality: 'Cenderung stabil',
      competitiveAdvantage: 'Menu dengan potensi growth yang baik'
    });
  }

  // Generate trends for underperformers
  if (underPerformers.length > 0) {
    const underItem = underPerformers[0];
    const currentSales = safeNumber(underItem.total_sales);
    
    trends.push({
      trend: 'declining',
      itemName: underItem.Nama_Menu,
      currentSales: currentSales,
      predictedSales: Math.round(currentSales * 0.9), // 10% decline
      growthRate: -10,
      confidence: 60,
      reasoning: 'Menu dengan performa rendah. Perlu evaluasi dan perbaikan',
      recommendations: [
        'Review resep dan kualitas',
        'Pertimbangkan rebranding atau reformulasi',
        'Evaluasi untuk discontinue jika tidak membaik'
      ],
      category: underItem.Kategori || 'Unknown',
      seasonality: 'Perlu analisis lebih lanjut',
      competitiveAdvantage: 'Memerlukan differensiasi yang kuat'
    });
  }

  console.log(`✅ Generated ${trends.length} algorithmic trends`);
  return Promise.resolve(trends);
}

// Basic fallback trends
function getBasicFallbackTrends(): MenuTrendItem[] {
  return [
    {
      trend: 'rising',
      itemName: 'Menu Populer',
      currentSales: 150,
      predictedSales: 180,
      growthRate: 20,
      confidence: 75,
      reasoning: 'Berdasarkan pattern umum industri F&B',
      recommendations: ['Maintain quality', 'Consider expansion'],
      category: 'Makanan Utama',
      seasonality: 'Sepanjang tahun',
      competitiveAdvantage: 'Customer favorite'
    },
    {
      trend: 'stable',
      itemName: 'Menu Standard',
      currentSales: 100,
      predictedSales: 105,
      growthRate: 5,
      confidence: 65,
      reasoning: 'Performance konsisten dalam kategori',
      recommendations: ['Monitor closely', 'Seek improvement opportunities'],
      category: 'Minuman',
      seasonality: 'Stabil',
      competitiveAdvantage: 'Reliable choice'
    }
  ];
}

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');

    console.log(`📈 Fetching menu trends for restaurant ${restaurantId}`);

    const trends = await generateMenuTrends(restaurantId);

    return NextResponse.json({
      success: true,
      data: {
        trends,
        summary: {
          totalItems: trends.length,
          risingTrends: trends.filter(t => t.trend === 'rising').length,
          stableTrends: trends.filter(t => t.trend === 'stable').length,
          decliningTrends: trends.filter(t => t.trend === 'declining').length,
          avgConfidence: trends.length > 0 
            ? Math.round(trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length)
            : 0,
          generatedAt: new Date().toISOString()
        }
      },
      metadata: {
        restaurant_id: restaurantId,
        analysis_method: 'hybrid_llm_with_algorithmic_fallback',
        confidence_level: 'moderate_to_high'
      }
    });

  } catch (error) {
    console.error('❌ Error in menu trends API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate menu trends',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      summary: null
    }, { status: 500 });
  }
}