// app/api/apply-promotion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface PromotionData {
  type: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  details?: string;
  id_restaurant?: number;
}

// Create promotion table if not exists
async function createPromotionTable() {
  try {
    const createTableSql = `
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
    
    await query(createTableSql);
    console.log('✅ Applied promotions table created/verified');
  } catch (error) {
    console.error('❌ Error creating promotions table:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const promotionData: PromotionData = await request.json();
    
    console.log('🎯 Applying promotion:', promotionData.type);
    
    // Ensure table exists
    await createPromotionTable();
    
    // Generate unique ID
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate end date (default to 30 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Use provided restaurant ID or default to 1 for universal application
    const restaurantId = promotionData.id_restaurant || 1;
    
    // Insert promotion into database
    const insertSql = `
      INSERT INTO applied_promotions (
        id, type, description, reasoning, estimated_impact, details,
        applied_at, status, start_date, end_date, id_restaurant
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active', ?, ?, ?)
    `;
    
    await query(insertSql, [
      promotionId,
      promotionData.type,
      promotionData.description,
      promotionData.reasoning,
      promotionData.estimatedImpact,
      promotionData.details || '',
      startDate,
      endDate,
      restaurantId
    ]);
    
    // Return success response
    const response = {
      success: true,
      message: `Promotion "${promotionData.type}" applied successfully`,
      promotion: {
        id: promotionId,
        ...promotionData,
        appliedAt: startDate.toISOString(),
        status: 'active' as const,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        id_restaurant: restaurantId
      }
    };
    
    console.log('✅ Promotion applied successfully:', promotionId);
    return NextResponse.json(response);
    
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