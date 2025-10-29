import { NextRequest, NextResponse } from 'next/server'
import { generateRealisticFinancialProfile } from '@/lib/realistic-fake-data'

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, incomeLevel = 'medium' } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Generate realistic financial profile
    const profile = generateRealisticFinancialProfile(
      userId,
      fullName,
      incomeLevel as 'low' | 'medium' | 'high'
    )

    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error) {
    console.error('Error generating sample data:', error)
    return NextResponse.json(
      { error: 'Failed to generate sample data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return available income levels and their characteristics
  return NextResponse.json({
    incomeLevels: {
      low: {
        description: 'Annual income: $30k-50k',
        weeklyBudget: '~$400',
        typicalBalance: '$1k-6k'
      },
      medium: {
        description: 'Annual income: $50k-80k', 
        weeklyBudget: '~$650',
        typicalBalance: '$2k-8k'
      },
      high: {
        description: 'Annual income: $80k+',
        weeklyBudget: '~$1000',
        typicalBalance: '$5k-15k'
      }
    },
    features: [
      'Realistic bank names (Chase, Bank of America, etc.)',
      'Realistic merchant names by category',
      'Realistic transaction amounts based on income level',
      'Realistic spending patterns and classifications',
      'Realistic account types and balances',
      'Realistic financial goals and risk tolerance'
    ]
  })
}