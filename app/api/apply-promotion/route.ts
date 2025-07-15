// app/api/apply-promotion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

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
}

const PROMOTIONS_FILE = path.join(process.cwd(), 'public', 'applied-promotions.json');

async function readPromotions(): Promise<AppliedPromotion[]> {
  try {
    const data = await readFile(PROMOTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

async function writePromotions(promotions: AppliedPromotion[]): Promise<void> {
  await writeFile(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2), 'utf8');
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// GET - Fetch all applied promotions
export async function GET(request: NextRequest) {
  try {
    const promotions = await readPromotions();
    
    return NextResponse.json({
      success: true,
      promotions: promotions
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

// POST - Apply a new promotion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotion, startDate, endDate } = body;

    if (!promotion || !startDate) {
      return NextResponse.json(
        { error: 'Promotion data and start date are required' },
        { status: 400 }
      );
    }

    const appliedPromotion: AppliedPromotion = {
      id: generateId(),
      ...promotion,
      appliedAt: new Date().toISOString(),
      status: 'active',
      startDate,
      endDate,
      performance: {
        orders: 0,
        revenue: 0,
        conversionRate: 0
      }
    };

    const existingPromotions = await readPromotions();
    const updatedPromotions = [...existingPromotions, appliedPromotion];
    
    await writePromotions(updatedPromotions);

    console.log('Promotion applied successfully:', appliedPromotion.id);

    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      promotion: appliedPromotion
    });
  } catch (error) {
    console.error('Error applying promotion:', error);
    return NextResponse.json(
      { error: 'Failed to apply promotion' },
      { status: 500 }
    );
  }
}

// PUT - Update promotion status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotionId, status, performance } = body;

    if (!promotionId || !status) {
      return NextResponse.json(
        { error: 'Promotion ID and status are required' },
        { status: 400 }
      );
    }

    const promotions = await readPromotions();
    const promotionIndex = promotions.findIndex(p => p.id === promotionId);

    if (promotionIndex === -1) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Update promotion
    promotions[promotionIndex].status = status;
    
    if (performance) {
      promotions[promotionIndex].performance = performance;
    }

    // If completing promotion, set end date
    if (status === 'completed' && !promotions[promotionIndex].endDate) {
      promotions[promotionIndex].endDate = new Date().toISOString();
    }

    await writePromotions(promotions);

    console.log('Promotion status updated:', promotionId, status);

    return NextResponse.json({
      success: true,
      message: `Promotion ${status} successfully`,
      promotion: promotions[promotionIndex]
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion status' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a promotion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promotionId = searchParams.get('id');

    if (!promotionId) {
      return NextResponse.json(
        { error: 'Promotion ID is required' },
        { status: 400 }
      );
    }

    const promotions = await readPromotions();
    const filteredPromotions = promotions.filter(p => p.id !== promotionId);

    if (filteredPromotions.length === promotions.length) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    await writePromotions(filteredPromotions);

    console.log('Promotion deleted:', promotionId);

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Failed to delete promotion' },
      { status: 500 }
    );
  }
}