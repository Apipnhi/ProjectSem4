// app/api/menu/route.ts - Fixed Complete Version
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  trend?: 'rising' | 'declining' | 'stable' | 'new';
}

interface FoodPack {
  id: string | number;
  name: string;
  description: string;
  items: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  type: string;
  generated: boolean;
  reasoning?: string;
  estimatedDemand?: string;
  profitMargin?: number;
  category?: string;
}

// Helper function to safely convert to number
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

// GET method for fetching menu items and food packs
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const category = searchParams.get('category');
    const includeAnalytics = searchParams.get('include_analytics') === 'true';

    console.log('🍽️ Fetching menu data for restaurant:', restaurantId);

    // Fetch menu items
    let menuSQL = `
      SELECT 
        Id_Menu as id,
        Nama_Menu as name,
        Deskripsi as description,
        Harga as price,
        Kategori as category,
        Status as available,
        Gambar as image
      FROM menu 
      WHERE id_restaurant = ?
    `;
    
    const menuParams: any[] = [restaurantId];
    
    if (category && category !== 'all') {
      menuSQL += ' AND Kategori = ?';
      menuParams.push(category);
    }
    
    menuSQL += ' ORDER BY Nama_Menu ASC';

    const menuResult = await query(menuSQL, menuParams);
    
    // Process menu items
    const menuItems: MenuItem[] = (menuResult || []).map((item: any) => ({
      id: safeNumber(item.id),
      name: String(item.name || ''),
      description: String(item.description || ''),
      price: safeNumber(item.price),
      category: String(item.category || ''),
      image: String(item.image || ''),
      available: Boolean(item.available),
      trend: Math.random() > 0.5 ? 'rising' : Math.random() > 0.5 ? 'declining' : 'stable'
    }));

    console.log(`✅ Found ${menuItems.length} menu items`);

    // Fetch existing food packs
    const packSQL = `
      SELECT DISTINCT
        p.id_paket as pack_id,
        GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') as items,
        COUNT(p.id_menu) as item_count,
        SUM(m.Harga) as total_price,
        MIN(m.Kategori) as category
      FROM PAKET p
      JOIN menu m ON p.id_menu = m.Id_Menu
      WHERE p.id_restaurant = ?
      GROUP BY p.id_paket
      ORDER BY p.id_paket
    `;

    const packResult = await query(packSQL, [restaurantId]);
    
    // Process food packs
    const foodPacks: FoodPack[] = (packResult || []).map((pack: any, index: number) => {
      const totalPrice = safeNumber(pack.total_price);
      const discountedPrice = Math.round(totalPrice * 0.85); // 15% discount
      
      return {
        id: safeNumber(pack.pack_id),
        name: `Paket ${pack.pack_id}`,
        description: `Paket hemat dengan ${pack.item_count} menu pilihan`,
        items: String(pack.items || '').split(', ').filter(item => item.trim()),
        price: discountedPrice,
        originalPrice: totalPrice,
        discountPercent: Math.round(((totalPrice - discountedPrice) / totalPrice) * 100),
        type: `Pack ${pack.pack_id}`,
        generated: false,
        reasoning: `Paket kombinasi menu ${String(pack.category || 'campuran')}`,
        estimatedDemand: 'Medium',
        profitMargin: 20,
        category: String(pack.category || 'Mixed')
      };
    });

    console.log(`✅ Found ${foodPacks.length} existing food packs`);

    // Generate analytics if requested
    let analytics = null;
    if (includeAnalytics) {
      const revenueByCategory: { [key: string]: number } = {};
      menuItems.forEach(item => {
        if (!revenueByCategory[item.category]) {
          revenueByCategory[item.category] = 0;
        }
        revenueByCategory[item.category] += item.price;
      });

      const mostPopularCategory = Object.keys(revenueByCategory).reduce((a, b) => 
        revenueByCategory[a] > revenueByCategory[b] ? a : b
      ) || 'None';

      analytics = {
        total_items: menuItems.length,
        avg_price: menuItems.length > 0 ? 
          menuItems.reduce((sum: number, item: MenuItem) => sum + item.price, 0) / menuItems.length : 0,
        most_popular_category: mostPopularCategory,
        revenue_by_category: revenueByCategory,
        performance_trends: menuItems.slice(0, 5).map((item: MenuItem) => ({
          item_name: item.name,
          trend: item.trend,
          sales_change: Math.floor(Math.random() * 20) - 10,
          recommendation: item.trend === 'rising' ? 
            'Feature prominently' : 
            item.trend === 'declining' ? 
            'Consider improvements' : 
            'Maintain current approach'
        }))
      };
    }

    const response = {
      success: true,
      data: {
        menuItems: menuItems,
        foodPacks: foodPacks,
        analytics: analytics
      },
      metadata: {
        restaurant_id: restaurantId,
        total_menu_items: menuItems.length,
        total_packages: foodPacks.length,
        category_filter: category || 'all',
        analytics_included: includeAnalytics,
        data_source: 'database_with_proper_types'
      }
    };

    console.log(`✅ Menu data fetched: ${menuItems.length} items, ${foodPacks.length} packages`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching menu data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        data: {
          menuItems: [],
          foodPacks: [],
          analytics: null
        }
      },
      { status: 500 }
    );
  }
}

// POST method for adding new menu items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, price, restaurant_id } = body;

    if (!name || !description || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertSQL = `
      INSERT INTO menu (Nama_Menu, Deskripsi, Kategori, Harga, Status, id_restaurant, Gambar)
      VALUES (?, ?, ?, ?, 1, ?, 0x474946383961)
    `;

    const result = await query(insertSQL, [
      name,
      description,
      category,
      parseInt(price),
      parseInt(restaurant_id || '1')
    ]);

    return NextResponse.json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        id: (result as any).insertId,
        name,
        description,
        category,
        price: parseInt(price),
        status: 1,
        restaurant_id: parseInt(restaurant_id || '1')
      }
    });

  } catch (error) {
    console.error('❌ Error adding menu item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add menu item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT method for updating menu items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category, price, available } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    let updateSQL = 'UPDATE menu SET ';
    const updateFields: string[] = [];
    const params: (string | number)[] = [];

    if (name !== undefined) {
      updateFields.push('Nama_Menu = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('Deskripsi = ?');
      params.push(description);
    }
    if (category !== undefined) {
      updateFields.push('Kategori = ?');
      params.push(category);
    }
    if (price !== undefined) {
      updateFields.push('Harga = ?');
      params.push(parseInt(price));
    }
    if (available !== undefined) {
      updateFields.push('Status = ?');
      params.push(available ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateSQL += updateFields.join(', ') + ' WHERE Id_Menu = ?';
    params.push(parseInt(id));

    await query(updateSQL, params);

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update menu item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE method for removing menu items
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    const deleteSQL = 'DELETE FROM menu WHERE Id_Menu = ?';
    await query(deleteSQL, [parseInt(id)]);

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete menu item',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}