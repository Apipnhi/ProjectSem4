// app/api/menu/route.ts - Main Menu API
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface MenuItem {
  Id_Menu: number;
  Nama_Menu: string;
  Harga: number;
  Kategori: string;
  Deskripsi: string;
  gambar?: any;
  id_restaurant: number;
  available?: boolean;
}

interface FoodPack {
  id_paket: number;
  name: string;
  description: string;
  items: string[];
  price: number;
  category: string;
  id_restaurant: number;
}

// Helper function to safely convert values
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function safeString(value: any): string {
  return value ? String(value) : '';
}

// GET endpoint - Fetch menu items and food packs
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');

    console.log(`🍽️ Fetching menu data for restaurant ${restaurantId}`);

    // Fetch menu items
    const menuSQL = `
      SELECT 
        Id_Menu,
        Nama_Menu,
        Harga,
        Kategori,
        Deskripsi,
        gambar,
        id_restaurant
      FROM menu 
      WHERE id_restaurant = ?
      ORDER BY Kategori, Nama_Menu
    `;

    const menuResult = await query(menuSQL, [restaurantId]);
    const menuItems: MenuItem[] = (menuResult || []).map((item: any) => ({
      Id_Menu: item.Id_Menu,
      Nama_Menu: safeString(item.Nama_Menu),
      Harga: safeNumber(item.Harga),
      Kategori: safeString(item.Kategori),
      Deskripsi: safeString(item.Deskripsi),
      gambar: item.gambar,
      id_restaurant: item.id_restaurant,
      available: true // Default to available
    }));

    // Fetch food packs from PAKET table
    const packetSQL = `
      SELECT DISTINCT
        p.id_paket,
        p.id_restaurant,
        GROUP_CONCAT(m.Nama_Menu SEPARATOR ', ') as items,
        SUM(m.Harga) as total_price,
        COUNT(m.Id_Menu) as item_count
      FROM PAKET p
      JOIN menu m ON p.id_menu = m.Id_Menu
      WHERE p.id_restaurant = ?
      GROUP BY p.id_paket, p.id_restaurant
      ORDER BY p.id_paket
    `;

    const packetResult = await query(packetSQL, [restaurantId]);
    const foodPacks: FoodPack[] = (packetResult || []).map((pack: any, index: number) => ({
      id_paket: pack.id_paket,
      name: `Paket ${pack.id_paket}`,
      description: `Paket hemat dengan ${pack.item_count} menu pilihan`,
      items: pack.items ? pack.items.split(', ') : [],
      price: Math.round(safeNumber(pack.total_price) * 0.85), // 15% discount
      category: 'Food Pack',
      id_restaurant: pack.id_restaurant
    }));

    console.log(`✅ Retrieved ${menuItems.length} menu items and ${foodPacks.length} food packs`);

    return NextResponse.json({
      success: true,
      data: {
        menuItems,
        foodPacks,
        summary: {
          totalMenuItems: menuItems.length,
          totalFoodPacks: foodPacks.length,
          categories: [...new Set(menuItems.map(item => item.Kategori))],
          priceRange: {
            min: menuItems.length > 0 ? Math.min(...menuItems.map(item => item.Harga)) : 0,
            max: menuItems.length > 0 ? Math.max(...menuItems.map(item => item.Harga)) : 0
          }
        }
      },
      metadata: {
        restaurant_id: restaurantId,
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching menu data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch menu data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        menuItems: [],
        foodPacks: [],
        summary: {
          totalMenuItems: 0,
          totalFoodPacks: 0,
          categories: [],
          priceRange: { min: 0, max: 0 }
        }
      }
    }, { status: 500 });
  }
}

// POST endpoint - Add new menu item
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name, price, category, description, restaurant_id = 1 } = body;

    if (!name || !price || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, price, category'
      }, { status: 400 });
    }

    const insertSQL = `
      INSERT INTO menu (Nama_Menu, Harga, Kategori, Deskripsi, id_restaurant)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(insertSQL, [
      name,
      safeNumber(price),
      category,
      description || '',
      restaurant_id
    ]);

    console.log(`✅ Added new menu item: ${name}`);

    return NextResponse.json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        id: result.insertId,
        name,
        price: safeNumber(price),
        category,
        description: description || '',
        restaurant_id
      }
    });

  } catch (error) {
    console.error('❌ Error adding menu item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add menu item',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT endpoint - Update menu item
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { id, name, price, category, description, available } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: id'
      }, { status: 400 });
    }

    const updateSQL = `
      UPDATE menu 
      SET Nama_Menu = ?, Harga = ?, Kategori = ?, Deskripsi = ?
      WHERE Id_Menu = ?
    `;

    await query(updateSQL, [
      name,
      safeNumber(price),
      category,
      description || '',
      id
    ]);

    console.log(`✅ Updated menu item: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        id,
        name,
        price: safeNumber(price),
        category,
        description: description || '',
        available
      }
    });

  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update menu item',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// DELETE endpoint - Delete menu item
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: id'
      }, { status: 400 });
    }

    // Check if menu item exists in orders first
    const checkSQL = `
      SELECT COUNT(*) as order_count 
      FROM MEMESAN_MENU 
      WHERE id_menu = ?
    `;
    
    const checkResult = await query(checkSQL, [id]);
    const hasOrders = checkResult[0]?.order_count > 0;

    if (hasOrders) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete menu item that has been ordered',
        message: 'This menu item has order history and cannot be deleted'
      }, { status: 400 });
    }

    // Delete menu item
    const deleteSQL = `DELETE FROM menu WHERE Id_Menu = ?`;
    await query(deleteSQL, [id]);

    console.log(`✅ Deleted menu item: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete menu item',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}