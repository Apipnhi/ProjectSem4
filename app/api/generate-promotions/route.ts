// app/api/generate-promotions/route.ts - Fixed Version
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { callGroqLLM } from '@/lib/utils';

interface Promotion {
  type: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  details?: string;
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Generating promotion recommendations...');
    
    const restaurantId = '1'; // Default restaurant

    // Get sales performance data
    const salesQuery = `
      SELECT 
        SUM(Harga_Total) as total_sales,
        COUNT(*) as total_orders,
        AVG(Harga_Total) as avg_order_value
      FROM Customer 
      WHERE id_restaurant = ?
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    
    const salesData = await query(salesQuery, [restaurantId]);
    const sales = salesData[0] || {};

    // Get top and low performing menu items
    const menuPerformanceQuery = `
      SELECT 
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as orders,
        SUM(mm.kuantitas) as quantity,
        SUM(mm.kuantitas * m.Harga) as revenue
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ?
      AND c.id_restaurant = ?
      GROUP BY m.Id_Menu, m.Nama_Menu, m.Kategori, m.Harga
      ORDER BY revenue DESC
    `;
    
    const menuData = await query(menuPerformanceQuery, [restaurantId, restaurantId]);
    
    // Get customer feedback for insights
    const feedbackQuery = `
      SELECT AVG(rating) as avg_rating, COUNT(*) as feedback_count
      FROM CUSTOMER_FEEDBACK 
      WHERE id_restaurant = ?
      AND feedback_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    
    const feedbackData = await query(feedbackQuery, [restaurantId]);
    const feedback = feedbackData[0] || {};

    // Prepare data for analysis
    const analysisData = {
      total_sales: safeNumber(sales.total_sales),
      total_orders: safeNumber(sales.total_orders),
      avg_order_value: safeNumber(sales.avg_order_value),
      avg_rating: safeNumber(feedback.avg_rating),
      feedback_count: safeNumber(feedback.feedback_count),
      top_menu: menuData.slice(0, 3),
      low_performing_menu: menuData.slice(-3)
    };

    let recommendations: Promotion[] = [];

    // Try LLM enhancement first
    try {
      const topMenuSummary = analysisData.top_menu.map((item: any) => 
        `${item.Nama_Menu}: ${item.orders} orders, Rp ${safeNumber(item.revenue).toLocaleString()}`
      ).join('\n');
      
      const lowMenuSummary = analysisData.low_performing_menu.map((item: any) => 
        `${item.Nama_Menu}: ${item.orders} orders, Rp ${safeNumber(item.revenue).toLocaleString()}`
      ).join('\n');

      const prompt = `
      Analisis performa restoran dan buatkan rekomendasi promosi yang strategis:
      
      PERFORMA PENJUALAN (30 hari):
      - Total Sales: Rp ${analysisData.total_sales.toLocaleString()}
      - Total Orders: ${analysisData.total_orders}
      - Avg Order Value: Rp ${analysisData.avg_order_value.toLocaleString()}
      - Rating: ${analysisData.avg_rating.toFixed(1)}/5 (${analysisData.feedback_count} reviews)
      
      MENU TERLARIS:
      ${topMenuSummary}
      
      MENU KURANG LARIS:
      ${lowMenuSummary}
      
      Berikan 3-4 rekomendasi promosi dalam format JSON array:
      [
        {
          "type": "nama promosi",
          "description": "deskripsi promosi",
          "reasoning": "alasan strategis",
          "estimatedImpact": "estimasi dampak (contoh: +15% sales)",
          "details": "detail implementasi"
        }
      ]
      
      Fokus pada peningkatan average order value, mempromosikan menu kurang laris, dan meningkatkan customer retention.
      `;

      const llmResponse = await callGroqLLM(prompt, 1000, 0.5);
      const llmRecommendations = JSON.parse(llmResponse);
      
      if (Array.isArray(llmRecommendations) && llmRecommendations.length > 0) {
        return NextResponse.json({
          success: true,
          recommendations: llmRecommendations,
          method: 'LLM-Enhanced Strategy',
          metadata: {
            analysis_data: analysisData,
            generated_at: new Date().toISOString()
          }
        });
      }
    } catch (llmError) {
      console.warn('LLM promotion generation failed, using template method:', llmError);
    }

    // Fallback to template-based recommendations
    recommendations = [
      {
        type: "Bundle Deal Premium",
        description: `Paket hemat menu terlaris dengan diskon 15%`,
        reasoning: `Berdasarkan data, menu ${analysisData.top_menu[0]?.Nama_Menu || 'terpopuler'} memiliki demand tinggi. Bundle deal dapat meningkatkan average order value.`,
        estimatedImpact: "+20% average order value",
        details: `Kombinasi ${analysisData.top_menu[0]?.Nama_Menu || 'menu utama'} + minuman + dessert dengan harga spesial`
      },
      {
        type: "Happy Hour Promotion",
        description: "Diskon 25% untuk menu kurang laris pada jam sepi",
        reasoning: `Menu ${analysisData.low_performing_menu[0]?.Nama_Menu || 'tertentu'} perlu dorongan penjualan. Promosi jam sepi dapat mengoptimalkan kapasitas.`,
        estimatedImpact: "+30% orders pada jam sepi",
        details: "Berlaku pukul 14:00-17:00 untuk menu pilihan"
      },
      {
        type: "Loyalty Reward Program",
        description: "Program poin untuk customer berulang",
        reasoning: `Dengan average order value Rp ${analysisData.avg_order_value.toLocaleString()}, program loyalty dapat meningkatkan retention.`,
        estimatedImpact: "+25% customer retention",
        details: "1 poin setiap Rp 10.000, 100 poin = diskon 20%"
      }
    ];

    // Add rating-based promotion if rating is low
    if (analysisData.avg_rating < 4.0) {
      recommendations.push({
        type: "Service Improvement Incentive",
        description: "Gratis dessert untuk rating 5 bintang",
        reasoning: `Rating saat ini ${analysisData.avg_rating.toFixed(1)}/5 perlu ditingkatkan. Insentif feedback positif dapat memperbaiki reputasi.`,
        estimatedImpact: "+0.5 rating points",
        details: "Customer yang memberikan rating 5 bintang mendapat dessert gratis pada kunjungan berikutnya"
      });
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations,
      method: 'Template-Based Strategy',
      metadata: {
        analysis_data: analysisData,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating promotion recommendations:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate promotion recommendations',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      recommendations: []
    }, { status: 500 });
  }
}