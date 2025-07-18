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
    const { status, performance_orders, performance_revenue, performance_conversion_rate } = await request.json();
    
    console.log(`🔄 Updating promotion ${id}`);
    
    if (status && !['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Build dynamic update query
    let updateSql = `UPDATE applied_promotions SET updated_at = CURRENT_TIMESTAMP`;
    let queryParams: any[] = [];
    
    if (status) {
      updateSql += `, status = ?`;
      queryParams.push(status);
    }
    
    if (performance_orders !== undefined) {
      updateSql += `, performance_orders = ?`;
      queryParams.push(performance_orders);
    }
    
    if (performance_revenue !== undefined) {
      updateSql += `, performance_revenue = ?`;
      queryParams.push(performance_revenue);
    }
    
    if (performance_conversion_rate !== undefined) {
      updateSql += `, performance_conversion_rate = ?`;
      queryParams.push(performance_conversion_rate);
    }
    
    updateSql += ` WHERE id = ?`;
    queryParams.push(id);
    
    const result = await query(updateSql, queryParams);
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Promotion ${id} updated successfully`);
    
    return NextResponse.json({
      success: true,
      message: `Promotion updated successfully`,
      id: id
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
    
    // Fetch specific promotion with restaurant info
    const selectSql = `
      SELECT 
        ap.id,
        ap.type,
        ap.description,
        ap.reasoning,
        ap.estimated_impact,
        ap.details,
        ap.applied_at,
        ap.status,
        ap.start_date,
        ap.end_date,
        ap.performance_orders,
        ap.performance_revenue,
        ap.performance_conversion_rate,
        ap.id_restaurant,
        r.Nama_Restaurant
      FROM applied_promotions ap
      LEFT JOIN RESTAURANT r ON ap.id_restaurant = r.id_restaurant
      WHERE ap.id = ?
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
      id_restaurant: row.id_restaurant,
      restaurantName: row.Nama_Restaurant,
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