// app/api/promotions/apply/route.ts - Apply Promotions
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Applying promotion...');
    
    const body = await request.json();
    const { type, description, reasoning, estimatedImpact, details } = body;
    const restaurantId = '1'; // Default restaurant

    // Generate unique promotion ID
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set start and end dates
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days later

    // Insert into applied_promotions table
    const insertQuery = `
      INSERT INTO applied_promotions (
        id, type, description, reasoning, estimated_impact, details,
        start_date, end_date, status, id_restaurant,
        performance_orders, performance_revenue, performance_conversion_rate,
        applied_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 0, 0.00, 0.00, NOW(), NOW(), NOW())
    `;

    await query(insertQuery, [
      promotionId,
      type,
      description,
      reasoning || '',
      estimatedImpact || '',
      details || '',
      startDate,
      endDate,
      restaurantId
    ]);

    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        id: promotionId,
        type,
        description,
        status: 'active',
        appliedAt: new Date().toISOString(),
        startDate,
        endDate
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