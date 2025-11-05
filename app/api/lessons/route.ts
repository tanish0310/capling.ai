import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Fetch all lessons for the user, ordered by newest first
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lessons: lessons || []
    });

  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, forceGenerate = false } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Call the daily lesson generation API
    const response = await fetch(`${request.nextUrl.origin}/api/generate-daily-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, forceGenerate })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating lesson:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}