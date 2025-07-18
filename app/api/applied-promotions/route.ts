// app/api/applied-promotions/route.ts
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
  id_restaurant: number;
  performance?: {
    orders: number;
    revenue: number;
    conversionRate: number;
  };
}

// Get all applied promotions
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching applied promotions...');
    
    // Check if table exists, if not create it
    const checkTableSql = `
      CREATE TABLE IF NOT EXISTS applied_promotions (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        description TEXT,
        reasoning TEXT,
        estimated_impact VARCHAR(255),
        details TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'paused', 'completed') DEFAULT 'active',
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME NULL,
        performance_orders INT DEFAULT 0,
        performance_revenue DECIMAL(10,2) DEFAULT 0.00,
        performance_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        id_restaurant INT NOT NULL,
        FOREIGN KEY (id_restaurant) REFERENCES RESTAURANT(id_restaurant) ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `;
    
    await query(checkTableSql);
    
    // Get restaurant filter from query params
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('id_restaurant');
    
    // Build SQL query with optional restaurant filter
    let selectSql = `
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
    `;
    
    let queryParams: any[] = [];
    
    if (restaurantId) {
      selectSql += ` WHERE ap.id_restaurant = ?`;
      queryParams.push(parseInt(restaurantId));
    }
    
    selectSql += ` ORDER BY ap.applied_at DESC`;
    
    const results = await query(selectSql, queryParams);
    
    // Format results
    const promotions: AppliedPromotion[] = results.map((row: any) => ({
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
    }));
    
    console.log(`✅ Found ${promotions.length} applied promotions`);
    
    return NextResponse.json({
      success: true,
      promotions: promotions,
      count: promotions.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching applied promotions:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch applied promotions',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        promotions: []
      },
      { status: 500 }
    );
  }
}