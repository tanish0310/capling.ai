import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { merchant, amount, description } = await request.json()

    if (!merchant || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount, description' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create the analysis prompt
    const prompt = `You are Capling, a friendly financial advisor dinosaur. Analyze this transaction and provide helpful, encouraging feedback.

Transaction Details:
- Merchant: ${merchant}
- Amount: $${amount.toFixed(2)}
- Description: ${description}

Classify this transaction as one of:
- "responsible": Essential purchases, planned expenses, good value
- "borderline": Questionable but understandable, could be optimized
- "impulsive": Unplanned, expensive, or potentially wasteful

Provide your analysis in this exact JSON format:
{
  "classification": "responsible|borderline|impulsive",
  "reflection": "A friendly, encouraging one-line message (max 100 characters)",
  "confidence": 0.85,
  "reasoning": "Brief explanation of your decision (max 50 characters)"
}

Examples:
- $4.50 coffee → "responsible" with "Small treat, totally fine!"
- $150 Amazon → "borderline" with "Big purchase - was this planned?"
- $800 phone → "impulsive" with "Whoa! Did you really need this now?"

Be encouraging but honest. Focus on helping the user make better financial decisions.`

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    // Parse JSON response
    const analysis = JSON.parse(content)
    
    return NextResponse.json({
      classification: analysis.classification,
      reflection: analysis.reflection,
      confidence: analysis.confidence || 0.8,
      reasoning: analysis.reasoning || 'AI analysis'
    })

  } catch (error) {
    console.error('Transaction analysis error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to analyze transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
