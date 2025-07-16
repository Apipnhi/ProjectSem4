// app/api/menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface MenuItem {
  Id_Menu: number;
  Nama_Menu: string;
  Deskripsi: string;
  Kategori: string;
  Harga: number;
  Status: boolean;
  id_restaurant: number;
  Gambar?: string;
}

// GET - Fetch all menu items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';

    console.log('Fetching menu items with filters:', { restaurantId, category, status });

    let sql = `
      SELECT 
        Id_Menu,
        Nama_Menu,
        Deskripsi,
        Kategori,
        Harga,
        Status,
        id_restaurant
      FROM menu 
      WHERE id_restaurant = ${parseInt(restaurantId)}
    `;

    // Add category filter
    if (category && category !== 'all') {
      const escapedCategory = category.replace(/'/g, "''");
      sql += ` AND Kategori = '${escapedCategory}'`;
    }

    // Add status filter
    if (status && status !== 'all') {
      const statusValue = status === 'available' ? 1 : 0;
      sql += ` AND Status = ${statusValue}`;
    }

    sql += ' ORDER BY Kategori, Nama_Menu';

    console.log('Menu SQL:', sql);

    const menuItems = await query(sql) as MenuItem[];
    
    // Get categories for frontend
    const categoriesSQL = `
      SELECT DISTINCT Kategori 
      FROM menu 
      WHERE id_restaurant = ${parseInt(restaurantId)}
      ORDER BY Kategori
    `;
    
    const categoriesResult = await query(categoriesSQL);
    const categories = ['all', ...categoriesResult.map((cat: any) => cat.Kategori)];

    console.log(`Found ${menuItems.length} menu items`);

    return NextResponse.json({
      success: true,
      data: menuItems.map(item => ({
        id: item.Id_Menu,
        name: item.Nama_Menu,
        description: item.Deskripsi,
        price: item.Harga,
        category: item.Kategori,
        available: Boolean(item.Status),
        image: "/placeholder.svg?height=100&width=100" // Default placeholder
      })),
      categories,
      summary: {
        total: menuItems.length,
        available: menuItems.filter(item => item.Status).length,
        unavailable: menuItems.filter(item => !item.Status).length
      }
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch menu items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Add new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, restaurantId = 1 } = body;

    console.log('Adding new menu item:', { name, description, price, category });

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: name, description, price, category'
        },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Price must be a valid positive number'
        },
        { status: 400 }
      );
    }

    // Escape values to prevent SQL injection
    const escapedName = name.replace(/'/g, "''");
    const escapedDescription = description.replace(/'/g, "''");
    const escapedCategory = category.replace(/'/g, "''");

    const sql = `
      INSERT INTO menu (Gambar, Nama_Menu, Deskripsi, Kategori, Harga, Status, id_restaurant) 
      VALUES (0x89504E470D0A1A0A, '${escapedName}', '${escapedDescription}', '${escapedCategory}', ${priceNum}, 1, ${parseInt(restaurantId)})
    `;

    console.log('Insert menu SQL:', sql);

    const result = await query(sql);
    const insertId = (result as any).insertId;

    console.log('Menu item added successfully with ID:', insertId);

    return NextResponse.json({
      success: true,
      message: 'Menu item added successfully',
      menu_id: insertId,
      data: {
        id: insertId,
        name,
        description,
        price: priceNum,
        category,
        available: true
      }
    });

  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add menu item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, price, category, available } = body;

    console.log('Updating menu item:', { id, name, description, price, category, available });

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    const menuId = parseInt(id);
    if (isNaN(menuId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid menu ID' },
        { status: 400 }
      );
    }

    // Check if menu exists
    const checkSQL = `SELECT Id_Menu FROM menu WHERE Id_Menu = ${menuId}`;
    const existingMenu = await query(checkSQL);
    
    if (existingMenu.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates = [];
    
    if (name !== undefined) {
      const escapedName = name.replace(/'/g, "''");
      updates.push(`Nama_Menu = '${escapedName}'`);
    }
    
    if (description !== undefined) {
      const escapedDescription = description.replace(/'/g, "''");
      updates.push(`Deskripsi = '${escapedDescription}'`);
    }
    
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum) && priceNum > 0) {
        updates.push(`Harga = ${priceNum}`);
      }
    }
    
    if (category !== undefined) {
      const escapedCategory = category.replace(/'/g, "''");
      updates.push(`Kategori = '${escapedCategory}'`);
    }
    
    if (available !== undefined) {
      const statusValue = available ? 1 : 0;
      updates.push(`Status = ${statusValue}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateSQL = `UPDATE menu SET ${updates.join(', ')} WHERE Id_Menu = ${menuId}`;
    console.log('Update SQL:', updateSQL);

    await query(updateSQL);

    console.log('Menu item updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Menu item updated successfully'
    });

  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update menu item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
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

    const menuId = parseInt(id);
    if (isNaN(menuId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid menu ID' },
        { status: 400 }
      );
    }

    console.log(`Deleting menu item with ID: ${menuId}`);

    // Check if menu exists
    const checkSQL = `SELECT Id_Menu FROM menu WHERE Id_Menu = ${menuId}`;
    const existingMenu = await query(checkSQL);
    
    if (existingMenu.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Check if menu is used in orders (safety check)
    const orderCheck = await query(`SELECT COUNT(*) as count FROM MEMESAN_MENU WHERE id_menu = ${menuId}`);
    const orderCount = orderCheck[0]?.count || 0;

    if (orderCount > 0) {
      // Instead of deleting, mark as unavailable to preserve order history
      await query(`UPDATE menu SET Status = 0 WHERE Id_Menu = ${menuId}`);
      return NextResponse.json({
        success: true,
        message: 'Menu item marked as unavailable (has order history)',
        action: 'disabled'
      });
    }

    // Safe to delete if no order history
    const deleteSQL = `DELETE FROM menu WHERE Id_Menu = ${menuId}`;
    await query(deleteSQL);

    console.log('Menu item deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
      action: 'deleted'
    });

  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete menu item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}