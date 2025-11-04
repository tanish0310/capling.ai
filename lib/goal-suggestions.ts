// Goal allocation suggestions based on transaction categories and merchants

export interface Goal {
  id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  emoji: string
  category: string
  target_date: string | null
  is_completed: boolean
}

export interface GoalSuggestion {
  goalId: string
  suggestedAmount: number
  reason: string
  confidence: number
}

// Category mappings for automatic goal suggestions
const categoryMappings: Record<string, string[]> = {
  'shopping': ['general', 'home', 'entertainment'],
  'food': ['general', 'health'],
  'transport': ['general', 'car'],
  'bills': ['general', 'home', 'emergency'],
  'dining': ['general', 'entertainment'],
  'entertainment': ['entertainment', 'general'],
  'health': ['health', 'emergency'],
  'income': ['general', 'emergency', 'savings']
}

// Merchant-specific suggestions
const merchantMappings: Record<string, string[]> = {
  'starbucks': ['general'],
  'mcdonald\'s': ['general'],
  'target': ['home', 'general'],
  'walmart': ['home', 'general'],
  'amazon': ['home', 'general', 'entertainment'],
  'netflix': ['entertainment'],
  'spotify': ['entertainment'],
  'apple': ['general', 'entertainment'],
  'google': ['general', 'entertainment'],
  'uber': ['transport', 'general'],
  'lyft': ['transport', 'general'],
  'shell': ['transport', 'car'],
  'exxon': ['transport', 'car'],
  'whole foods': ['health', 'general'],
  'trader joe\'s': ['health', 'general'],
  'chipotle': ['general'],
  'pizza hut': ['general', 'entertainment'],
  'domino\'s': ['general', 'entertainment'],
  'gucci': ['general', 'entertainment'],
  'nike': ['general', 'health'],
  'adidas': ['general', 'health'],
  'zara': ['general'],
  'h&m': ['general'],
  'uniqlo': ['general']
}

export function suggestGoalAllocations(
  transactionAmount: number,
  merchant: string,
  category: string,
  goals: Goal[]
): GoalSuggestion[] {
  const activeGoals = goals.filter(goal => !goal.is_completed)
  if (activeGoals.length === 0) return []

  const suggestions: GoalSuggestion[] = []
  const merchantLower = merchant.toLowerCase()
  
  // Get relevant goal categories based on transaction
  let relevantCategories: string[] = []
  
  // Check merchant-specific mappings first
  for (const [merchantKey, categories] of Object.entries(merchantMappings)) {
    if (merchantLower.includes(merchantKey)) {
      relevantCategories = [...relevantCategories, ...categories]
    }
  }
  
  // Add category-based mappings
  if (categoryMappings[category]) {
    relevantCategories = [...relevantCategories, ...categoryMappings[category]]
  }
  
  // Remove duplicates
  relevantCategories = [...new Set(relevantCategories)]
  
  // If no specific mappings, suggest general goals
  if (relevantCategories.length === 0) {
    relevantCategories = ['general', 'emergency']
  }

  // Find goals that match relevant categories
  const matchingGoals = activeGoals.filter(goal => 
    relevantCategories.includes(goal.category)
  )

  // If no matching goals, suggest the most urgent goals (lowest progress)
  const goalsToSuggest = matchingGoals.length > 0 ? matchingGoals : activeGoals

  // Calculate suggestions
  for (const goal of goalsToSuggest) {
    const progressPercentage = (goal.current_amount / goal.target_amount) * 100
    const remainingAmount = goal.target_amount - goal.current_amount
    
    // Skip completed or nearly completed goals
    if (progressPercentage >= 95) continue
    
    // Calculate suggested amount based on various factors
    let suggestedAmount = 0
    let confidence = 0.5
    let reason = ''

    // For income transactions, suggest larger allocations
    if (category === 'income') {
      suggestedAmount = Math.min(transactionAmount * 0.3, remainingAmount * 0.1)
      confidence = 0.8
      reason = 'Income should be allocated towards savings goals'
    }
    // For essential categories, suggest smaller allocations
    else if (['bills', 'health', 'transport'].includes(category)) {
      suggestedAmount = Math.min(transactionAmount * 0.1, remainingAmount * 0.05)
      confidence = 0.6
      reason = 'Essential expense - small allocation towards goals'
    }
    // For discretionary spending, suggest larger allocations
    else if (['entertainment', 'dining', 'shopping'].includes(category)) {
      suggestedAmount = Math.min(transactionAmount * 0.2, remainingAmount * 0.1)
      confidence = 0.7
      reason = 'Discretionary spending - allocate more towards goals'
    }
    // For luxury purchases, suggest significant allocations
    else if (merchantLower.includes('gucci') || merchantLower.includes('designer') || transactionAmount > 500) {
      suggestedAmount = Math.min(transactionAmount * 0.4, remainingAmount * 0.2)
      confidence = 0.9
      reason = 'Luxury purchase - significant allocation recommended'
    }
    // Default case
    else {
      suggestedAmount = Math.min(transactionAmount * 0.15, remainingAmount * 0.08)
      confidence = 0.5
      reason = 'General allocation towards goals'
    }

    // Adjust confidence based on goal urgency
    if (progressPercentage < 25) {
      confidence += 0.2 // Boost confidence for goals that need more progress
    } else if (progressPercentage > 75) {
      confidence -= 0.1 // Reduce confidence for nearly complete goals
    }

    // Only suggest if amount is meaningful (> $1)
    if (suggestedAmount >= 1) {
      suggestions.push({
        goalId: goal.id,
        suggestedAmount: Math.round(suggestedAmount * 100) / 100, // Round to 2 decimal places
        reason,
        confidence: Math.min(confidence, 1.0)
      })
    }
  }

  // Sort by confidence and suggested amount
  return suggestions.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 0.1) {
      return b.suggestedAmount - a.suggestedAmount
    }
    return b.confidence - a.confidence
  })
}

// Get a smart default allocation based on suggestions
export function getSmartAllocation(
  transactionAmount: number,
  merchant: string,
  category: string,
  goals: Goal[]
): Record<string, number> {
  const suggestions = suggestGoalAllocations(transactionAmount, merchant, category, goals)
  const allocation: Record<string, number> = {}
  
  let remainingAmount = transactionAmount
  
  // Allocate based on top suggestions
  for (const suggestion of suggestions.slice(0, 3)) { // Top 3 suggestions
    if (remainingAmount <= 0) break
    
    const amount = Math.min(suggestion.suggestedAmount, remainingAmount)
    if (amount > 0) {
      allocation[suggestion.goalId] = amount
      remainingAmount -= amount
    }
  }
  
  return allocation
}