import { NextRequest, NextResponse } from 'next/server'
import { generateMockAnalysis } from '@/lib/llm-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchant, amount, description } = body

    if (!merchant || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing mock analysis for:', { merchant, amount, description })
    
    const analysis = generateMockAnalysis(merchant, amount, description)
    
    console.log('✅ Mock analysis result:', analysis)

    return NextResponse.json({
      success: true,
      analysis,
      test: 'mock'
    })

  } catch (error) {
    console.error('❌ Test LLM error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}