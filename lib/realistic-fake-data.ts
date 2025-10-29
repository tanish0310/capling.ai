// Realistic fake financial data generator
// Uses patterns from real financial data to create more believable mock data

export interface RealisticAccount {
  id: string
  user_id: string
  account_name: string
  account_type: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  account_number: string
  routing_number: string
  bank_name: string
  created_at: string
  updated_at: string
}

export interface RealisticTransaction {
  id: string
  user_id: string
  account_id: string
  merchant: string
  amount: number
  category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income' | 'transfer'
  classification: 'responsible' | 'borderline' | 'impulsive'
  reflection: string | null
  description: string | null
  date: string
  timestamp: number
  type: 'debit' | 'credit'
  created_at: string
  updated_at: string
}

export interface RealisticUserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  weekly_budget: number
  monthly_income: number
  financial_goals: string[]
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
  created_at: string
  updated_at: string
}

// Realistic bank names
const BANK_NAMES = [
  'Chase Bank',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Capital One',
  'PNC Bank',
  'US Bank',
  'TD Bank',
  'Regions Bank',
  'Fifth Third Bank'
]

// Realistic merchant names by category
const MERCHANTS_BY_CATEGORY = {
  food: [
    'Whole Foods Market', 'Trader Joe\'s', 'Kroger', 'Safeway', 'Publix',
    'Walmart Supercenter', 'Target', 'Costco', 'Aldi', 'Food Lion'
  ],
  dining: [
    'McDonald\'s', 'Starbucks', 'Subway', 'Chipotle', 'Panera Bread',
    'Dunkin\'', 'Taco Bell', 'KFC', 'Pizza Hut', 'Domino\'s',
    'Olive Garden', 'Red Lobster', 'Outback Steakhouse', 'Buffalo Wild Wings'
  ],
  transport: [
    'Shell', 'Exxon', 'BP', 'Chevron', 'Mobil', 'Uber', 'Lyft',
    'Metro Transit', 'Amtrak', 'Delta Airlines', 'Southwest Airlines'
  ],
  shopping: [
    'Amazon', 'Target', 'Walmart', 'Best Buy', 'Home Depot', 'Lowe\'s',
    'Macy\'s', 'Nordstrom', 'Sephora', 'Ulta Beauty', 'Nike', 'Adidas'
  ],
  bills: [
    'Electric Company', 'Gas Company', 'Water Department', 'Internet Provider',
    'Phone Company', 'Insurance Company', 'Rent Payment', 'Mortgage Payment'
  ],
  entertainment: [
    'Netflix', 'Spotify', 'Apple Music', 'YouTube Premium', 'Hulu',
    'Disney+', 'Steam', 'PlayStation Store', 'Xbox Live', 'Movie Theater'
  ],
  health: [
    'CVS Pharmacy', 'Walgreens', 'Rite Aid', 'Doctor\'s Office',
    'Dental Clinic', 'Eye Care Center', 'Gym Membership', 'Yoga Studio'
  ],
  income: [
    'Employer Direct Deposit', 'Freelance Payment', 'Consulting Fee',
    'Investment Dividend', 'Tax Refund', 'Side Hustle Income'
  ]
}

// Realistic spending patterns based on income level
const SPENDING_PATTERNS = {
  low: { // $30k-50k annual income
    weekly_budget: 400,
    monthly_income: 3500,
    typical_transaction_amounts: {
      food: [25, 85],
      dining: [8, 25],
      transport: [35, 65],
      shopping: [15, 120],
      bills: [80, 200],
      entertainment: [10, 50],
      health: [20, 80]
    }
  },
  medium: { // $50k-80k annual income
    weekly_budget: 650,
    monthly_income: 5500,
    typical_transaction_amounts: {
      food: [40, 120],
      dining: [12, 35],
      transport: [45, 85],
      shopping: [25, 200],
      bills: [100, 300],
      entertainment: [15, 75],
      health: [30, 120]
    }
  },
  high: { // $80k+ annual income
    weekly_budget: 1000,
    monthly_income: 8000,
    typical_transaction_amounts: {
      food: [60, 180],
      dining: [20, 60],
      transport: [60, 120],
      shopping: [50, 400],
      bills: [150, 500],
      entertainment: [25, 150],
      health: [50, 200]
    }
  }
}

// Generate realistic account data
export function generateRealisticAccount(userId: string, incomeLevel: 'low' | 'medium' | 'high' = 'medium'): RealisticAccount {
  const bankName = BANK_NAMES[Math.floor(Math.random() * BANK_NAMES.length)]
  const accountTypes: RealisticAccount['account_type'][] = ['checking', 'savings', 'credit']
  const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)]
  
  // Generate realistic account number (last 4 digits)
  const accountNumber = '****' + Math.floor(1000 + Math.random() * 9000).toString()
  
  // Generate realistic routing number (9 digits)
  const routingNumber = Math.floor(100000000 + Math.random() * 900000000).toString()
  
  // Generate realistic balance based on account type and income level
  let balance: number
  switch (accountType) {
    case 'checking':
      balance = Math.floor(Math.random() * 5000) + 1000 // $1k-6k
      break
    case 'savings':
      balance = Math.floor(Math.random() * 25000) + 5000 // $5k-30k
      break
    case 'credit':
      balance = -(Math.floor(Math.random() * 8000) + 500) // -$500 to -$8.5k debt
      break
    default:
      balance = Math.floor(Math.random() * 5000) + 1000
  }
  
  const now = new Date()
  const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
  
  return {
    id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    account_name: accountType === 'checking' ? 'Main Checking' : 
                  accountType === 'savings' ? 'Emergency Savings' : 'Credit Card',
    account_type: accountType,
    balance,
    account_number: accountNumber,
    routing_number: routingNumber,
    bank_name: bankName,
    created_at: createdAt.toISOString(),
    updated_at: now.toISOString()
  }
}

// Generate realistic user profile
export function generateRealisticUserProfile(userId: string, fullName?: string, incomeLevel: 'low' | 'medium' | 'high' = 'medium'): RealisticUserProfile {
  const pattern = SPENDING_PATTERNS[incomeLevel]
  const now = new Date()
  
  const financialGoals = [
    'Build emergency fund',
    'Save for vacation',
    'Pay off credit card debt',
    'Save for down payment',
    'Invest in retirement',
    'Start side business'
  ].slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 random goals
  
  const riskTolerances: RealisticUserProfile['risk_tolerance'][] = ['conservative', 'moderate', 'aggressive']
  
  return {
    id: userId,
    full_name: fullName || null,
    avatar_url: null,
    weekly_budget: pattern.weekly_budget + Math.floor(Math.random() * 200) - 100, // ±$100 variation
    monthly_income: pattern.monthly_income + Math.floor(Math.random() * 1000) - 500, // ±$500 variation
    financial_goals: financialGoals,
    risk_tolerance: riskTolerances[Math.floor(Math.random() * riskTolerances.length)],
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  }
}

// Generate realistic transactions
export function generateRealisticTransactions(
  userId: string, 
  accountId: string, 
  count: number = 20,
  incomeLevel: 'low' | 'medium' | 'high' = 'medium'
): RealisticTransaction[] {
  const pattern = SPENDING_PATTERNS[incomeLevel]
  const transactions: RealisticTransaction[] = []
  const now = new Date()
  
  // Generate transaction dates over the last 30 days
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const transactionDate = new Date(now)
    transactionDate.setDate(transactionDate.getDate() - daysAgo)
    transactionDate.setHours(transactionDate.getHours() - hoursAgo)
    
    // Determine transaction type (90% debit, 10% credit/income)
    const isIncome = Math.random() < 0.1
    const category = isIncome ? 'income' : 
      (Object.keys(MERCHANTS_BY_CATEGORY).filter(c => c !== 'income')[
        Math.floor(Math.random() * (Object.keys(MERCHANTS_BY_CATEGORY).length - 1))
      ] as RealisticTransaction['category'])
    
    const merchants = MERCHANTS_BY_CATEGORY[category as keyof typeof MERCHANTS_BY_CATEGORY]
    const merchant = merchants[Math.floor(Math.random() * merchants.length)]
    
    // Generate realistic amount
    let amount: number
    if (isIncome) {
      amount = Math.floor(Math.random() * 2000) + 500 // $500-2500 income
    } else {
      const range = pattern.typical_transaction_amounts[category as keyof typeof pattern.typical_transaction_amounts]
      if (range) {
        amount = Math.floor(Math.random() * (range[1] - range[0])) + range[0]
      } else {
        amount = Math.floor(Math.random() * 100) + 10 // fallback
      }
    }
    
    // Generate classification based on amount and category
    let classification: RealisticTransaction['classification']
    if (isIncome) {
      classification = 'responsible'
    } else if (category === 'bills' || category === 'health') {
      classification = 'responsible'
    } else if (category === 'entertainment' && amount > 50) {
      classification = 'impulsive'
    } else if (category === 'shopping' && amount > 100) {
      classification = 'impulsive'
    } else if (category === 'dining' && amount > 20) {
      classification = 'borderline'
    } else {
      classification = Math.random() < 0.6 ? 'responsible' : 
                      Math.random() < 0.8 ? 'borderline' : 'impulsive'
    }
    
    // Generate reflection based on classification
    const reflections = {
      responsible: [
        'Essential expense - good planning!',
        'Necessary purchase for daily needs',
        'Smart financial decision',
        'Budgeted expense - well done!'
      ],
      borderline: [
        'Consider if this was really necessary',
        'Could have found a cheaper alternative',
        'Not urgent - could have waited',
        'Review your budget for this category'
      ],
      impulsive: [
        'Was this purchase planned?',
        'Try the 24-hour rule next time',
        'Consider your financial goals',
        'This might have been avoidable'
      ]
    }
    
    const reflection = reflections[classification][Math.floor(Math.random() * reflections[classification].length)]
    
    const transaction: RealisticTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      account_id: accountId,
      merchant,
      amount,
      category,
      classification,
      reflection,
      description: `${merchant} - ${category}`,
      date: transactionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: transactionDate.getTime(),
      type: isIncome ? 'credit' : 'debit',
      created_at: transactionDate.toISOString(),
      updated_at: transactionDate.toISOString()
    }
    
    transactions.push(transaction)
  }
  
  // Sort by timestamp (newest first)
  return transactions.sort((a, b) => b.timestamp - a.timestamp)
}

// Generate complete realistic financial profile
export function generateRealisticFinancialProfile(
  userId: string, 
  fullName?: string,
  incomeLevel: 'low' | 'medium' | 'high' = 'medium'
) {
  const account = generateRealisticAccount(userId, incomeLevel)
  const profile = generateRealisticUserProfile(userId, fullName, incomeLevel)
  const transactions = generateRealisticTransactions(userId, account.id, 25, incomeLevel)
  
  return {
    account,
    profile,
    transactions
  }
}