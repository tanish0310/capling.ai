import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header found' },
        { status: 401 }
      )
    }

    // For now, let's return a simple response
    // In a real app, you'd validate the JWT token here
    return NextResponse.json({
      message: 'To get your user ID, check the browser console or look at the header in your app',
      instructions: [
        '1. Open your app at http://localhost:3000',
        '2. Sign in to your account', 
        '3. Look at the header - your user ID is displayed there',
        '4. Or open browser console and run: console.log(window.localStorage.getItem("supabase.auth.token"))',
        '5. Or check the Network tab in DevTools when you make API calls'
      ],
      example: {
        userId: 'your-actual-user-id-here',
        note: 'Replace this with your real user ID from the app'
      }
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}