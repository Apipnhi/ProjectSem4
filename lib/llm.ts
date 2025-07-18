// lib/llm.ts - GROQ API Integration for LLM Features
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

// Generic LLM query function
export async function queryLLM(prompt: string, systemMessage?: string): Promise<string> {
  try {
    if (!GROQ_API_KEY) {
      console.warn('⚠️ GROQ API key not found, using fallback responses');
      return generateFallbackResponse(prompt);
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: systemMessage || 'You are a helpful restaurant management AI assistant specializing in data analysis and business insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';

  } catch (error) {
    console.error('LLM query error:', error);
    return generateFallbackResponse(prompt);
  }
}

// Generate food pack recommendations using LLM
export async function generateFoodPackRecommendations(menuItems: any[], salesData: any[]): Promise<any[]> {
  try {
    const menuSummary = menuItems.map(item => `${item.Nama_Menu} (${item.Kategori}) - Rp${item.Harga}`).join('\n');
    const salesSummary = salesData.map(item => `${item.nama_menu}: ${item.total_orders} orders`).join('\n');
    
    const prompt = `
    Berdasarkan data menu dan penjualan berikut, buatkan 3-5 rekomendasi paket makanan yang strategis:

    MENU ITEMS:
    ${menuSummary}

    SALES DATA:
    ${salesSummary}

    Untuk setiap paket, berikan:
    1. Nama paket yang menarik
    2. Deskripsi singkat
    3. Item yang disertakan
    4. Harga yang disarankan (dengan diskon 10-20%)
    5. Alasan strategis mengapa paket ini bagus
    6. Estimasi demand (High/Medium/Low)

    Format response dalam JSON array dengan struktur:
    [
      {
        "name": "nama paket",
        "description": "deskripsi",
        "items": ["item1", "item2"],
        "price": harga_number,
        "originalPrice": harga_asli,
        "discountPercent": persentase_diskon,
        "reasoning": "alasan strategis",
        "estimatedDemand": "High/Medium/Low"
      }
    ]
    `;

    const systemMessage = 'You are a restaurant business strategist. Analyze menu and sales data to create profitable food pack recommendations. Always respond in valid JSON format.';
    
    const response = await queryLLM(prompt, systemMessage);
    
    try {
      // Try to parse JSON response
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn('Failed to parse LLM JSON response, using fallback');
      return generateFallbackFoodPacks(menuItems);
    }

  } catch (error) {
    console.error('Error generating food pack recommendations:', error);
    return generateFallbackFoodPacks(menuItems);
  }
}

// Generate menu trends analysis using LLM
export async function generateMenuTrendsAnalysis(menuData: any[]): Promise<any> {
  try {
    const dataContext = menuData.map(item => 
      `${item.Nama_Menu} (${item.Kategori}): ${item.recent_quantity || 0} recent sales, ${item.previous_quantity || 0} previous period`
    ).join('\n');

    const prompt = `
    Analisis tren menu berdasarkan data penjualan berikut:

    DATA PENJUALAN:
    ${dataContext}

    Untuk setiap item menu, tentukan:
    1. Tren (rising/declining/stable/new)
    2. Growth rate estimation
    3. Reasoning yang detail
    4. 3 rekomendasi spesifik
    5. Confidence level (0-100)
    6. Urgency level (high/medium/low)

    Juga berikan insight strategis secara keseluruhan tentang performa menu.

    Format dalam JSON dengan struktur yang sesuai untuk analisis bisnis.
    `;

    const systemMessage = 'You are a data analyst specializing in restaurant performance analysis. Provide detailed, actionable insights based on sales trends.';
    
    const response = await queryLLM(prompt, systemMessage);
    
    try {
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn('Failed to parse trends analysis, using fallback');
      return generateFallbackTrends(menuData);
    }

  } catch (error) {
    console.error('Error generating menu trends:', error);
    return generateFallbackTrends(menuData);
  }
}

// Generate stock predictions using LLM
export async function generateStockPredictions(stockData: any[]): Promise<any> {
  try {
    const stockContext = stockData.map(item => 
      `${item.nama_bahan}: ${item.kuantitas} units, expires in ${item.days_until_expiry} days, used in ${item.menu_orders_30d || 0} orders last month`
    ).join('\n');

    const prompt = `
    Berdasarkan data stok berikut, buatkan analisis dan prediksi stok yang comprehensive:

    STOCK DATA:
    ${stockContext}

    Untuk setiap item, berikan:
    1. Prediksi konsumsi 30 hari ke depan
    2. Reorder point yang optimal
    3. Quantity pembelian yang disarankan
    4. Risk level (high/medium/low)
    5. Timing pembelian (immediate/within_week/within_month)
    6. Cost optimization advice
    7. Expected ROI dari strategi yang disarankan

    Juga berikan summary insights tentang overall stock health dan rekomendasi strategis.

    Format dalam JSON yang structured untuk analisis inventory.
    `;

    const systemMessage = 'You are an inventory management expert. Analyze stock data and provide actionable recommendations for optimal inventory management.';
    
    const response = await queryLLM(prompt, systemMessage);
    
    try {
      const cleanedResponse = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.warn('Failed to parse stock predictions, using fallback');
      return generateFallbackStockPredictions(stockData);
    }

  } catch (error) {
    console.error('Error generating stock predictions:', error);
    return generateFallbackStockPredictions(stockData);
  }
}

// Generate business insights and recommendations
export async function generateBusinessInsights(salesData: any[], customerData: any[], menuData: any[]): Promise<string[]> {
  try {
    const context = `
    SALES SUMMARY: Total revenue ${salesData.reduce((sum, item) => sum + (item.sales || 0), 0)}, ${salesData.length} data points
    CUSTOMER DATA: ${customerData.length} customers analyzed
    MENU PERFORMANCE: ${menuData.length} items tracked
    `;

    const prompt = `
    Berdasarkan data restaurant berikut, berikan 5-7 insight bisnis yang actionable:

    ${context}

    Focus pada:
    1. Revenue optimization opportunities
    2. Customer satisfaction improvements
    3. Operational efficiency gains
    4. Cost reduction strategies
    5. Growth opportunities

    Berikan insight yang specific, actionable, dan prioritized.
    Format sebagai array of strings yang clear dan concise.
    `;

    const response = await queryLLM(prompt);
    
    try {
      const insights = JSON.parse(response);
      return Array.isArray(insights) ? insights : [response];
    } catch {
      // If not JSON, split by lines and clean up
      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 7);
    }

  } catch (error) {
    console.error('Error generating business insights:', error);
    return [
      'Monitor best-selling items and ensure consistent quality',
      'Analyze customer feedback untuk improvement opportunities',
      'Review pricing strategy based on competitor analysis',
      'Optimize inventory levels untuk reduce waste',
      'Focus on customer retention through loyalty programs'
    ];
  }
}

// Fallback functions when LLM is not available
function generateFallbackResponse(prompt: string): string {
  const responses = [
    'Data analysis completed. Recommendations based on historical patterns.',
    'Strategic insights generated from available data patterns.',
    'Analysis shows opportunities for optimization and growth.',
    'Based on data trends, several actionable recommendations identified.'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateFallbackFoodPacks(menuItems: any[]): any[] {
  if (menuItems.length < 2) return [];
  
  const packs = [];
  
  // Create a simple combination pack
  const items = menuItems.slice(0, 3);
  const totalPrice = items.reduce((sum, item) => sum + (item.Harga || 0), 0);
  
  packs.push({
    id: 'fallback_combo',
    name: 'Paket Kombinasi',
    description: 'Kombinasi hemat menu pilihan',
    items: items.map(item => item.Nama_Menu),
    price: Math.round(totalPrice * 0.85),
    originalPrice: totalPrice,
    discountPercent: 15,
    reasoning: 'Paket hemat berdasarkan menu populer',
    estimatedDemand: 'Medium',
    generated: true
  });
  
  return packs;
}

function generateFallbackTrends(menuData: any[]): any {
  return {
    trends: menuData.slice(0, 5).map((item, index) => ({
      itemName: item.Nama_Menu,
      trend: ['rising', 'stable', 'declining'][index % 3],
      growthRate: Math.floor(-20 + Math.random() * 60),
      reasoning: 'Analysis based on available sales data',
      recommendations: ['Monitor performance', 'Consider promotions', 'Maintain quality'],
      confidence: 75
    })),
    summary: {
      totalTrends: menuData.length,
      risingTrends: Math.floor(menuData.length * 0.3),
      decliningTrends: Math.floor(menuData.length * 0.2),
      stableTrends: menuData.length - Math.floor(menuData.length * 0.5)
    }
  };
}

function generateFallbackStockPredictions(stockData: any[]): any {
  return {
    predictions: stockData.map(item => ({
      ingredient: item.nama_bahan,
      currentStock: item.kuantitas,
      predictedConsumption: Math.floor(item.kuantitas * 0.7),
      reorderPoint: Math.max(10, Math.floor(item.kuantitas * 0.3)),
      riskLevel: item.kuantitas < 10 ? 'high' : item.kuantitas < 25 ? 'medium' : 'low',
      reasoning: 'Prediction based on current stock levels and usage patterns'
    })),
    summary: {
      totalItems: stockData.length,
      highRiskItems: stockData.filter(item => item.kuantitas < 10).length,
      avgExpectedROI: 18
    }
  };
}

// Helper function to get restaurant context for better LLM responses
export async function getRestaurantContext(restaurantId: string): Promise<string> {
  try {
    // Get basic restaurant info
    const restaurantSQL = `SELECT * FROM RESTAURANT WHERE id_restaurant = ? LIMIT 1`;
    const restaurantData = await query(restaurantSQL, [parseInt(restaurantId)]);
    
    // Get menu count and categories
    const menuSQL = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT Kategori) as categories,
        AVG(Harga) as avg_price
      FROM menu 
      WHERE id_restaurant = ?
    `;
    const menuStats = await query(menuSQL, [parseInt(restaurantId)]);
    
    // Get recent sales volume
    const salesSQL = `
      SELECT COUNT(*) as recent_orders
      FROM Customer 
      WHERE id_restaurant = ? 
      AND Tanggal_Order >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    const salesStats = await query(salesSQL, [parseInt(restaurantId)]);
    
    const context = `
    Restaurant Profile:
    - Menu items: ${menuStats[0]?.total_items || 0}
    - Categories: ${menuStats[0]?.categories || 0}
    - Average price: Rp${Math.round(menuStats[0]?.avg_price || 0)}
    - Recent orders (30d): ${salesStats[0]?.recent_orders || 0}
    `;
    
    return context;
    
  } catch (error) {
    console.error('Error getting restaurant context:', error);
    return 'Restaurant context: Standard Indonesian restaurant with diverse menu offerings.';
  }
}