// app/api/feedback/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CustomerFeedback {
  id_feedback: number;
  id_customer: number;
  id_restaurant: number;
  rating: number;
  comment: string;
  feedback_date: string;
  status: string;
  customer_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rating = searchParams.get('rating');
    const status = searchParams.get('status') || 'approved';
    const sortBy = searchParams.get('sort') || 'latest';
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Fetching feedback with simplified filters:', {
      rating, status, sortBy, limit
    });

    // Simple SQL without complex joins first
    let sql = `
      SELECT 
        id_feedback,
        id_customer,
        id_restaurant,
        rating,
        comment,
        feedback_date,
        status,
        CONCAT('Customer #', id_customer) as customer_name
      FROM CUSTOMER_FEEDBACK
      WHERE 1=1
    `;

    const params: any[] = [];

    // Add filters
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (rating && rating !== 'all') {
      sql += ' AND rating = ?';
      params.push(parseInt(rating));
    }

    // Add sorting
    if (sortBy === 'latest') {
      sql += ' ORDER BY feedback_date DESC';
    } else if (sortBy === 'oldest') {
      sql += ' ORDER BY feedback_date ASC';
    } else if (sortBy === 'rating_high') {
      sql += ' ORDER BY rating DESC, feedback_date DESC';
    } else if (sortBy === 'rating_low') {
      sql += ' ORDER BY rating ASC, feedback_date DESC';
    }

    sql += ' LIMIT ?';
    params.push(limit);

    console.log('SQL Query:', sql);
    console.log('Parameters:', params);

    const feedback = await query(sql, params) as CustomerFeedback[];

    // Simple summary - no complex aggregations
    const summarySQL = `
      SELECT 
        COUNT(*) as total_feedback,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM CUSTOMER_FEEDBACK 
      WHERE status = ?
    `;

    const summary = await query(summarySQL, ['approved']) as any[];

    console.log(`Found ${feedback.length} feedback entries`);

    return NextResponse.json({
      success: true,
      data: feedback.map(f => ({
        ...f,
        restaurant_name: `Restaurant #${f.id_restaurant}` // Simple restaurant name
      })),
      summary: summary[0] || {
        total_feedback: 0,
        avg_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
        recent_feedback: 0,
        pending_feedback: 0
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Add new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_customer, id_restaurant, rating, comment } = body;

    console.log('Adding new feedback:', { id_customer, id_restaurant, rating });

    // Validate required fields
    if (!id_customer || !id_restaurant || !rating) {
      return NextResponse.json(
        { error: 'Customer ID, Restaurant ID, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO CUSTOMER_FEEDBACK (id_customer, id_restaurant, rating, comment, feedback_date, status) 
      VALUES (?, ?, ?, ?, NOW(), 'approved')
    `;

    const result = await query(sql, [id_customer, id_restaurant, rating, comment || '']);

    console.log('Feedback added successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: (result as any).insertId
    });

  } catch (error) {
    console.error('Error adding feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}