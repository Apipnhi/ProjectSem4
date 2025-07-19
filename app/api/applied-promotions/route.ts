// app/api/applied-promotions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface AppliedPromotion {
  id: string;
  type: string;
  description: string;
  reasoning: string;
  estimated_impact: string;
  details: string;
  applied_at: string;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date?: string;
  performance_orders: number;
  performance_revenue: number;
  performance_conversion_rate: number;
  id_restaurant: number;
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// GET endpoint - Fetch applied promotions
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Fetching applied promotions...');
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let promotionsQuery = `
      SELECT 
        id, type, description, reasoning, estimated_impact, details,
        applied_at, status, start_date, end_date,
        performance_orders, performance_revenue, performance_conversion_rate,
        id_restaurant, created_at, updated_at
      FROM applied_promotions 
      WHERE id_restaurant = ?
    `;
    
    const queryParams = [restaurantId];
    
    if (status && status !== 'all') {
      promotionsQuery += ' AND status = ?';
      queryParams.push(status);
    }
    
    promotionsQuery += ' ORDER BY applied_at DESC LIMIT ?';
    queryParams.push(limit.toString());
    
    const result = await query(promotionsQuery, queryParams);
    
    const promotions: AppliedPromotion[] = result.map((item: any) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      reasoning: item.reasoning,
      estimated_impact: item.estimated_impact,
      details: item.details,
      applied_at: item.applied_at,
      status: item.status,
      start_date: item.start_date,
      end_date: item.end_date,
      performance_orders: safeNumber(item.performance_orders),
      performance_revenue: safeNumber(item.performance_revenue),
      performance_conversion_rate: safeNumber(item.performance_conversion_rate),
      id_restaurant: item.id_restaurant
    }));

    // Calculate summary statistics
    const activePromotions = promotions.filter(p => p.status === 'active');
    const totalPerformanceRevenue = promotions.reduce((sum, p) => sum + p.performance_revenue, 0);
    const totalPerformanceOrders = promotions.reduce((sum, p) => sum + p.performance_orders, 0);
    const avgConversionRate = promotions.length > 0 ? 
      promotions.reduce((sum, p) => sum + p.performance_conversion_rate, 0) / promotions.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        promotions: promotions,
        summary: {
          total_promotions: promotions.length,
          active_promotions: activePromotions.length,
          paused_promotions: promotions.filter(p => p.status === 'paused').length,
          completed_promotions: promotions.filter(p => p.status === 'completed').length,
          total_performance_revenue: totalPerformanceRevenue,
          total_performance_orders: totalPerformanceOrders,
          avg_conversion_rate: Math.round(avgConversionRate * 100) / 100
        }
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        filters: { status },
        limit: limit,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching applied promotions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applied promotions',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST endpoint - Apply new promotion
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Applying new promotion...');
    
    const body = await request.json();
    const {
      type,
      description,
      reasoning,
      estimated_impact,
      details,
      start_date,
      end_date,
      restaurant_id
    } = body;

    // Validate required fields
    if (!type || !description || !restaurant_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, description, restaurant_id'
      }, { status: 400 });
    }

    // Generate unique ID
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert promotion
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
      estimated_impact || '',
      details || '',
      start_date || new Date().toISOString().split('T')[0],
      end_date,
      restaurant_id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        id: promotionId,
        type,
        description,
        status: 'active',
        applied_at: new Date().toISOString()
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

// PUT endpoint - Update promotion status
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Updating promotion...');
    
    const body = await request.json();
    const { id, status, performance_orders, performance_revenue, performance_conversion_rate } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing promotion ID'
      }, { status: 400 });
    }

    let updateQuery = 'UPDATE applied_promotions SET updated_at = NOW()';
    const queryParams: any[] = [];

    if (status) {
      updateQuery += ', status = ?';
      queryParams.push(status);
    }

    if (performance_orders !== undefined) {
      updateQuery += ', performance_orders = ?';
      queryParams.push(performance_orders);
    }

    if (performance_revenue !== undefined) {
      updateQuery += ', performance_revenue = ?';
      queryParams.push(performance_revenue);
    }

    if (performance_conversion_rate !== undefined) {
      updateQuery += ', performance_conversion_rate = ?';
      queryParams.push(performance_conversion_rate);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await query(updateQuery, queryParams);

    return NextResponse.json({
      success: true,
      message: 'Promotion updated successfully',
      data: {
        id,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating promotion:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update promotion',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE endpoint - Remove promotion
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🎯 Deleting promotion...');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing promotion ID'
      }, { status: 400 });
    }

    await query('DELETE FROM applied_promotions WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Error deleting promotion:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete promotion',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}