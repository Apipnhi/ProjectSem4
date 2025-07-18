// app/api/promotions/toggle/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT endpoint for toggling promotion status
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
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

    console.log(`🎯 Toggling promotion ${id} status to: ${status}`);

    // Check if promotion exists
    const checkSQL = 'SELECT id, status FROM applied_promotions WHERE id = ?';
    const existingPromo = await query(checkSQL, [id]);

    if (!existingPromo || existingPromo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Update promotion status
    const updateSQL = `
      UPDATE applied_promotions 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;

    await query(updateSQL, [status, new Date(), id]);

    // If status is completed, also set end_date
    if (status === 'completed') {
      const completeSQL = `
        UPDATE applied_promotions 
        SET end_date = ?
        WHERE id = ?
      `;
      await query(completeSQL, [new Date(), id]);
    }

    return NextResponse.json({
      success: true,
      message: `Promotion ${id} status updated to ${status}`,
      data: {
        promotionId: id,
        oldStatus: existingPromo[0].status,
        newStatus: status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error toggling promotion status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle promotion status',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          timestamp: new Date().toISOString(),
          errorType: 'PROMOTION_TOGGLE_ERROR'
        }
      },
      { status: 500 }
    );
  }
}