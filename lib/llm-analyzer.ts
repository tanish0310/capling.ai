// LLM-powered transaction analysis for Capling
// Supports multiple LLM providers with intelligent fallbacks

export interface TransactionAnalysis {
  classification: 'responsible' | 'irresponsible' | 'neutral'
  reflection: string
  confidence: number
  reasoning: string
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
const parseAnalysisResponse = (analysisText: string, merchant: string, amount: number, description: string): TransactionAnalysis => {
  try {
    // Try to parse as JSON first
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          classification: parsed.classification || 'neutral',
          reflection: parsed.reflection || analysisText,
          confidence: parsed.confidence || 0.8,
          reasoning: parsed.reasoning || 'AI analysis'
        }
      }
    } catch (jsonError) {
      // If JSON parsing fails, continue with text parsing
    }
    
    // Fallback to text parsing
    let classification = 'neutral'
    let reflection = analysisText
    let reasoning = 'AI analysis'
    
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
      reasoning: reasoning
    }
  } catch (error) {
    console.error('Error parsing analysis response:', error)
    // Fallback to mock analysis
    return generateMockAnalysis(merchant, amount, description)
  }
}

const createAnalysisPrompt = (merchant: string, amount: number, description: string) => {
  return `You are Capling, a friendly financial advisor dinosaur. Analyze this transaction and provide personalized, encouraging feedback.

Transaction Details:
- Merchant: ${merchant}
- Amount: $${amount.toFixed(2)}
- Description: ${description}

Classify this transaction as one of:
- "responsible": Essential purchases, planned expenses, good value
- "irresponsible": Unplanned, expensive, or potentially wasteful
- "neutral": Neither particularly good nor bad

Provide your analysis in this exact JSON format:
{
  "classification": "responsible|irresponsible|neutral",
  "reflection": "A personalized, encouraging message specific to this purchase (max 120 characters, NO EMOJIS)",
  "confidence": 0.85,
  "reasoning": "Brief explanation of your decision (max 60 characters)"
}

Be specific about the merchant and amount. For example:
- Starbucks $4.50 → "Your morning coffee ritual is worth it!"
- Target $150 → "Target run! Hope you got everything you needed"
- Porsche $100000 → "Whoa! That's a big purchase - was this planned?"

IMPORTANT: Do not use any emojis in the reflection field. Keep it text-only.

Make it personal and relevant to the specific purchase. Be encouraging but honest.`
}

// Mock LLM response for development/fallback
const generateMockAnalysis = (merchant: string, amount: number, description: string): TransactionAnalysis => {
  const desc = (description || '').toLowerCase()
  const merchantLower = (merchant || '').toLowerCase()
  
  // Personalized responses based on specific merchants
  const merchantResponses: Record<string, { classification: TransactionAnalysis['classification'], reflection: string, reasoning: string, confidence: number }> = {
    'starbucks': {
      classification: amount > 8 ? 'irresponsible' : 'responsible',
      reflection: amount > 8 ? 'That\'s a lot for coffee! Maybe try making it at home?' : 'A little treat is totally fine!',
      reasoning: amount > 8 ? 'Expensive coffee' : 'Reasonable treat',
      confidence: 0.8
    },
    'mcdonald\'s': {
      classification: 'neutral',
      reflection: 'Fast food again? Your wallet and health might appreciate a home-cooked meal!',
      reasoning: 'Fast food expense',
      confidence: 0.7
    },
    'target': {
      classification: amount > 50 ? 'neutral' : 'responsible',
      reflection: amount > 50 ? 'Target got you again! Did you stick to your list?' : 'Smart shopping at Target!',
      reasoning: amount > 50 ? 'Large retail purchase' : 'Planned shopping',
      confidence: 0.8
    },
    'shell gas': {
      classification: 'responsible',
      reflection: 'Gas is expensive these days, but you need it to get around!',
      reasoning: 'Essential transportation',
      confidence: 0.9
    },
    'netflix': {
      classification: 'responsible',
      reflection: 'Entertainment budget well spent! Much cheaper than going out',
      reasoning: 'Affordable entertainment',
      confidence: 0.85
    },
    'amazon': {
      classification: amount > 100 ? 'irresponsible' : amount > 50 ? 'neutral' : 'responsible',
      reflection: amount > 100 ? 'Amazon Prime got you! Was this really necessary?' : amount > 50 ? 'Another Amazon purchase - are you getting good value?' : 'Smart online shopping!',
      reasoning: amount > 100 ? 'Large online purchase' : amount > 50 ? 'Moderate online purchase' : 'Small online purchase',
      confidence: 0.8
    },
    'uber': {
      classification: 'neutral',
      reflection: 'Uber is convenient, but those rides add up fast! Consider walking or public transport',
      reasoning: 'Transportation convenience',
      confidence: 0.7
    },
    'whole foods': {
      classification: 'neutral',
      reflection: 'Whole Foods is great for quality, but ouch on the wallet! Maybe try Trader Joe\'s?',
      reasoning: 'Premium grocery shopping',
      confidence: 0.8
    },
    'spotify': {
      classification: 'responsible',
      reflection: 'Music makes everything better! Great value for unlimited tunes',
      reasoning: 'Affordable entertainment',
      confidence: 0.9
    },
    'cvs pharmacy': {
      classification: 'responsible',
      reflection: 'Health comes first! Taking care of yourself is always a good investment',
      reasoning: 'Essential health expense',
      confidence: 0.95
    },
    'chipotle': {
      classification: 'neutral',
      reflection: 'Chipotle is delicious, but $11+ for a burrito? Maybe meal prep instead?',
      reasoning: 'Expensive fast casual',
      confidence: 0.7
    },
    'apple store': {
      classification: amount > 50 ? 'irresponsible' : 'neutral',
      reflection: amount > 50 ? 'Apple tax strikes again! Do you really need the latest accessory?' : 'Apple accessories can be pricey, but quality matters!',
      reasoning: amount > 50 ? 'Expensive tech purchase' : 'Tech accessory',
      confidence: 0.8
    },
    'walmart': {
      classification: amount > 100 ? 'neutral' : 'responsible',
      reflection: amount > 100 ? 'Big Walmart haul! Hope you got everything you needed' : 'Smart bulk shopping at Walmart!',
      reasoning: amount > 100 ? 'Large grocery run' : 'Efficient shopping',
      confidence: 0.8
    },
    'lyft': {
      classification: 'neutral',
      reflection: 'Another ride-share! These small trips can really add up over time',
      reasoning: 'Transportation convenience',
      confidence: 0.7
    },
    'pizza hut': {
      classification: 'neutral',
      reflection: 'Pizza delivery is tempting, but homemade pizza is cheaper and healthier!',
      reasoning: 'Food delivery expense',
      confidence: 0.7
    }
  }

  // Check for exact merchant match first
  const merchantKey = Object.keys(merchantResponses).find(key => 
    merchantLower.includes(key.toLowerCase()) || key.toLowerCase().includes(merchantLower)
  )

  if (merchantKey) {
    return merchantResponses[merchantKey]
  }

  // Fallback to category-based analysis for unknown merchants
  let classification: TransactionAnalysis['classification'] = 'responsible'
  let reflection = 'Thanks for the purchase! Keep tracking your spending!'
  let reasoning = 'General purchase'
  let confidence = 0.7

  // Amount-based logic for unknown merchants
  if (amount > 200) {
    classification = 'irresponsible'
    reflection = `$${amount.toFixed(2)} is a big purchase! Was this planned?`
    reasoning = 'High amount'
    confidence = 0.9
  } else if (amount > 100) {
    classification = 'neutral'
    reflection = `$${amount.toFixed(2)} is a significant amount. Hope it was worth it!`
    reasoning = 'Moderate amount'
    confidence = 0.7
  } else if (amount < 5) {
    classification = 'responsible'
    reflection = `Just $${amount.toFixed(2)} - that's a small, manageable expense!`
    reasoning = 'Small amount'
    confidence = 0.8
  }

  // Category-based overrides for unknown merchants
  if (desc.includes('coffee') || desc.includes('latte') || desc.includes('cappuccino')) {
    classification = amount > 6 ? 'neutral' : 'responsible'
    reflection = amount > 6 ? 'That\'s pricey for coffee! Consider brewing at home' : 'A little coffee treat is totally fine!'
    reasoning = 'Coffee purchase'
    confidence = 0.8
  }

  if (desc.includes('grocery') || desc.includes('food') || desc.includes('grocery')) {
    classification = 'responsible'
    reflection = 'Groceries are essential! Good job planning your meals'
    reasoning = 'Essential food'
    confidence = 0.9
  }

  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('petrol')) {
    classification = 'responsible'
    reflection = 'Gas prices are crazy, but you need it to get around!'
    reasoning = 'Essential transportation'
    confidence = 0.9
  }

  if (desc.includes('subscription') || desc.includes('monthly')) {
    classification = 'responsible'
    reflection = 'Recurring subscriptions are great for budgeting! Just make sure you use it'
    reasoning = 'Subscription service'
    confidence = 0.8
  }

  if (desc.includes('delivery') || desc.includes('takeout')) {
    classification = 'neutral'
    reflection = 'Food delivery is convenient but expensive! Consider cooking at home'
    reasoning = 'Food delivery'
    confidence = 0.7
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
    console.log('🚀 Calling OpenAI API directly...')
    
    const prompt = createAnalysisPrompt(merchant, amount, description)
    
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
            content: 'You are a financial advisor helping users understand their spending habits. Provide personalized, encouraging feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
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
    
    // Parse the response to extract structured data
    return parseAnalysisResponse(analysisText, merchant, amount, description)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ OpenAI API call timed out after 10 seconds')
      throw new Error('OpenAI API call timed out')
    }
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
        temperature: 0.7,
        max_tokens: 300
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
  } catch (error) {
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