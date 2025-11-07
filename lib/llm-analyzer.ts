// LLM-powered transaction analysis for Capling
// Supports multiple LLM providers with intelligent fallbacks

export interface TransactionAnalysis {
  classification: 'responsible' | 'irresponsible' | 'neutral'
  reflection: string
  confidence: number
  reasoning: string
  improvement_suggestion?: string | null
}

export interface JustificationAnalysis {
  isValid: boolean
  reasoning: string
  newReflection: string
  confidence: number
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
// Parse OpenAI response into structured analysis
const parseAnalysisResponse = (analysisText: string, merchant: string, amount: number, description: string, accountBalance?: number): TransactionAnalysis => {
  console.log('🔍 Parsing analysis response:', analysisText)
  try {
    // Try to parse as JSON first
    try {
      // First try to parse the entire response as JSON
      const parsed = JSON.parse(analysisText)
      if (parsed && typeof parsed === 'object') {
        return {
          classification: parsed.classification || 'neutral',
          reflection: parsed.reflection || analysisText,
          confidence: parsed.confidence || 0.8,
          reasoning: parsed.reasoning || 'AI analysis',
          improvement_suggestion: parsed.improvement_suggestion || null
        }
      }
    } catch (jsonError) {
      // If that fails, try to extract JSON from the text
      try {
        // Look for JSON pattern in the text
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log('🔍 Found JSON match:', jsonMatch[0])
          const parsed = JSON.parse(jsonMatch[0])
          console.log('🔍 Parsed JSON:', parsed)
          return {
            classification: parsed.classification || 'neutral',
            reflection: parsed.reflection || analysisText,
            confidence: parsed.confidence || 0.8,
            reasoning: parsed.reasoning || 'AI analysis',
            improvement_suggestion: parsed.improvement_suggestion || null
          }
        }
      } catch (jsonError2) {
        // If JSON parsing fails, continue with text parsing
        console.log('JSON parsing failed, falling back to text parsing')
      }
    }
    
    // Fallback to text parsing
    let classification = 'neutral'
    let reflection = analysisText
    let reasoning = 'AI analysis'
    let improvement_suggestion: string | null = null
    
    // Special case: if the reflection contains JSON, try to parse it
    if (analysisText.includes('"classification"') && analysisText.includes('"reflection"')) {
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('🔍 Found JSON in reflection field:', parsed)
          return {
            classification: parsed.classification || 'neutral',
            reflection: parsed.reflection || analysisText,
            confidence: parsed.confidence || 0.8,
            reasoning: parsed.reasoning || 'AI analysis',
            improvement_suggestion: parsed.improvement_suggestion || null
          }
        }
      } catch (error) {
        console.log('Failed to parse JSON from reflection field')
      }
    }
    
    // Look for classification indicators
    if (analysisText.toLowerCase().includes('responsible') || analysisText.toLowerCase().includes('good') || analysisText.toLowerCase().includes('wise')) {
      classification = 'responsible'
    } else if (analysisText.toLowerCase().includes('irresponsible') || analysisText.toLowerCase().includes('bad') || analysisText.toLowerCase().includes('wasteful')) {
      classification = 'irresponsible'
    }
    
    // Look for reflection field
    const reflectionMatch = analysisText.match(/reflection[:\s]+(.+?)(?:\n|$)/i)
    if (reflectionMatch) {
      reflection = reflectionMatch[1].trim()
    }
    
    // Look for reasoning
    const reasoningMatch = analysisText.match(/reasoning[:\s]+(.+?)(?:\n|$)/i)
    if (reasoningMatch) {
      reasoning = reasoningMatch[1].trim()
    }
    
    return {
      classification: classification as 'responsible' | 'irresponsible' | 'neutral',
      reflection: reflection,
      confidence: 0.8,
      reasoning: reasoning,
      improvement_suggestion: null
    }
  } catch (error) {
    console.error('Error parsing analysis response:', error)
    // Fallback to mock analysis
    return generateMockAnalysis(merchant, amount, description, accountBalance)
  }
}

const createAnalysisPrompt = (merchant: string, amount: number, description: string, accountBalance?: number) => {
  const balanceContext = accountBalance !== undefined 
    ? `\n- Current Account Balance: $${accountBalance.toFixed(2)}`
    : ''
  
  const affordabilityGuidance = accountBalance !== undefined
    ? `\n\nConsider affordability: A $${amount.toFixed(2)} purchase represents ${((amount / accountBalance) * 100).toFixed(1)}% of the user's current balance.`
    : ''

  return `You are Capling, a strict but friendly financial advisor dinosaur. Analyze this transaction with realistic financial standards.

Transaction Details:
- Merchant: ${merchant}
- Amount: $${amount.toFixed(2)}
- Description: ${description}${balanceContext}${affordabilityGuidance}

STRICT CLASSIFICATION RULES:
- "responsible": ONLY essential purchases (groceries, gas, bills, medicine) OR very affordable treats (<$10) OR planned purchases that are <5% of balance
- "irresponsible": Luxury items (designer brands, expensive electronics, jewelry), unplanned large purchases (>$50), or anything >10% of balance
- "neutral": Moderate purchases ($10-50) that aren't essential but aren't clearly wasteful

REALISTIC EXAMPLES:
- Starbucks $4.50 with $1000 balance → "responsible" (small treat)
- Prada $500 with $15000 balance → "irresponsible" (luxury brand, 3.3% of balance)
- Target $150 with $500 balance → "irresponsible" (30% of balance!)
- Groceries $80 with $2000 balance → "responsible" (essential)
- iPhone $1000 with $5000 balance → "irresponsible" (20% of balance, luxury item)
- Gas $45 with $1000 balance → "responsible" (essential)

You must respond with ONLY a valid JSON object. No other text, no explanations, no markdown.

Example response:
{"classification": "irresponsible", "reflection": "This is a luxury purchase that may not be necessary.", "confidence": 0.85, "reasoning": "Luxury item, high cost", "improvement_suggestion": "Consider cheaper alternatives or save for this purchase."}

Your response must be in this exact format:
{
  "classification": "responsible|irresponsible|neutral",
  "reflection": "A realistic, honest message about this purchase (max 120 characters, NO EMOJIS)",
  "confidence": 0.85,
  "reasoning": "Brief explanation of your decision (max 60 characters)",
  "improvement_suggestion": "If irresponsible, suggest one specific actionable improvement (max 100 characters, NO EMOJIS). If responsible/neutral, use null."
}

BE REALISTIC: Most purchases over $50 are NOT responsible unless they're essential. Luxury brands, designer items, and expensive electronics should almost always be "irresponsible" unless the user is very wealthy.

CRITICAL: Your response must be ONLY the JSON object. No other text whatsoever.`
}

// Mock LLM response for development/fallback
const generateMockAnalysis = (merchant: string, amount: number, description: string, accountBalance?: number): TransactionAnalysis => {
  // Simple fallback for when LLM is not available
  // This should rarely be used since we have LLM analysis
  let classification: TransactionAnalysis['classification'] = 'neutral'
  let reflection = 'Transaction recorded. Keep tracking your spending!'
  let reasoning = 'General purchase'
  let confidence = 0.5
  let improvement_suggestion: string | null = 'Consider if this purchase aligns with your financial goals'

  // Basic amount-based fallback
  if (amount > 200) {
    classification = 'irresponsible'
    reflection = `$${amount.toFixed(2)} is a large purchase. Was this planned?`
    reasoning = 'High amount'
    confidence = 0.7
    improvement_suggestion = 'Wait 24 hours before making large purchases to avoid impulse buying'
  } else if (amount < 10) {
    classification = 'responsible'
    reflection = `$${amount.toFixed(2)} is a small, manageable expense!`
    reasoning = 'Small amount'
    confidence = 0.7
    improvement_suggestion = null
  }


  return {
    classification,
    reflection,
    confidence,
    reasoning,
    improvement_suggestion
  }
}

// OpenAI API integration via server route
const analyzeWithOpenAI = async (
  merchant: string, 
  amount: number, 
  description: string, 
  config: LLMConfig,
  accountBalance?: number
): Promise<TransactionAnalysis> => {
  try {
    console.log('🚀 Calling OpenAI API directly...')
    
    const prompt = createAnalysisPrompt(merchant, amount, description, accountBalance)
    
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a strict financial advisor helping users understand their spending habits. Be realistic and honest about what constitutes responsible spending. Most luxury purchases and large unplanned expenses should be classified as irresponsible. You must respond with ONLY a valid JSON object. No other text, explanations, or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('📡 OpenAI API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ OpenAI API error:', response.status, errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    console.log('✅ Received OpenAI analysis:', result)
    
    const analysisText = result.choices[0]?.message?.content || 'Unable to analyze transaction'
    console.log('🔍 Raw LLM response:', analysisText)
    
    // Parse the response to extract structured data
    return parseAnalysisResponse(analysisText, merchant, amount, description, accountBalance)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ OpenAI API call timed out after 10 seconds')
      throw new Error('OpenAI API call timed out')
    }
    console.error('❌ API analysis failed:', error)
    // Fallback to mock analysis
    return generateMockAnalysis(merchant, amount, description, accountBalance)
  }
}

// Anthropic Claude API integration
const analyzeWithAnthropic = async (
  merchant: string, 
  amount: number, 
  description: string, 
  config: LLMConfig,
  accountBalance?: number
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
    return generateMockAnalysis(merchant, amount, description, accountBalance)
  }
}

// Main analysis function
export const analyzeTransaction = async (
  merchant: string,
  amount: number,
  description: string,
  config: LLMConfig = defaultConfig,
  accountBalance?: number
): Promise<TransactionAnalysis> => {
  console.log(`🤖 Analyzing transaction: ${merchant} - $${amount} (${description})`)
  console.log(`🔧 Using provider: ${config.provider}`)
  console.log(`🔑 API key available: ${config.apiKey ? 'Yes' : 'No'}`)

  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        console.warn('❌ OpenAI API key not provided, falling back to mock analysis')
        return generateMockAnalysis(merchant, amount, description, accountBalance)
      }
      console.log('🚀 Calling OpenAI API...')
      return analyzeWithOpenAI(merchant, amount, description, config, accountBalance)
    
    case 'anthropic':
      if (!config.apiKey) {
        console.warn('❌ Anthropic API key not provided, falling back to mock analysis')
        return generateMockAnalysis(merchant, amount, description, accountBalance)
      }
      console.log('🚀 Calling Anthropic API...')
      return analyzeWithAnthropic(merchant, amount, description, config, accountBalance)
    
    case 'mock':
    default:
      console.log('🎭 Using mock analysis')
      return generateMockAnalysis(merchant, amount, description, accountBalance)
  }
}

// Configuration helper - always use GPT via API route
export const getLLMConfig = (): LLMConfig => {
  const config = {
    provider: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo'
  }
  
  console.log('🔧 LLM Config:', {
    provider: config.provider,
    model: config.model,
    note: 'Using server-side API route',
    apiKeyAvailable: config.apiKey ? 'Yes' : 'No'
  })
  
  return config
}

// Analyze user justification for a transaction
export const analyzeJustification = async (
  merchant: string,
  amount: number,
  description: string,
  justification: string,
  originalClassification: string
): Promise<JustificationAnalysis> => {
  try {
    console.log('🤖 Analyzing justification:', { merchant, amount, justification })
    
    const config = getLLMConfig()
    
    if (config.provider === 'openai' && config.apiKey) {
      return await analyzeJustificationWithOpenAI(merchant, amount, description, justification, originalClassification, config)
    } else {
      // Fallback to mock analysis
      return generateMockJustificationAnalysis(merchant, amount, justification)
    }
  } catch (error) {
    console.error('❌ Justification analysis failed:', error)
    // Fallback analysis
    return {
      isValid: false,
      reasoning: 'Unable to analyze justification',
      newReflection: 'Justification could not be evaluated',
      confidence: 0.5
    }
  }
}

// OpenAI-based justification analysis
const analyzeJustificationWithOpenAI = async (
  merchant: string,
  amount: number,
  description: string,
  justification: string,
  originalClassification: string,
  config: LLMConfig
): Promise<JustificationAnalysis> => {
  try {
    const prompt = createJustificationPrompt(merchant, amount, description, justification, originalClassification)
    
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor helping users understand their spending decisions. Evaluate justifications fairly and provide constructive feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ OpenAI API error:', response.status, errorData)
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    const analysisText = result.choices[0]?.message?.content || 'Unable to analyze justification'
    
    return parseJustificationResponse(analysisText, merchant, amount, justification)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ OpenAI API call timed out after 10 seconds')
      throw new Error('OpenAI API call timed out')
    }
    console.error('❌ Justification analysis failed:', error)
    throw error
  }
}

// Create prompt for justification analysis
const createJustificationPrompt = (
  merchant: string,
  amount: number,
  description: string,
  justification: string,
  originalClassification: string
): string => {
  return `Please analyze this spending justification:

TRANSACTION:
- Merchant: ${merchant}
- Amount: $${amount}
- Description: ${description}
- Original Classification: ${originalClassification}

USER JUSTIFICATION:
"${justification}"

Please evaluate whether this justification is valid and reasonable. Consider:
1. Is the justification logical and well-reasoned?
2. Does it provide context that changes the spending decision?
3. Is it a legitimate reason for the purchase?
4. Does it show financial awareness and responsibility?

Respond in JSON format:
{
  "isValid": true/false,
  "reasoning": "Brief explanation of your decision",
  "newReflection": "Updated reflection message for the user",
  "confidence": 0.0-1.0
}

Examples:
- Valid: "I needed this for work" (for work-related purchases)
- Valid: "It was on sale and I've been saving for it" (planned purchase)
- Invalid: "I was bored" (impulsive spending)
- Invalid: "I deserve it" (without context)`
}

// Parse justification analysis response
const parseJustificationResponse = (
  analysisText: string,
  merchant: string,
  amount: number,
  justification: string
): JustificationAnalysis => {
  try {
    // Try to parse as JSON first
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        isValid: parsed.isValid || false,
        reasoning: parsed.reasoning || 'Analysis completed',
        newReflection: parsed.newReflection || 'Justification evaluated',
        confidence: parsed.confidence || 0.8
      }
    }
  } catch (jsonError) {
    // If JSON parsing fails, continue with text parsing
  }
  
  // Fallback to text parsing
  const isValid = analysisText.toLowerCase().includes('valid') && 
                  !analysisText.toLowerCase().includes('not valid') &&
                  !analysisText.toLowerCase().includes('invalid')
  
  return {
    isValid,
    reasoning: analysisText,
    newReflection: isValid 
      ? 'Your justification was accepted! This was a thoughtful purchase decision.'
      : 'Your justification was not sufficient to change the classification.',
    confidence: 0.7
  }
}

// Mock justification analysis for testing
const generateMockJustificationAnalysis = (
  merchant: string,
  amount: number,
  justification: string
): JustificationAnalysis => {
  const justificationLower = justification.toLowerCase()
  
  // Simple heuristics for mock analysis
  const validKeywords = ['work', 'needed', 'emergency', 'planned', 'sale', 'discount', 'gift', 'repair', 'medical']
  const invalidKeywords = ['bored', 'impulse', 'deserve', 'treat', 'whatever', 'idk', 'dunno']
  
  const hasValidKeywords = validKeywords.some(keyword => justificationLower.includes(keyword))
  const hasInvalidKeywords = invalidKeywords.some(keyword => justificationLower.includes(keyword))
  
  const isValid = hasValidKeywords && !hasInvalidKeywords && justification.length > 10
  
  return {
    isValid,
    reasoning: isValid 
      ? 'Your justification shows thoughtful consideration for this purchase.'
      : 'Your justification could be more specific about why this purchase was necessary.',
    newReflection: isValid
      ? 'Great justification! This shows you\'re thinking carefully about your spending decisions.'
      : 'Consider being more specific about why purchases are necessary in the future.',
    confidence: 0.8
  }
}