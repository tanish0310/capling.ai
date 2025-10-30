// LLM-powered transaction analysis for Capling
// Supports multiple LLM providers with intelligent fallbacks

export interface TransactionAnalysis {
  classification: 'responsible' | 'borderline' | 'impulsive'
  reflection: string
  confidence: number
  reasoning: string
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'mock'
  apiKey?: string
  model?: string
}

// Default configuration - always use GPT
const defaultConfig: LLMConfig = {
  provider: 'openai',
  model: 'gpt-3.5-turbo'
}

// Transaction analysis prompt
const createAnalysisPrompt = (merchant: string, amount: number, description: string) => {
  return `You are Capling, a friendly financial advisor dinosaur. Analyze this transaction and provide helpful, encouraging feedback.

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
}

// Mock LLM response for development/fallback
const generateMockAnalysis = (merchant: string, amount: number, description: string): TransactionAnalysis => {
  const desc = (description || '').toLowerCase()
  const merchantLower = (merchant || '').toLowerCase()
  
  // Simple heuristics for mock responses
  let classification: TransactionAnalysis['classification'] = 'responsible'
  let reflection = 'Great choice! This purchase aligns with your goals.'
  let reasoning = 'Essential expense'
  let confidence = 0.8

  // Amount-based logic
  if (amount > 200) {
    classification = 'impulsive'
    reflection = 'Big purchase! Did you really need this now?'
    reasoning = 'High amount'
    confidence = 0.9
  } else if (amount > 100) {
    classification = 'borderline'
    reflection = 'Large amount - was this planned?'
    reasoning = 'Moderate amount'
    confidence = 0.7
  }

  // Category-based overrides
  if (desc.includes('entertainment') || merchantLower.includes('steam') || merchantLower.includes('netflix')) {
    classification = 'borderline'
    reflection = 'Entertainment expense - are you getting value?'
    reasoning = 'Entertainment'
    confidence = 0.8
  }

  if (desc.includes('grocery') || desc.includes('food') || merchantLower.includes('whole foods')) {
    classification = 'responsible'
    reflection = 'Healthy groceries - great planning!'
    reasoning = 'Essential food'
    confidence = 0.9
  }

  if (desc.includes('gas') || desc.includes('transport') || merchantLower.includes('uber')) {
    classification = 'borderline'
    reflection = 'Transportation - could you save here?'
    reasoning = 'Transport'
    confidence = 0.7
  }

  if (desc.includes('bill') || desc.includes('utility') || desc.includes('rent')) {
    classification = 'responsible'
    reflection = 'Essential bill - necessary expense!'
    reasoning = 'Essential bill'
    confidence = 0.95
  }

  return {
    classification,
    reflection,
    confidence,
    reasoning
  }
}

// OpenAI API integration via server route
const analyzeWithOpenAI = async (
  merchant: string, 
  amount: number, 
  description: string, 
  config: LLMConfig
): Promise<TransactionAnalysis> => {
  try {
    console.log('🌐 Making request to analyze-transaction API...')
    const response = await fetch('/api/analyze-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant,
        amount,
        description
      })
    })

    console.log('📡 API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ API error:', response.status, errorData)
      throw new Error(`API error: ${response.status} - ${errorData.error}`)
    }

    const analysis = await response.json()
    console.log('✅ Received analysis:', analysis)
    
    return {
      classification: analysis.classification,
      reflection: analysis.reflection,
      confidence: analysis.confidence || 0.8,
      reasoning: analysis.reasoning || 'AI analysis'
    }
  } catch (error) {
    console.error('❌ API analysis failed:', error)
    // Fallback to mock analysis
    return generateMockAnalysis(merchant, amount, description)
  }
}

// Anthropic Claude API integration
const analyzeWithAnthropic = async (
  merchant: string, 
  amount: number, 
  description: string, 
  config: LLMConfig
): Promise<TransactionAnalysis> => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: createAnalysisPrompt(merchant, amount, description)
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('No response from Anthropic')
    }

    // Parse JSON response
    const analysis = JSON.parse(content)
    
    return {
      classification: analysis.classification,
      reflection: analysis.reflection,
      confidence: analysis.confidence || 0.8,
      reasoning: analysis.reasoning || 'AI analysis'
    }
  } catch (error) {
    console.error('Anthropic analysis failed:', error)
    // Fallback to mock analysis
    return generateMockAnalysis(merchant, amount, description)
  }
}

// Main analysis function
export const analyzeTransaction = async (
  merchant: string,
  amount: number,
  description: string,
  config: LLMConfig = defaultConfig
): Promise<TransactionAnalysis> => {
  console.log(`🤖 Analyzing transaction: ${merchant} - $${amount} (${description})`)
  console.log(`🔧 Using provider: ${config.provider}`)
  console.log(`🔑 API key available: ${config.apiKey ? 'Yes' : 'No'}`)

  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        console.warn('❌ OpenAI API key not provided, falling back to mock analysis')
        return generateMockAnalysis(merchant, amount, description)
      }
      console.log('🚀 Calling OpenAI API...')
      return analyzeWithOpenAI(merchant, amount, description, config)
    
    case 'anthropic':
      if (!config.apiKey) {
        console.warn('❌ Anthropic API key not provided, falling back to mock analysis')
        return generateMockAnalysis(merchant, amount, description)
      }
      console.log('🚀 Calling Anthropic API...')
      return analyzeWithAnthropic(merchant, amount, description, config)
    
    case 'mock':
    default:
      console.log('🎭 Using mock analysis')
      return generateMockAnalysis(merchant, amount, description)
  }
}

// Configuration helper - always use GPT via API route
export const getLLMConfig = (): LLMConfig => {
  const config = {
    provider: 'openai' as const,
    apiKey: 'server-side', // API key is handled server-side
    model: 'gpt-3.5-turbo'
  }
  
  console.log('🔧 LLM Config:', {
    provider: config.provider,
    model: config.model,
    note: 'Using server-side API route'
  })
  
  return config
}
