// app/api/promotions/applied/route.ts - Get Applied Promotions
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface AppliedPromotion {
  id: string;
  type: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  details?: string;
  appliedAt: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  performance?: {
    orders: number;
    revenue: number;
    conversionRate: number;
  };
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📋 Fetching applied promotions...');
    
    const restaurantId = '1'; // Default restaurant

    const promotionsQuery = `
      SELECT 
        id, type, description, reasoning, estimated_impact, details,
        applied_at, status, start_date, end_date,
        performance_orders, performance_revenue, performance_conversion_rate
      FROM applied_promotions 
      WHERE id_restaurant = ?
      ORDER BY applied_at DESC
      LIMIT 20
    `;
    
    const result = await query(promotionsQuery, [restaurantId]);
    
    const appliedPromotions: AppliedPromotion[] = result.map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      reasoning: item.reasoning,
      estimatedImpact: item.estimated_impact,
      details: item.details,
      appliedAt: item.applied_at,
      status: item.status,
      startDate: item.start_date,
      endDate: item.end_date,
      performance: {
        orders: safeNumber(item.performance_orders),
        revenue: safeNumber(item.performance_revenue),
        conversionRate: safeNumber(item.performance_conversion_rate)
      }
    }));

    return NextResponse.json({
      success: true,
      data: appliedPromotions,
      metadata: {
        restaurant_id: parseInt(restaurantId),
        total_promotions: appliedPromotions.length,
        active_promotions: appliedPromotions.filter(p => p.status === 'active').length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching applied promotions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applied promotions',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: []
    }, { status: 500 });
  }
}