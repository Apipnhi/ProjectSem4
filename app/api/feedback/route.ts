// app/api/feedback/route.ts - Endpoint untuk feedback sesuai frontend
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Feedback {
  id_feedback: number;
  rating: number;
  comment: string;
  feedback_date: string;
  customer_name: string;
  restaurant_name: string;
  status: string;
  id_restaurant?: number;
  sentiment_score?: number;
  category?: string;
}

interface FeedbackSummary {
  total_feedback: number;
  avg_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  recent_feedback: number;
  pending_feedback: number;
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

function safeNumber(value: any): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('💬 Fetching feedback data...');
    
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id') || '1';
    const rating = searchParams.get('rating') || 'all';
    const status = searchParams.get('status') || 'approved';
    const sort = searchParams.get('sort') || 'latest';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build feedback query
    let feedbackQuery = `
      SELECT 
        cf.id_feedback,
        cf.rating,
        cf.comment,
        cf.feedback_date,
        cf.status,
        cf.id_restaurant,
        CONCAT('Customer ', cf.id_customer) as customer_name,
        'Restaurant' as restaurant_name
      FROM CUSTOMER_FEEDBACK cf
      WHERE cf.id_restaurant = ?
    `;
    
    const queryParams = [restaurantId];
    
    // Apply rating filter
    if (rating !== 'all') {
      feedbackQuery += ' AND cf.rating = ?';
      queryParams.push(rating);
    }
    
    // Apply status filter
    if (status !== 'all') {
      feedbackQuery += ' AND cf.status = ?';
      queryParams.push(status);
    }
    
    // Apply sorting
    switch (sort) {
      case 'latest':
        feedbackQuery += ' ORDER BY cf.feedback_date DESC';
        break;
      case 'oldest':
        feedbackQuery += ' ORDER BY cf.feedback_date ASC';
        break;
      case 'highest':
        feedbackQuery += ' ORDER BY cf.rating DESC, cf.feedback_date DESC';
        break;
      case 'lowest':
        feedbackQuery += ' ORDER BY cf.rating ASC, cf.feedback_date DESC';
        break;
      default:
        feedbackQuery += ' ORDER BY cf.feedback_date DESC';
    }
    
    feedbackQuery += ' LIMIT ?';
    queryParams.push(limit.toString());
    
    const feedbackResult = await query(feedbackQuery, queryParams);
    
    // Process feedback data
    const feedback: Feedback[] = feedbackResult.map((item: any) => ({
      id_feedback: item.id_feedback,
      rating: item.rating,
      comment: item.comment,
      feedback_date: item.feedback_date,
      customer_name: item.customer_name,
      restaurant_name: item.restaurant_name,
      status: item.status,
      id_restaurant: item.id_restaurant,
      sentiment_score: Math.random() * 2 - 1, // Mock sentiment score
      category: Math.random() > 0.5 ? 'food' : Math.random() > 0.5 ? 'service' : 'ambiance'
    }));

    // Calculate summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_feedback,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
        SUM(CASE WHEN feedback_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_feedback,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_feedback
      FROM CUSTOMER_FEEDBACK 
      WHERE id_restaurant = ?
    `;
    
    const summaryResult = await query(summaryQuery, [restaurantId]);
    const summaryData = summaryResult[0] || {};
    
    const summary: FeedbackSummary = {
      total_feedback: safeNumber(summaryData.total_feedback),
      avg_rating: Math.round(safeNumber(summaryData.avg_rating) * 10) / 10,
      five_star: safeNumber(summaryData.five_star),
      four_star: safeNumber(summaryData.four_star),
      three_star: safeNumber(summaryData.three_star),
      two_star: safeNumber(summaryData.two_star),
      one_star: safeNumber(summaryData.one_star),
      recent_feedback: safeNumber(summaryData.recent_feedback),
      pending_feedback: safeNumber(summaryData.pending_feedback),
      sentiment_analysis: {
        positive: feedback.filter(f => (f.sentiment_score || 0) > 0.2).length,
        neutral: feedback.filter(f => Math.abs(f.sentiment_score || 0) <= 0.2).length,
        negative: feedback.filter(f => (f.sentiment_score || 0) < -0.2).length
      }
    };

    return NextResponse.json({
      success: true,
      data: feedback,
      summary: summary,
      metadata: {
        restaurant_id: parseInt(restaurantId),
        filters: { rating, status, sort },
        total_items: feedback.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      summary: null
    }, { status: 500 });
  }
}