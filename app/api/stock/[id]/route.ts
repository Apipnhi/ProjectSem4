// app/api/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface StockItem {
  id_stok: number;
  nama_bahan: string;
  kuantitas: number;
  tanggal_pembelian: string;
  tanggal_exp: string;
  id_menu: number;
  id_restaurant: number;
  pengeluaran: number;
  nama_menu: string;
  nama_restaurant: string;
  harga_menu: number;
  status_exp: string;
  days_until_exp: number;
}

// GET - Fetch all stock data or specific stock item by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific stock item by ID
      const stockId = parseInt(id);
      
      if (isNaN(stockId)) {
        return NextResponse.json(
          { error: 'Invalid stock ID' },
          { status: 400 }
        );
      }

      console.log(`Fetching stock item with ID: ${stockId}`);

      const sql = `
        SELECT 
          s.id_stok,
          s.nama_bahan,
          s.kuantitas,
          s.tanggal_pembelian,
          s.tanggal_exp,
          s.id_menu,
          s.id_restaurant,
          s.pengeluaran,
          m.Nama_Menu as nama_menu,
          m.Harga as harga_menu,
          r.email as nama_restaurant,
          CASE 
            WHEN s.tanggal_exp < CURDATE() THEN 'Expired'
            WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Critical'
            WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Warning'
            ELSE 'Good'
          END as status_exp,
          DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_exp
        FROM STOK s
        JOIN menu m ON s.id_menu = m.Id_Menu
        JOIN RESTAURANT r ON s.id_restaurant = r.id_restaurant
        WHERE s.id_stok = ?
      `;
      
      const results = await query(sql, [stockId]);
      const stockItems = results as any[];
      
      if (stockItems.length === 0) {
        return NextResponse.json(
          { error: 'Stock item not found' },
          { status: 404 }
        );
      }
      
      console.log('Stock item found:', stockItems[0]);
      
      return NextResponse.json({
        success: true,
        data: stockItems[0]
      });
    } else {
      // Get all stock data
      console.log('Fetching all stock data...');
      
      const sql = `
        SELECT 
          s.id_stok,
          s.nama_bahan,
          s.kuantitas,
          s.tanggal_pembelian,
          s.tanggal_exp,
          s.id_menu,
          s.id_restaurant,
          s.pengeluaran,
          m.Nama_Menu as nama_menu,
          m.Harga as harga_menu,
          r.email as nama_restaurant,
          CASE 
            WHEN s.tanggal_exp < CURDATE() THEN 'Expired'
            WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Critical'
            WHEN s.tanggal_exp <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Warning'
            ELSE 'Good'
          END as status_exp,
          DATEDIFF(s.tanggal_exp, CURDATE()) as days_until_exp
        FROM STOK s
        JOIN menu m ON s.id_menu = m.Id_Menu
        JOIN RESTAURANT r ON s.id_restaurant = r.id_restaurant
        ORDER BY s.tanggal_exp ASC, s.kuantitas ASC
      `;
      
      const stockItems = await query(sql) as StockItem[];
      
      console.log(`Found ${stockItems.length} stock items`);
      
      // Calculate summary statistics
      const summary = {
        totalItems: stockItems.length,
        expiredItems: stockItems.filter(item => item.status_exp === 'Expired').length,
        criticalItems: stockItems.filter(item => item.status_exp === 'Critical').length,
        warningItems: stockItems.filter(item => item.status_exp === 'Warning').length,
        lowStockItems: stockItems.filter(item => item.kuantitas <= 5).length,
        totalInvestment: stockItems.reduce((sum, item) => sum + item.pengeluaran, 0)
      };
      
      console.log('Stock summary:', summary);
      
      return NextResponse.json({
        success: true,
        data: stockItems,
        summary: summary
      });
    }
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}

// POST - Add new stock item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nama_bahan,
      kuantitas,
      tanggal_pembelian,
      tanggal_exp,
      id_menu,
      id_restaurant,
      pengeluaran
    } = body;

    console.log('Adding new stock item:', body);

    // Validate required fields
    if (!nama_bahan || !kuantitas || !tanggal_pembelian || !tanggal_exp || !id_menu || !id_restaurant || !pengeluaran) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO STOK (nama_bahan, kuantitas, tanggal_pembelian, tanggal_exp, id_menu, id_restaurant, pengeluaran) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      nama_bahan, 
      kuantitas, 
      tanggal_pembelian, 
      tanggal_exp, 
      id_menu, 
      id_restaurant, 
      pengeluaran
    ]);
    
    console.log('Stock item added successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Stock item added successfully',
      insertId: (result as any).insertId
    });
    
  } catch (error) {
    console.error('Error adding stock item:', error);
    return NextResponse.json(
      { error: 'Failed to add stock item' },
      { status: 500 }
    );
  }
}

// PUT - Update stock item
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    const stockId = parseInt(id);
    
    if (isNaN(stockId)) {
      return NextResponse.json(
        { error: 'Invalid stock ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nama_bahan,
      kuantitas,
      tanggal_pembelian,
      tanggal_exp,
      id_menu,
      id_restaurant,
      pengeluaran
    } = body;

    console.log(`Updating stock item ${stockId}:`, body);

    // Check if stock item exists
    const checkSql = 'SELECT id_stok FROM STOK WHERE id_stok = ?';
    const existingItems = await query(checkSql, [stockId]) as any[];
    
    if (existingItems.length === 0) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }
    
    // Update the stock item
    const updateSql = `
      UPDATE STOK SET 
        nama_bahan = ?, 
        kuantitas = ?, 
        tanggal_pembelian = ?, 
        tanggal_exp = ?, 
        id_menu = ?, 
        id_restaurant = ?, 
        pengeluaran = ?
      WHERE id_stok = ?
    `;
    
    await query(updateSql, [
      nama_bahan, 
      kuantitas, 
      tanggal_pembelian, 
      tanggal_exp, 
      id_menu, 
      id_restaurant, 
      pengeluaran, 
      stockId
    ]);
    
    console.log('Stock item updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Stock item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete stock item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    const stockId = parseInt(id);
    
    if (isNaN(stockId)) {
      return NextResponse.json(
        { error: 'Invalid stock ID' },
        { status: 400 }
      );
    }

    console.log(`Deleting stock item with ID: ${stockId}`);

    // Check if stock item exists
    const checkSql = 'SELECT id_stok FROM STOK WHERE id_stok = ?';
    const existingItems = await query(checkSql, [stockId]) as any[];
    
    if (existingItems.length === 0) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }
    
    // Delete the stock item
    const deleteSql = 'DELETE FROM STOK WHERE id_stok = ?';
    await query(deleteSql, [stockId]);
    
    console.log('Stock item deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Stock item deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}