import { NextRequest, NextResponse } from 'next/server'
import { analyzeTransaction, getLLMConfig } from '@/lib/llm-analyzer'

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

    console.log('🧪 Testing Gemini analysis for:', { merchant, amount, description })
    
    const config = getLLMConfig()
    const analysis = await analyzeTransaction(merchant, amount, description, config)
    
    console.log('✅ Gemini analysis result:', analysis)

    return NextResponse.json({
      success: true,
      analysis,
      test: 'gemini',
      provider: config.provider
    })

  } catch (error) {
    console.error('❌ Test LLM error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}