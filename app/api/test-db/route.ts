import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Make sure this path is correct

export async function GET() {
  try {
    // A simple query to ask the database what time it is.
    const result = await query('SELECT NOW() as currentTime');

    console.log("Database connection successful, time is:", result);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("Database connection failed:", error);
    return new NextResponse('Database connection failed', { status: 500 });
  }
}