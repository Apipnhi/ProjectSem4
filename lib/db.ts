// lib/db.ts
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '8889'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'semester4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log('🚀 Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Create connection pool
let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created successfully');
} catch (error) {
  console.error('❌ Failed to create database pool:', error);
  throw error;
}

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database test connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database test connection failed:', error);
    return false;
  }
}

// Main query function with better error handling
export async function query(sql: string, params?: any[]): Promise<any> {
  let connection;
  try {
    console.log('🔍 Executing SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    console.log('📋 Parameters:', params);
    
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    
    console.log('✅ Query successful, rows returned:', Array.isArray(results) ? results.length : 'N/A');
    
    return results;
  } catch (error) {
    console.error('❌ Database query error:');
    console.error('SQL:', sql);
    console.error('Params:', params);
    console.error('Error:', error);
    
    // Re-throw the error so calling functions can handle it
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Simple query function for basic operations
export async function simpleQuery(sql: string): Promise<any> {
  try {
    const [results] = await pool.execute(sql);
    return results;
  } catch (error) {
    console.error('Simple query error:', error);
    throw error;
  }
}

// Function to get connection info
export async function getConnectionInfo() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user, NOW() as server_time');
    connection.release();
    return rows;
  } catch (error) {
    console.error('Error getting connection info:', error);
    throw error;
  }
}

// Test data availability
export async function testDataAvailability() {
  try {
    // Test if Customer table has data
    const customerCount = await query('SELECT COUNT(*) as count FROM Customer');
    const customers = customerCount[0]?.count || 0;
    console.log('Customer records:', customers);
    
    // Test if Menu table has data
    const menuCount = await query('SELECT COUNT(*) as count FROM menu');
    const menus = menuCount[0]?.count || 0;
    console.log('Menu records:', menus);
    
    // Test if MEMESAN_MENU table has data
    const orderCount = await query('SELECT COUNT(*) as count FROM MEMESAN_MENU');
    const orders = orderCount[0]?.count || 0;
    console.log('Order records:', orders);
    
    // Get sample customer data
    const sampleData = await query('SELECT * FROM Customer ORDER BY Tanggal_Order DESC LIMIT 5');
    console.log('Sample customer data:', sampleData);
    
    return {
      customers,
      menus,
      orders,
      sampleData
    };
  } catch (error) {
    console.error('Error testing data availability:', error);
    throw error;
  }
}

// Health check function
export async function healthCheck() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    const dataInfo = await testDataAvailability();
    
    return {
      status: 'healthy',
      connection: 'ok',
      data: dataInfo
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default pool;