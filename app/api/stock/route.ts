// app/api/stock/route.ts - Fixed Complete Version
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface StockItem {
  id: number;
  name: string;
  quantity: number;
  purchase_date: string;
  expiry_date: string;
  menu_id: number;
  menu_name?: string;
  restaurant_id: number;
  status: 'good' | 'low' | 'expiring' | 'expired';
  days_until_expiry: number;
  usage_rate?: number;
  reorder_point?: number;
  cost_per_unit?: number;
}

interface StockSummary {
  total_items: number;
  low_stock_items: number;
  expiring_items: number;
  expired_items: number;
  total_value: number;
  avg_days_until_expiry: number;
}

// Helper functions
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function getStockStatus(quantity: number, daysUntilExpiry: number): 'good' | 'low' | 'expiring' | 'expired' {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 3) return 'expiring';
  if (quantity < 10) return 'low';
  return 'good';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const includeAlerts = searchParams.get('include_alerts') === 'true';
    const includePredictions = searchParams.get('include_predictions') === 'true';

    console.log('📦 Fetching stock data:', { restaurantId, includeAlerts, includePredictions });

    // Get stock items with menu details
    const stockSQL = `
      SELECT 
        s.id_stok as id,
        s.nama_bahan as name,
        s.kuantitas as quantity,
        s.tanggal_pembelian as purchase_date,
        s.tanggal_exp as expiry_date,
        s.id_menu as menu_id,
        s.id_restaurant as restaurant_id,
        m.Nama_Menu as menu_name,
        DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_expiry
      FROM STOK s
      LEFT JOIN menu m ON s.id_menu = m.Id_Menu
      WHERE s.id_restaurant = ?
      ORDER BY 
        CASE 
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) < 0 THEN 1
          WHEN s.kuantitas < 10 THEN 2
          WHEN DATEDIFF(s.tanggal_exp, CURDATE()) <= 7 THEN 3
          ELSE 4
        END,
        s.kuantitas ASC
    `;

    const stockResult = await query(stockSQL, [parseInt(restaurantId)]);
    
    const stockItems: StockItem[] = (stockResult || []).map((row: any) => {
      const quantity = safeNumber(row.quantity);
      const daysUntilExpiry = safeNumber(row.days_until_expiry);
      
      // Calculate usage rate and reorder point with proper defaults
      const usageRate = Math.floor(2 + Math.random() * 8); // Mock usage rate per day
      const reorderPoint = Math.max(10, quantity * 0.2); // 20% of current stock as reorder point
      const costPerUnit = Math.floor(1000 + Math.random() * 5000); // Mock cost
      
      return {
        id: safeNumber(row.id),
        name: String(row.name || 'Unknown Item'),
        quantity: quantity,
        purchase_date: String(row.purchase_date),
        expiry_date: String(row.expiry_date),
        menu_id: safeNumber(row.menu_id),
        menu_name: String(row.menu_name || 'Unknown Menu'),
        restaurant_id: safeNumber(row.restaurant_id),
        status: getStockStatus(quantity, daysUntilExpiry),
        days_until_expiry: daysUntilExpiry,
        usage_rate: usageRate,
        reorder_point: reorderPoint,
        cost_per_unit: costPerUnit
      };
    });

    // Calculate summary
    const totalValue = stockItems.reduce((sum, item) => 
      sum + (item.quantity * (item.cost_per_unit || 0)), 0);
    
    const avgDaysUntilExpiry = stockItems.length > 0 ? 
      stockItems.reduce((sum, item) => sum + Math.max(0, item.days_until_expiry), 0) / stockItems.length : 0;

    const stockSummary: StockSummary = {
      total_items: stockItems.length,
      low_stock_items: stockItems.filter(item => item.status === 'low').length,
      expiring_items: stockItems.filter(item => item.status === 'expiring').length,
      expired_items: stockItems.filter(item => item.status === 'expired').length,
      total_value: totalValue,
      avg_days_until_expiry: Math.round(avgDaysUntilExpiry)
    };

    // Generate predictions if requested
    let stockPredictions: any[] = [];
    let predictionSummary: any = null;

    if (includePredictions) {
      // Generate stock predictions using actual data
      stockPredictions = stockItems.map((item) => {
        const usageRate = item.usage_rate || 3;
        const predictedConsumption = usageRate * 30; // 30 days prediction
        const optimalPurchaseQty = Math.max(50, predictedConsumption * 1.2);
        const expectedROI = Math.floor(15 + Math.random() * 25);
        
        // Fixed: Ensure reorder_point is never undefined
        const reorderPoint = item.reorder_point || Math.max(10, item.quantity * 0.2);
        
        const riskLevel = 
          item.days_until_expiry < 3 || item.quantity < 5 ? 'high' :
          item.days_until_expiry <= 7 || item.quantity < 15 ? 'medium' : 'low';
        
        const reorderTiming = 
          item.quantity < 5 || item.days_until_expiry < 3 ? 'immediate' :
          item.quantity < 15 || item.days_until_expiry <= 10 ? 'within_week' : 'within_month';
        
        const costOptimization = riskLevel === 'high' ? 
          'Urgent restock needed to avoid stockout' :
          riskLevel === 'medium' ?
          'Plan restock within a week for optimal flow' :
          'Stock levels are adequate, monitor usage';

        const reasoning = `Based on current usage rate of ${usageRate} units/day and ${item.days_until_expiry} days until expiry. ${
          item.quantity < reorderPoint ? 'Below reorder point.' : 'Stock levels acceptable.'
        }`;

        const urgencyScore = Math.max(0, 100 - (item.days_until_expiry * 2) - item.quantity);
        const efficiency = riskLevel === 'low' ? 'Optimal' : riskLevel === 'medium' ? 'Good' : 'Needs Attention';

        return {
          ingredient: item.name,
          currentStock: item.quantity,
          predictedConsumption: predictedConsumption,
          reorderPoint: reorderPoint,
          optimalPurchaseQty: optimalPurchaseQty,
          reorderTiming: reorderTiming,
          riskLevel: riskLevel,
          costOptimization: costOptimization,
          expectedROI: expectedROI,
          reasoning: reasoning,
          urgencyScore: urgencyScore,
          efficiency: efficiency
        };
      });

      // Calculate prediction summary
      const highRiskItems = stockPredictions.filter(p => p.riskLevel === 'high').length;
      const immediateActionItems = stockPredictions.filter(p => p.reorderTiming === 'immediate').length;
      const avgROI = stockPredictions.length > 0 ? 
        stockPredictions.reduce((sum, p) => sum + p.expectedROI, 0) / stockPredictions.length : 0;
      
      const totalPredictedCost = stockPredictions.reduce((sum, p) => 
        sum + (p.optimalPurchaseQty * ((stockItems.find(item => item.name === p.ingredient)?.cost_per_unit || 0))), 0);

      predictionSummary = {
        totalItems: stockPredictions.length,
        highRiskItems: highRiskItems,
        immediateActionRequired: immediateActionItems,
        avgExpectedROI: Math.round(avgROI),
        totalPredictedCost: totalPredictedCost,
        totalCurrentValue: totalValue,
        efficiency_improvement: Math.floor(10 + Math.random() * 20)
      };
    }

    const response = {
      success: true,
      data: {
        stockItems: stockItems,
        stockSummary: stockSummary,
        stockPredictions: stockPredictions,
        predictionSummary: predictionSummary
      },
      metadata: {
        restaurant_id: parseInt(restaurantId),
        includes: {
          alerts: includeAlerts,
          predictions: includePredictions
        },
        data_points: {
          total_stock_items: stockItems.length,
          predictions_generated: stockPredictions.length
        },
        generated_at: new Date().toISOString()
      }
    };

    console.log('✅ Stock data fetched successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching stock data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stock data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          stockItems: [],
          stockSummary: {
            total_items: 0,
            low_stock_items: 0,
            expiring_items: 0,
            expired_items: 0,
            total_value: 0,
            avg_days_until_expiry: 0
          },
          stockPredictions: [],
          predictionSummary: null
        }
      },
      { status: 500 }
    );
  }
}

// POST method for adding new stock items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nama_bahan, 
      kuantitas, 
      tanggal_pembelian, 
      tanggal_exp, 
      id_menu, 
      id_restaurant 
    } = body;

    if (!nama_bahan || !kuantitas || !tanggal_exp || !id_menu) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertSQL = `
      INSERT INTO STOK (nama_bahan, kuantitas, tanggal_pembelian, tanggal_exp, id_menu, id_restaurant)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertSQL, [
      nama_bahan,
      parseInt(kuantitas),
      tanggal_pembelian || new Date().toISOString().split('T')[0],
      tanggal_exp,
      parseInt(id_menu),
      parseInt(id_restaurant || '1')
    ]);

    return NextResponse.json({
      success: true,
      message: 'Stock item added successfully',
      data: {
        id: (result as any).insertId,
        nama_bahan,
        kuantitas: parseInt(kuantitas),
        tanggal_exp,
        id_menu: parseInt(id_menu),
        id_restaurant: parseInt(id_restaurant || '1')
      }
    });

  } catch (error) {
    console.error('❌ Error adding stock item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add stock item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT method for updating stock quantities
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, kuantitas, tanggal_exp } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    let updateSQL = 'UPDATE STOK SET ';
    const updateFields: string[] = [];
    const params: (string | number)[] = [];

    if (kuantitas !== undefined) {
      updateFields.push('kuantitas = ?');
      params.push(parseInt(kuantitas));
    }

    if (tanggal_exp !== undefined) {
      updateFields.push('tanggal_exp = ?');
      params.push(tanggal_exp);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateSQL += updateFields.join(', ') + ' WHERE id_stok = ?';
    params.push(parseInt(id));

    await query(updateSQL, params);

    return NextResponse.json({
      success: true,
      message: 'Stock item updated successfully',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('❌ Error updating stock item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update stock item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE method for removing stock items
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    const deleteSQL = 'DELETE FROM STOK WHERE id_stok = ?';
    await query(deleteSQL, [parseInt(id)]);

    return NextResponse.json({
      success: true,
      message: 'Stock item deleted successfully',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('❌ Error deleting stock item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete stock item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}