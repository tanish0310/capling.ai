import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { merchant, amount, description } = await request.json()

    // Validate and provide fallbacks
    const validMerchant = merchant || 'Unknown Merchant'
    const validAmount = amount || 0
    const validDescription = description || merchant || 'No description provided'

    if (!merchant || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Create the analysis prompt
    const prompt = `You are Capling, a friendly financial advisor dinosaur. Analyze this transaction and provide helpful, encouraging feedback.

Transaction Details:
- Merchant: ${validMerchant}
- Amount: $${validAmount.toFixed(2)}
- Description: ${validDescription}

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

Be encouraging but honest. Focus on helping the user make better financial decisions.

CRITICAL: Respond with ONLY the JSON object. No other text.`

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    })

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const content = response.text()

    if (!content) {
      return NextResponse.json(
        { error: 'No response from Gemini' },
        { status: 500 }
      )
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const analysis = JSON.parse(jsonMatch[0])
    
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