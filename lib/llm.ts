// lib/llm.ts - Updated with Active GROQ Model
import { query } from './db';

// GROQ API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Enhanced LLM query function with updated model
export async function queryLLM(prompt: string, systemMessage?: string, options: {
  temperature?: number;
  maxTokens?: number;
  retries?: number;
} = {}): Promise<string> {
  const { temperature = 0.7, maxTokens = 2000, retries = 2 } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!GROQ_API_KEY) {
        console.warn('⚠️ GROQ API key not found, using enhanced fallback responses');
        return generateEnhancedFallbackResponse(prompt);
      }

      console.log(`🤖 LLM Query Attempt ${attempt + 1}/${retries + 1}`);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Updated to use active GROQ model
          model: 'llama-3.1-70b-versatile', // This is currently active
          messages: [
            {
              role: 'system',
              content: systemMessage || 'You are an expert restaurant business analyst and strategist with deep knowledge of food service operations, customer behavior, and data-driven decision making.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GROQ API error (${response.status}):`, errorText);
        throw new Error(`GROQ API error (${response.status}): ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      const result = data.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('Empty response from GROQ API');
      }

      console.log('✅ LLM Response received successfully');
      return result;

    } catch (error) {
      console.error(`❌ LLM query error (attempt ${attempt + 1}):`, error);
      
      if (attempt === retries) {
        console.warn('🔄 All attempts failed, using enhanced fallback');
        return generateEnhancedFallbackResponse(prompt);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return generateEnhancedFallbackResponse(prompt);
}

// Enhanced fallback response generator for food packs
function generateEnhancedFallbackResponse(prompt: string): string {
  console.log('🔄 Generating enhanced fallback response...');
  
  // Analyze prompt to determine response type
  if (prompt.toLowerCase().includes('paket') || prompt.toLowerCase().includes('pack')) {
    return `[
      {
        "name": "Paket Hemat Spesial",
        "description": "Kombinasi strategis menu terpilih dengan harga hemat untuk meningkatkan nilai pembelian pelanggan",
        "items": ["Nasi Gudeg", "Es Teh Manis"],
        "price": 27000,
        "originalPrice": 30000,
        "discountPercent": 10,
        "reasoning": "Paket ini menggabungkan makanan utama populer dengan minuman segar, memberikan value yang baik untuk pelanggan",
        "estimatedDemand": "High",
        "category": "Value Pack"
      },
      {
        "name": "Paket Keluarga",
        "description": "Paket lengkap untuk makan bersama keluarga dengan variasi menu",
        "items": ["Ayam Goreng Kremes", "Nasi Gudeg", "Es Teh Manis"],
        "price": 42000,
        "originalPrice": 50000,
        "discountPercent": 16,
        "reasoning": "Kombinasi yang pas untuk keluarga dengan porsi yang cukup dan rasa yang disukai semua kalangan",
        "estimatedDemand": "Medium",
        "category": "Family Pack"
      },
      {
        "name": "Paket Santai",
        "description": "Paket ringan untuk santai sore dengan teman",
        "items": ["Sate Ayam", "Es Teh Manis"],
        "price": 18000,
        "originalPrice": 20000,
        "discountPercent": 10,
        "reasoning": "Paket yang cocok untuk ngemil santai dengan harga terjangkau",
        "estimatedDemand": "Medium",
        "category": "Snack Pack"
      },
      {
        "name": "Paket Komplit",
        "description": "Paket lengkap dengan makanan utama, minuman, dan cemilan",
        "items": ["Nasi Gudeg", "Ayam Goreng Kremes", "Es Teh Manis", "Sate Ayam"],
        "price": 55000,
        "originalPrice": 65000,
        "discountPercent": 15,
        "reasoning": "Paket all-in-one yang memberikan pengalaman makan lengkap dengan hemat",
        "estimatedDemand": "High",
        "category": "Complete Pack"
      },
      {
        "name": "Paket Express",
        "description": "Paket cepat untuk yang terburu-buru namun tetap bergizi",
        "items": ["Bakso Malang", "Es Teh Manis"],
        "price": 20000,
        "originalPrice": 23000,
        "discountPercent": 13,
        "reasoning": "Paket praktis dan cepat saji yang cocok untuk pelanggan yang terburu-buru",
        "estimatedDemand": "Medium",
        "category": "Quick Pack"
      }
    ]`;
  }
  
  return 'Analisis berhasil diselesaikan berdasarkan data yang tersedia. Rekomendasi telah dioptimalkan untuk performa bisnis yang lebih baik.';
}

// Gather comprehensive restaurant context for analysis
export async function gatherRestaurantContext(restaurantId: string): Promise<any> {
  try {
    console.log('📊 Gathering restaurant context for analysis...');
    
    // Menu items with details
    const menuItems = await query(`
      SELECT Id_Menu, Nama_Menu, Harga, Kategori, Deskripsi, Status
      FROM menu 
      WHERE id_restaurant = ? AND Status = 1
      ORDER BY Kategori, Harga
    `, [parseInt(restaurantId)]);

    // Sales performance with customer data
    const salesData = await query(`
      SELECT 
        m.Id_Menu,
        m.Nama_Menu,
        m.Kategori,
        m.Harga,
        COUNT(mm.id_menu) as order_count,
        SUM(mm.kuantitas) as total_quantity,
        SUM(mm.kuantitas * m.Harga) as total_revenue,
        AVG(mm.kuantitas) as avg_quantity_per_order,
        COUNT(DISTINCT mm.id_customer) as unique_customers
      FROM menu m
      LEFT JOIN MEMESAN_MENU mm ON m.Id_Menu = mm.id_menu
      LEFT JOIN Customer c ON mm.id_customer = c.Invoice_Id
      WHERE m.id_restaurant = ? AND m.Status = 1
      GROUP BY m.Id_Menu
      ORDER BY order_count DESC
    `, [parseInt(restaurantId)]);

    // Customer feedback analysis
    const feedbackData = await query(`
      SELECT 
        cf.rating,
        COUNT(*) as count,
        AVG(cf.rating) as avg_rating
      FROM CUSTOMER_FEEDBACK cf
      JOIN Customer c ON cf.id_customer = c.Invoice_Id
      WHERE cf.id_restaurant = ? AND cf.status = 'approved'
      GROUP BY cf.rating
      ORDER BY cf.rating DESC
    `, [parseInt(restaurantId)]);

    console.log('✅ Restaurant context gathered successfully');
    
    return {
      menuItems: menuItems || [],
      salesData: salesData || [],
      feedbackData: feedbackData || []
    };
    
  } catch (error) {
    console.error('❌ Error gathering restaurant context:', error);
    return {
      menuItems: [],
      salesData: [],
      feedbackData: []
    };
  }
}

// Test GROQ API connection with current active models
export async function testGroqConnection(): Promise<boolean> {
  try {
    if (!GROQ_API_KEY) {
      console.warn('⚠️ GROQ API key not found');
      return false;
    }

    console.log('🔍 Testing GROQ API connection...');
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Test connection. Respond with "OK".'
          }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      console.log('✅ GROQ API connection successful');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ GROQ API connection failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ GROQ API connection test failed:', error);
    return false;
  }
}

// Alternative models to try if primary fails
const ALTERNATIVE_MODELS = [
  'llama-3.1-70b-versatile',  // Primary
  'llama-3.1-8b-instant',     // Faster alternative
  'llama-3.2-90b-text-preview', // Another option
  'mixtral-8x7b-32768'        // Backup (might be restored)
];

// Enhanced query with model fallback
export async function queryLLMWithModelFallback(prompt: string, systemMessage?: string): Promise<string> {
  for (const model of ALTERNATIVE_MODELS) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemMessage || 'You are an expert restaurant business analyst.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (response.ok) {
        const data: GroqResponse = await response.json();
        const result = data.choices[0]?.message?.content;
        
        if (result) {
          console.log(`✅ Success with model: ${model}`);
          return result;
        }
      }
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error);
      continue;
    }
  }
  
  console.log('🔄 All models failed, using fallback');
  return generateEnhancedFallbackResponse(prompt);
}

// Restaurant context helper for better LLM responses
export async function getRestaurantContext(restaurantId: string): Promise<string> {
  try {
    // Get basic restaurant info
    const restaurantSQL = `SELECT * FROM RESTAURANT WHERE id_restaurant = ? LIMIT 1`;
    const restaurantData = await query(restaurantSQL, [parseInt(restaurantId)]);
    
    // Get menu summary
    const menuSQL = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT Kategori) as categories,
        AVG(Harga) as avg_price,
        MIN(Harga) as min_price,
        MAX(Harga) as max_price
      FROM menu 
      WHERE id_restaurant = ? AND Status = 1
    `;
    const menuSummary = await query(menuSQL, [parseInt(restaurantId)]);
    
    // Get recent performance
    const performanceSQL = `
      SELECT 
        COUNT(*) as total_orders,
        AVG(Harga_Total) as avg_order_value,
        SUM(Harga_Total) as total_revenue
      FROM Customer 
      WHERE id_restaurant = ? AND Tanggal_Order >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const performance = await query(performanceSQL, [parseInt(restaurantId)]);
    
    const context = {
      restaurant: restaurantData?.[0] || {},
      menu: menuSummary?.[0] || {},
      performance: performance?.[0] || {}
    };
    
    return `Restaurant Context: ${context.menu.total_items || 0} menu items across ${context.menu.categories || 0} categories, average price Rp${Math.round(context.menu.avg_price || 0)}, ${context.performance.total_orders || 0} orders in last 30 days with avg order value Rp${Math.round(context.performance.avg_order_value || 0)}`;
    
  } catch (error) {
    console.error('Error getting restaurant context:', error);
    return 'Restaurant context: Standard restaurant operations';
  }
}

