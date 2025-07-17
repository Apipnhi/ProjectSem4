// app/api/applied-promotions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// Update specific promotion
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { status } = await request.json();
    
    console.log(`🔄 Updating promotion ${id} status to ${status}`);
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }
    
    if (!['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Update promotion status
    const updateSql = `
      UPDATE applied_promotions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await query(updateSql, [status, id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Promotion ${id} status updated to ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `Promotion status updated to ${status}`,
      id: id,
      newStatus: status
    });
    
  } catch (error) {
    console.error('❌ Error updating promotion status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update promotion status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Delete specific promotion
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    console.log(`🗑️ Deleting promotion ${id}`);
    
    // Delete promotion
    const deleteSql = `DELETE FROM applied_promotions WHERE id = ?`;
    const result = await query(deleteSql, [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Promotion ${id} deleted successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
      id: id
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

// Get specific promotion
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    console.log(`📋 Fetching promotion ${id}`);
    
    // Fetch specific promotion
    const selectSql = `
      SELECT 
        id,
        type,
        description,
        reasoning,
        estimated_impact,
        details,
        applied_at,
        status,
        start_date,
        end_date,
        performance_orders,
        performance_revenue,
        performance_conversion_rate
      FROM applied_promotions
      WHERE id = ?
    `;
    
    const results = await query(selectSql, [id]);
    
    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    const row = results[0];
    const promotion = {
      id: row.id,
      type: row.type,
      description: row.description,
      reasoning: row.reasoning,
      estimatedImpact: row.estimated_impact,
      details: row.details,
      appliedAt: row.applied_at,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      performance: {
        orders: Number(row.performance_orders) || 0,
        revenue: Number(row.performance_revenue) || 0,
        conversionRate: Number(row.performance_conversion_rate) || 0
      }
    };
    
    console.log(`✅ Found promotion ${id}`);
    
    return NextResponse.json({
      success: true,
      promotion: promotion
    });
    
  } catch (error) {
    console.error('❌ Error fetching promotion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotion',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}