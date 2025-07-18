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
        model: 'llama-3.1-70b-versatile',
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

// Generate AI-powered promotion recommendations
async function generatePromotionRecommendations(restaurantId: number): Promise<Promotion[]> {
  try {
    console.log('🎯 Generating AI-powered promotion recommendations...');

    // Get current restaurant performance data
    const performanceSQL = `
      SELECT 
        COUNT(DISTINCT c.Invoice_Id) as total_orders,
        SUM(c.Harga_Total) as total_revenue,
        AVG(c.Harga_Total) as avg_order_value,
        COUNT(DISTINCT DATE(c.Tanggal_Order)) as active_days,
        
        -- Recent performance (last 30 days)
        COUNT(DISTINCT CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.Invoice_Id END) as recent_orders,
        SUM(CASE WHEN c.Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.Harga_Total ELSE 0 END) as recent_revenue,
        
        -- Day of week patterns
        AVG(CASE WHEN DAYOFWEEK(c.Tanggal_Order) IN (1,7) THEN c.Harga_Total ELSE NULL END) as weekend_avg,
        AVG(CASE WHEN DAYOFWEEK(c.Tanggal_Order) BETWEEN 2 AND 6 THEN c.Harga_Total ELSE NULL END) as weekday_avg
        
      FROM Customer c
      WHERE c.id_restaurant = ? OR ? IS NULL
    `;

    const [performance] = await query(performanceSQL, [restaurantId, restaurantId]);

    // Get top and underperforming menu items
    const menuAnalysisSQL = `
      SELECT 
        m.Nama_Menu as name,
        m.Kategori as category,
        m.Harga as price,
        COALESCE(
          (SELECT SUM(mm.kuantitas) FROM MEMESAN_MENU mm WHERE mm.id_menu = m.Id_Menu), 0
        ) + COALESCE(
          (SELECT SUM(mp.kuantitas) FROM MEMESAN_PAKET mp WHERE mp.id_menu = m.Id_Menu), 0
        ) as total_sold,
        (COALESCE(
          (SELECT SUM(mm.kuantitas) FROM MEMESAN_MENU mm WHERE mm.id_menu = m.Id_Menu), 0
        ) + COALESCE(
          (SELECT SUM(mp.kuantitas) FROM MEMESAN_PAKET mp WHERE mp.id_menu = m.Id_Menu), 0
        )) * m.Harga as revenue
        
      FROM menu m
      WHERE m.id_restaurant = ? OR ? IS NULL
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    const menuAnalysis = await query(menuAnalysisSQL, [restaurantId, restaurantId]);

    // Get customer behavior patterns
    const customerPatternsSQL = `
      SELECT 
        DAYOFWEEK(c.Tanggal_Order) as day_of_week,
        COUNT(c.Invoice_Id) as order_count,
        AVG(c.Harga_Total) as avg_amount
      FROM Customer c
      WHERE c.id_restaurant = ? OR ? IS NULL
      GROUP BY DAYOFWEEK(c.Tanggal_Order)
      ORDER BY order_count DESC
    `;

    const customerPatterns = await query(customerPatternsSQL, [restaurantId, restaurantId]);

    // Prepare comprehensive data for AI analysis
    const totalOrders = safeNumber(performance?.total_orders);
    const totalRevenue = safeNumber(performance?.total_revenue);
    const avgOrderValue = safeNumber(performance?.avg_order_value);
    const recentOrders = safeNumber(performance?.recent_orders);
    const recentRevenue = safeNumber(performance?.recent_revenue);

    const topItems = menuAnalysis.slice(0, 5);
    const underperformingItems = menuAnalysis.slice(-5).reverse();

    const aiPrompt = `
Analyze this Indonesian restaurant's performance and create promotional campaign recommendations:

RESTAURANT PERFORMANCE:
- Total orders: ${totalOrders}
- Total revenue: ${totalRevenue.toLocaleString('id-ID')} IDR
- Average order value: ${avgOrderValue.toLocaleString('id-ID')} IDR
- Recent orders (30 days): ${recentOrders}
- Recent revenue (30 days): ${recentRevenue.toLocaleString('id-ID')} IDR
- Restaurant ID: ${restaurantId || 'All restaurants'}

TOP PERFORMING MENU ITEMS:
${topItems.map((item: any, index: number) => 
  `${index + 1}. ${item.name} (${item.category}) - ${safeNumber(item.price).toLocaleString('id-ID')} IDR - ${safeNumber(item.total_sold)} sold`
).join('\n')}

UNDERPERFORMING MENU ITEMS:
${underperformingItems.map((item: any, index: number) => 
  `${index + 1}. ${item.name} (${item.category}) - ${safeNumber(item.price).toLocaleString('id-ID')} IDR - ${safeNumber(item.total_sold)} sold`
).join('\n')}

CUSTOMER PATTERNS BY DAY:
${customerPatterns.map((pattern: any) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${dayNames[pattern.day_of_week - 1]}: ${safeNumber(pattern.order_count)} orders, ${safeNumber(pattern.avg_amount).toLocaleString('id-ID')} IDR avg`;
}).join('\n')}

Create 5 diverse promotional strategies considering:
- Indonesian market preferences and cultural factors
- Current performance trends
- Seasonal opportunities (current date: ${new Date().toLocaleDateString('id-ID')})
- Customer behavior patterns
- Menu optimization opportunities

Format as JSON array:
[
  {
    "type": "promotion category",
    "description": "clear campaign description",
    "reasoning": "why this promotion will work based on data",
    "estimatedImpact": "projected impact on sales/orders",
    "details": "implementation specifics and timeline"
  }
]

Make promotions creative, culturally relevant, and data-driven. Include variety: discounts, bundles, loyalty programs, time-based offers, and menu-specific campaigns.
`;

    const aiResponse = await callGroqAPI(aiPrompt);
    
    // Try to parse AI response
    try {
      const parsed = JSON.parse(aiResponse);
      if (Array.isArray(parsed)) {
        return parsed.map((promo: any) => ({
          type: promo.type || 'General Promotion',
          description: promo.description || 'AI-generated promotional campaign',
          reasoning: promo.reasoning || 'Based on restaurant performance analysis',
          estimatedImpact: promo.estimatedImpact || 'Moderate increase in sales expected',
          details: promo.details || 'Contact management for implementation details'
        }));
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse AI promotions, using fallback');
    }

    // Fallback promotions based on data analysis
    const fallbackPromotions: Promotion[] = [
      {
        type: "Bundle Deal",
        description: "Paket Hemat - Combine top-selling items with underperforming ones at 20% discount",
        reasoning: `Top items like ${topItems[0]?.name} can boost sales of slower items like ${underperformingItems[0]?.name}`,
        estimatedImpact: "15-25% increase in order value, 30% boost for underperforming items",
        details: "Create combo deals pairing popular items with less popular ones. Run for 2 weeks with prominent display."
      },
      {
        type: "Time-Based Discount",
        description: "Happy Hour Weekday Special - 15% off orders Monday-Thursday 2-5 PM",
        reasoning: `Weekday orders are lower than weekends, need boost during slow hours`,
        estimatedImpact: "20-30% increase in weekday afternoon orders",
        details: "Target slow period to maximize kitchen efficiency. Promote via social media and app notifications."
      },
      {
        type: "Loyalty Program",
        description: "Frequent Diner Rewards - Buy 9 meals, get 10th free",
        reasoning: `Average order value ${avgOrderValue.toLocaleString('id-ID')} IDR suggests regular customers, loyalty program will increase retention`,
        estimatedImpact: "25% increase in customer retention, 40% boost in repeat visits",
        details: "Digital stamp card via app or physical card. Track customer purchases and send reminders."
      },
      {
        type: "New Customer Acquisition",
        description: "First Visit 25% Off + Free Appetizer",
        reasoning: `Recent orders (${recentOrders}) show need for customer acquisition, Indonesian market responds well to generous first-time offers`,
        estimatedImpact: "50-80% increase in new customer trials, 35% conversion to repeat customers",
        details: "Require phone verification for new customers. Limit one per customer. Promote through digital channels."
      },
      {
        type: "Seasonal Menu Promotion",
        description: "Limited Time Specialty - Indonesian Fusion Items with 10% Early Bird Discount",
        reasoning: "Menu analysis shows opportunity to test new items while leveraging current ingredient base",
        estimatedImpact: "20% increase in average order value, opportunity to refresh menu perception",
        details: "Introduce 3-5 new fusion items for 1 month. Gather customer feedback for permanent menu additions."
      }
    ];

    return fallbackPromotions;

  } catch (error) {
    console.error('❌ Error generating promotion recommendations:', error);
    
    return [{
      type: "System Promotion",
      description: "Standard discount promotion available",
      reasoning: "Fallback promotion due to system limitations",
      estimatedImpact: "Moderate sales impact expected",
      details: "Contact management for custom promotion development"
    }];
  }
}

// Get applied promotions from database
async function getAppliedPromotions(restaurantId: number): Promise<AppliedPromotion[]> {
  try {
    const sql = `
      SELECT 
        ap.id,
        ap.type,
        ap.description,
        ap.reasoning,
        ap.estimated_impact as estimatedImpact,
        ap.details,
        ap.applied_at as appliedAt,
        ap.status,
        ap.start_date as startDate,
        ap.end_date as endDate,
        ap.performance_orders as orders,
        ap.performance_revenue as revenue,
        ap.performance_conversion_rate as conversionRate,
        ap.id_restaurant as restaurant_id
      FROM applied_promotions ap
      WHERE ap.id_restaurant = ? OR ? IS NULL
      ORDER BY ap.applied_at DESC
      LIMIT 20
    `;

    const result = await query(sql, [restaurantId, restaurantId]);

    return result.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      reasoning: row.reasoning,
      estimatedImpact: row.estimatedImpact,
      details: row.details,
      appliedAt: row.appliedAt,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      performance: {
        orders: safeNumber(row.orders),
        revenue: safeNumber(row.revenue),
        conversionRate: safeNumber(row.conversionRate)
      },
      restaurant_id: safeNumber(row.restaurant_id)
    }));

  } catch (error) {
    console.error('❌ Error fetching applied promotions:', error);
    return [];
  }
}

// GET endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const type = searchParams.get('type') || 'recommendations';

    console.log('🎯 Fetching promotions:', { restaurantId, type });

    if (type === 'applied') {
      const appliedPromotions = await getAppliedPromotions(restaurantId);
      
      return NextResponse.json({
        success: true,
        data: appliedPromotions,
        metadata: {
          type: 'applied_promotions',
          restaurant_id: restaurantId,
          total_promotions: appliedPromotions.length,
          active_promotions: appliedPromotions.filter(p => p.status === 'active').length
        }
      });
    }

    // Default: Get AI-generated recommendations
    const recommendations = await generatePromotionRecommendations(restaurantId);
    
    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        type: 'recommendations',
        restaurant_id: restaurantId,
        generated_at: new Date().toISOString(),
        ai_powered: true,
        total_recommendations: recommendations.length
      }
    });

  } catch (error) {
    console.error('❌ Error in promotions API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotions',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          errorType: 'PROMOTIONS_ERROR'
        }
      },
      { status: 500 }
    );
  }
}

// POST endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { promotion, restaurant_id = 1 } = body;

    if (!promotion) {
      return NextResponse.json(
        { success: false, error: 'Promotion data is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Applying promotion:', promotion.type);

    // Generate unique ID for the promotion
    const promotionId = `PROMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate end date (default 30 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    // Insert into applied_promotions table
    const insertSQL = `
      INSERT INTO applied_promotions (
        id, type, description, reasoning, estimated_impact, details,
        applied_at, status, start_date, end_date, id_restaurant
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSQL, [
      promotionId,
      promotion.type || 'General Promotion',
      promotion.description || 'Promotional campaign',
      promotion.reasoning || 'AI-generated promotion',
      promotion.estimatedImpact || 'Positive impact expected',
      promotion.details || 'Implementation details to be determined',
      new Date(),
      'active',
      startDate,
      endDate,
      restaurant_id
    ]);

    const appliedPromotion: AppliedPromotion = {
      id: promotionId,
      type: promotion.type,
      description: promotion.description,
      reasoning: promotion.reasoning,
      estimatedImpact: promotion.estimatedImpact,
      details: promotion.details,
      appliedAt: new Date().toISOString(),
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      performance: {
        orders: 0,
        revenue: 0,
        conversionRate: 0
      },
      restaurant_id: restaurant_id
    };

    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      data: appliedPromotion
    });

  } catch (error) {
    console.error('❌ Error applying promotion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply promotion',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get('id');
    const body = await request.json();
    const { status, performance } = body;

    if (!promotionId) {
      return NextResponse.json(
        { success: false, error: 'Promotion ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required (active, paused, completed)' },
        { status: 400 }
      );
    }

    console.log(`🎯 Updating promotion ${promotionId} status to: ${status}`);

    // Build update query
    let updateFields = ['status = ?', 'updated_at = ?'];
    let updateValues = [status, new Date()];

    // Add performance data if provided
    if (performance) {
      if (performance.orders !== undefined) {
        updateFields.push('performance_orders = ?');
        updateValues.push(performance.orders);
      }
      if (performance.revenue !== undefined) {
        updateFields.push('performance_revenue = ?');
        updateValues.push(performance.revenue);
      }
      if (performance.conversionRate !== undefined) {
        updateFields.push('performance_conversion_rate = ?');
        updateValues.push(performance.conversionRate);
      }
    }

    // Set end date if status is completed
    if (status === 'completed') {
      updateFields.push('end_date = ?');
      updateValues.push(new Date());
    }

    updateValues.push(promotionId);

    const updateSQL = `
      UPDATE applied_promotions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await query(updateSQL, updateValues);

    return NextResponse.json({
      success: true,
      message: `Promotion ${promotionId} updated successfully`,
      data: {
        promotionId: promotionId,
        newStatus: status,
        performance: performance,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating promotion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update promotion',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get('id');

    if (!promotionId) {
      return NextResponse.json(
        { success: false, error: 'Promotion ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting promotion ${promotionId}`);

    const deleteSQL = 'DELETE FROM applied_promotions WHERE id = ?';
    await query(deleteSQL, [promotionId]);

    return NextResponse.json({
      success: true,
      message: `Promotion ${promotionId} deleted successfully`,
      data: {
        deletedId: promotionId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error deleting promotion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete promotion',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}