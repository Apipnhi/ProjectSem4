// app/api/promotions/toggle/[id]/route.ts - Toggle Promotion Status
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    console.log('🔄 Toggling promotion status...');
    
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!['active', 'paused', 'completed'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be active, paused, or completed'
      }, { status: 400 });
    }

    // Update promotion status
    const updateQuery = `
      UPDATE applied_promotions 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(updateQuery, [status, id]);

    return NextResponse.json({
      success: true,
      message: 'Promotion status updated successfully',
      data: {
        id,
        status,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error toggling promotion status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update promotion status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}