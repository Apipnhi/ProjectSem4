// app/api/feedback/route.ts - Customer Feedback API
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Types
interface CustomerFeedback {
  id_feedback: number;
  id_customer: number;
  id_restaurant: number;
  rating: number;
  feedback_text: string;
  feedback_date: string;
  status: 'pending' | 'reviewed' | 'responded';
  customer_invoice?: number;
  order_total?: number;
}

interface FeedbackSummary {
  totalFeedbacks: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topComplaints: string[];
  topPraises: string[];
  monthlyTrend: any[];
}

// Helper functions
function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

function safeString(value: any): string {
  return value ? String(value) : '';
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['bagus', 'enak', 'lezat', 'suka', 'puas', 'mantap', 'recommended', 'baik', 'sempurna', 'terbaik'];
  const negativeWords = ['buruk', 'jelek', 'tidak enak', 'kecewa', 'lambat', 'dingin', 'asin', 'hambar', 'mahal', 'mengecewakan'];
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// GET endpoint - Fetch customer feedback
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurant_id') || '1');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const ratingFilter = searchParams.get('rating');
    const statusFilter = searchParams.get('status');
    const period = parseInt(searchParams.get('period') || '30'); // days

    console.log(`💬 Fetching feedback for restaurant ${restaurantId}`);

    const offset = (page - 1) * limit;

    // Base query for feedback with customer data
    let feedbackSQL = `
      SELECT 
        cf.id_feedback,
        cf.id_customer,
        cf.id_restaurant,
        cf.rating,
        cf.feedback_text,
        cf.feedback_date,
        cf.status,
        c.Invoice_Id as customer_invoice,
        c.Harga_Total as order_total,
        c.Tanggal_Order
      FROM CUSTOMER_FEEDBACK cf
      LEFT JOIN Customer c ON cf.id_customer = c.Invoice_Id
      WHERE cf.id_restaurant = ?
    `;

    const queryParams: any[] = [restaurantId];

    // Add filters
    if (ratingFilter) {
      feedbackSQL += ` AND cf.rating = ?`;
      queryParams.push(parseInt(ratingFilter));
    }

    if (statusFilter) {
      feedbackSQL += ` AND cf.status = ?`;
      queryParams.push(statusFilter);
    }

    // Add date filter for recent feedback
    if (period) {
      feedbackSQL += ` AND cf.feedback_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
      queryParams.push(period);
    }

    feedbackSQL += ` ORDER BY cf.feedback_date DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const feedbackResult = await query(feedbackSQL, queryParams);
    
    const feedbacks: CustomerFeedback[] = (feedbackResult || []).map((row: any) => ({
      id_feedback: row.id_feedback,
      id_customer: row.id_customer,
      id_restaurant: row.id_restaurant,
      rating: safeNumber(row.rating),
      feedback_text: safeString(row.feedback_text),
      feedback_date: row.feedback_date,
      status: row.status || 'pending',
      customer_invoice: row.customer_invoice,
      order_total: safeNumber(row.order_total)
    }));

    // Get feedback summary
    const summarySQL = `
      SELECT 
        COUNT(*) as total_feedbacks,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM CUSTOMER_FEEDBACK 
      WHERE id_restaurant = ?
      AND feedback_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const summaryResult = await query(summarySQL, [restaurantId, period]);
    const summaryData = summaryResult[0] || {};

    // Analyze sentiment from feedback text
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const complaints: string[] = [];
    const praises: string[] = [];

    feedbacks.forEach(feedback => {
      if (feedback.feedback_text) {
        const sentiment = analyzeSentiment(feedback.feedback_text);
        sentimentCounts[sentiment]++;
        
        if (sentiment === 'negative' || feedback.rating <= 2) {
          complaints.push(feedback.feedback_text);
        } else if (sentiment === 'positive' || feedback.rating >= 4) {
          praises.push(feedback.feedback_text);
        }
      }
    });

    // Get monthly trend
    const trendSQL = `
      SELECT 
        YEAR(feedback_date) as year,
        MONTH(feedback_date) as month,
        COUNT(*) as feedback_count,
        AVG(rating) as avg_rating
      FROM CUSTOMER_FEEDBACK 
      WHERE id_restaurant = ?
      AND feedback_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(feedback_date), MONTH(feedback_date)
      ORDER BY year ASC, month ASC
    `;

    const trendResult = await query(trendSQL, [restaurantId]);
    
    const monthlyTrend = (trendResult || []).map((row: any) => ({
      year: row.year,
      month: row.month,
      monthName: new Date(row.year, row.month - 1).toLocaleString('id-ID', { month: 'long' }),
      feedbackCount: safeNumber(row.feedback_count),
      averageRating: Math.round(safeNumber(row.avg_rating) * 10) / 10
    }));

    // Compile summary
    const summary: FeedbackSummary = {
      totalFeedbacks: safeNumber(summaryData.total_feedbacks),
      averageRating: Math.round(safeNumber(summaryData.avg_rating) * 10) / 10,
      ratingDistribution: {
        5: safeNumber(summaryData.rating_5),
        4: safeNumber(summaryData.rating_4),
        3: safeNumber(summaryData.rating_3),
        2: safeNumber(summaryData.rating_2),
        1: safeNumber(summaryData.rating_1)
      },
      sentimentAnalysis: sentimentCounts,
      topComplaints: complaints.slice(0, 5),
      topPraises: praises.slice(0, 5),
      monthlyTrend
    };

    console.log(`✅ Retrieved ${feedbacks.length} feedbacks, avg rating: ${summary.averageRating}`);

    return NextResponse.json({
      success: true,
      data: {
        feedbacks,
        summary,
        pagination: {
          page,
          limit,
          total: summary.totalFeedbacks,
          totalPages: Math.ceil(summary.totalFeedbacks / limit)
        }
      },
      metadata: {
        restaurant_id: restaurantId,
        period_days: period,
        filters_applied: {
          rating: ratingFilter,
          status: statusFilter
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      summary: null
    }, { status: 500 });
  }
}

// POST endpoint - Add new feedback
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { customer_id, restaurant_id = 1, rating, feedback_text, status = 'pending' } = body;

    if (!customer_id || !rating) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customer_id and rating'
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        error: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    const insertSQL = `
      INSERT INTO CUSTOMER_FEEDBACK (id_customer, id_restaurant, rating, feedback_text, feedback_date, status)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;

    const result = await query(insertSQL, [
      customer_id,
      restaurant_id,
      rating,
      feedback_text || '',
      status
    ]);

    console.log(`✅ Added new feedback from customer ${customer_id}`);

    return NextResponse.json({
      success: true,
      message: 'Feedback added successfully',
      data: {
        feedback_id: result.insertId,
        customer_id,
        restaurant_id,
        rating,
        feedback_text: feedback_text || '',
        status,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error adding feedback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT endpoint - Update feedback status
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { feedback_id, status, response_text } = body;

    if (!feedback_id || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: feedback_id and status'
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'reviewed', 'responded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be: pending, reviewed, or responded'
      }, { status: 400 });
    }

    const updateSQL = `
      UPDATE CUSTOMER_FEEDBACK 
      SET status = ?, updated_at = NOW()
      WHERE id_feedback = ?
    `;

    await query(updateSQL, [status, feedback_id]);

    console.log(`✅ Updated feedback ${feedback_id} status to ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: {
        feedback_id,
        status,
        response_text: response_text || null,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating feedback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}