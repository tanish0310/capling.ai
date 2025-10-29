// Mock banking data system for Capling
// Simulates realistic transactions, balances, and spending patterns

export interface MockTransaction {
  id: string
  merchant: string
  amount: number
  category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income'
  classification: 'responsible' | 'borderline' | 'impulsive'
  reflection?: string
  date: string
  timestamp: number
  type: 'debit' | 'credit'
}

export interface MockAccount {
  id: string
  nickname: string
  type: string
  balance: number
  accountNumber: string
}

export interface MockCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
}

// Mock customer data
export const mockCustomer: MockCustomer = {
  id: 'customer_001',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@example.com'
}

// Mock account data
export const mockAccount: MockAccount = {
  id: 'account_001',
  nickname: 'Main Checking',
  type: 'Checking',
  balance: 2847.50,
  accountNumber: '****1234'
}

// Realistic transaction templates
const transactionTemplates = [
  // Responsible transactions
  { merchant: 'Whole Foods Market', amount: 87.50, category: 'food' as const, classification: 'responsible' as const, reflection: 'Healthy groceries for the week - great planning!' },
  { merchant: 'Shell Gas Station', amount: 45.20, category: 'transport' as const, classification: 'responsible' as const, reflection: 'Regular fuel fill-up for the week' },
  { merchant: 'Electric Company', amount: 125.30, category: 'bills' as const, classification: 'responsible' as const, reflection: 'Monthly utility bill - essential expense' },
  { merchant: 'CVS Pharmacy', amount: 23.45, category: 'health' as const, classification: 'responsible' as const, reflection: 'Prescription medication - necessary health expense' },
  { merchant: 'Target', amount: 67.89, category: 'shopping' as const, classification: 'responsible' as const, reflection: 'Household essentials and toiletries' },
  
  // Borderline transactions
  { merchant: 'Starbucks', amount: 6.50, category: 'food' as const, classification: 'borderline' as const, reflection: 'Consider brewing coffee at home to save $150/month' },
  { merchant: 'Uber', amount: 18.75, category: 'transport' as const, classification: 'borderline' as const, reflection: 'Could have used public transport to save money' },
  { merchant: 'Netflix', amount: 15.99, category: 'entertainment' as const, classification: 'borderline' as const, reflection: 'Monthly subscription - consider if you use it enough' },
  { merchant: 'Chipotle', amount: 12.45, category: 'dining' as const, classification: 'borderline' as const, reflection: 'Lunch out - could meal prep to save money' },
  { merchant: 'Spotify', amount: 9.99, category: 'entertainment' as const, classification: 'borderline' as const, reflection: 'Music subscription - evaluate if you need premium' },
  
  // Impulsive transactions
  { merchant: 'Amazon', amount: 124.99, category: 'shopping' as const, classification: 'impulsive' as const, reflection: 'Was this purchase planned? Try the 24-hour rule next time.' },
  { merchant: 'Apple Store', amount: 299.99, category: 'shopping' as const, classification: 'impulsive' as const, reflection: 'Big purchase! Did you really need this right now?' },
  { merchant: 'Steam', amount: 59.99, category: 'entertainment' as const, classification: 'impulsive' as const, reflection: 'Gaming purchase - consider your backlog before buying more' },
  { merchant: 'Sephora', amount: 89.50, category: 'shopping' as const, classification: 'impulsive' as const, reflection: 'Beauty products - do you have similar items already?' },
  { merchant: 'DoorDash', amount: 34.67, category: 'dining' as const, classification: 'impulsive' as const, reflection: 'Food delivery is expensive - try cooking at home' },
  
  // Income transactions
  { merchant: 'Employer Direct Deposit', amount: 2500.00, category: 'income' as const, classification: 'responsible' as const, reflection: 'Monthly salary - great job!' },
  { merchant: 'Freelance Payment', amount: 350.00, category: 'income' as const, classification: 'responsible' as const, reflection: 'Side project income - nice work!' },
]

// Generate realistic transaction dates
function generateTransactionDates(count: number): Date[] {
  const dates: Date[] = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30) // Last 30 days
    const hoursAgo = Math.floor(Math.random() * 24) // Random hour
    const minutesAgo = Math.floor(Math.random() * 60) // Random minute
    
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(date.getHours() - hoursAgo)
    date.setMinutes(date.getMinutes() - minutesAgo)
    
    dates.push(date)
  }
  
  return dates.sort((a, b) => b.getTime() - a.getTime()) // Sort newest first
}

// Generate mock transactions
export function generateMockTransactions(count: number = 20): MockTransaction[] {
  const dates = generateTransactionDates(count)
  
  return dates.map((date, index) => {
    const template = transactionTemplates[Math.floor(Math.random() * transactionTemplates.length)]
    const isIncome = template.category === 'income'
    
    return {
      id: `txn_${Date.now()}_${index}`,
      merchant: template.merchant,
      amount: template.amount,
      category: template.category,
      classification: template.classification,
      reflection: template.reflection,
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: date.getTime(),
      type: isIncome ? 'credit' : 'debit'
    }
  })
}

// Calculate weekly spending from transactions
export function calculateWeeklySpending(transactions: MockTransaction[]): number {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return transactions
    .filter(t => t.timestamp >= oneWeekAgo.getTime() && t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
}

// Calculate current balance from transactions
export function calculateCurrentBalance(transactions: MockTransaction[]): number {
  return transactions.reduce((balance, t) => {
    return t.type === 'credit' ? balance + t.amount : balance - t.amount
  }, mockAccount.balance)
}

// Generate realistic spending insights
export function generateSpendingInsights(transactions: MockTransaction[]) {
  const weeklySpending = calculateWeeklySpending(transactions)
  const totalSpending = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
  
  const categoryBreakdown = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)
  
  const classificationBreakdown = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => {
      acc[t.classification] = (acc[t.classification] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  return {
    weeklySpending,
    totalSpending,
    categoryBreakdown,
    classificationBreakdown,
    averageTransaction: totalSpending / transactions.filter(t => t.type === 'debit').length || 0,
    mostSpentCategory: Object.entries(categoryBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
    responsiblePercentage: (classificationBreakdown.responsible || 0) / transactions.filter(t => t.type === 'debit').length * 100 || 0
  }
}

// Simulate adding a new transaction with LLM analysis
export async function addMockTransaction(
  transactions: MockTransaction[],
  merchant: string,
  amount: number,
  category: MockTransaction['category'],
  description?: string
): Promise<MockTransaction> {
  const now = new Date()
  
  // Import LLM analyzer dynamically to avoid circular dependencies
  const { analyzeTransaction, getLLMConfig } = await import('./llm-analyzer')
  
  // Get LLM analysis
  const analysis = await analyzeTransaction(merchant, amount, description || merchant, getLLMConfig())
  
  const newTransaction: MockTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    merchant,
    amount,
    category,
    classification: analysis.classification,
    reflection: analysis.reflection,
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now.getTime(),
    type: 'debit'
  }
  
  return newTransaction
}

// Synchronous version for initial mock data generation
export function createMockTransaction(
  merchant: string,
  amount: number,
  category: MockTransaction['category'],
  classification: MockTransaction['classification'],
  reflection: string
): MockTransaction {
  const now = new Date()
  
  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    merchant,
    amount,
    category,
    classification,
    reflection,
    date: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    timestamp: now.getTime(),
    type: 'debit'
  }
}

// Initial mock data
export const initialMockTransactions = generateMockTransactions(15)
