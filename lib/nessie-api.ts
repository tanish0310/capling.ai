// Nessie API integration for Capling
// Documentation: http://api.nessieisreal.com/

const NESSIE_BASE_URL = 'http://api.nessieisreal.com'
const NESSIE_API_KEY = process.env.NEXT_PUBLIC_NESSIE_API_KEY || ''

if (!NESSIE_API_KEY) {
  console.warn('Nessie API key not found. Please set NEXT_PUBLIC_NESSIE_API_KEY in your environment variables.')
}

// Types based on Nessie API documentation
export interface NessieCustomer {
  _id: string
  first_name: string
  last_name: string
  address: {
    street_number: string
    street_name: string
    city: string
    state: string
    zip: string
  }
}

export interface NessieAccount {
  _id: string
  type: string
  nickname: string
  rewards: number
  balance: number
  account_number: string
  customer_id: string
}

export interface NessieTransaction {
  _id: string
  type: string
  transaction_date: string
  status: string
  payee_id: string
  medium: string
  amount: number
  description: string
  account_id: string
}

export interface NessieBill {
  _id: string
  status: string
  payee: string
  nickname: string
  payment_date: string
  recurring_date: number
  payment_amount: number
  account_id: string
}

export interface NessieTransfer {
  _id: string
  type: string
  transaction_date: string
  status: string
  medium: string
  amount: number
  description: string
  payee_id: string
  payer_id: string
}

// API Helper function
async function nessieRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${NESSIE_BASE_URL}${endpoint}?key=${NESSIE_API_KEY}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Nessie API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Customer endpoints
export const nessieApi = {
  // Get all customers (Enterprise endpoint)
  getCustomers: (): Promise<NessieCustomer[]> => 
    nessieRequest<NessieCustomer[]>('/enterprise/customers'),

  // Get specific customer
  getCustomer: (customerId: string): Promise<NessieCustomer> => 
    nessieRequest<NessieCustomer>(`/customers/${customerId}`),

  // Create new customer
  createCustomer: (customerData: Partial<NessieCustomer>): Promise<NessieCustomer> => 
    nessieRequest<NessieCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),

  // Account endpoints
  getAccounts: (customerId: string): Promise<NessieAccount[]> => 
    nessieRequest<NessieAccount[]>(`/customers/${customerId}/accounts`),

  getAccount: (accountId: string): Promise<NessieAccount> => 
    nessieRequest<NessieAccount>(`/accounts/${accountId}`),

  createAccount: (customerId: string, accountData: Partial<NessieAccount>): Promise<NessieAccount> => 
    nessieRequest<NessieAccount>(`/customers/${customerId}/accounts`, {
      method: 'POST',
      body: JSON.stringify(accountData),
    }),

  // Transaction endpoints
  getTransactions: (accountId: string): Promise<NessieTransaction[]> => 
    nessieRequest<NessieTransaction[]>(`/accounts/${accountId}/transactions`),

  createTransaction: (accountId: string, transactionData: Partial<NessieTransaction>): Promise<NessieTransaction> => 
    nessieRequest<NessieTransaction>(`/accounts/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    }),

  // Bill endpoints
  getBills: (accountId: string): Promise<NessieBill[]> => 
    nessieRequest<NessieBill[]>(`/accounts/${accountId}/bills`),

  createBill: (accountId: string, billData: Partial<NessieBill>): Promise<NessieBill> => 
    nessieRequest<NessieBill>(`/accounts/${accountId}/bills`, {
      method: 'POST',
      body: JSON.stringify(billData),
    }),

  // Transfer endpoints
  createTransfer: (transferData: Partial<NessieTransfer>): Promise<NessieTransfer> => 
    nessieRequest<NessieTransfer>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    }),

  // ATM/Branch locations (Enterprise endpoint)
  getATMs: (lat?: number, lng?: number, rad?: number): Promise<any[]> => 
    nessieRequest<any[]>(`/enterprise/atms${lat && lng ? `?lat=${lat}&lng=${lng}&rad=${rad || 10}` : ''}`),

  getBranches: (lat?: number, lng?: number, rad?: number): Promise<any[]> => 
    nessieRequest<any[]>(`/enterprise/branches${lat && lng ? `?lat=${lat}&lng=${lng}&rad=${rad || 10}` : ''}`),
}

// Utility functions for Capling integration
export const nessieUtils = {
  // Convert Nessie transaction to Capling format
  convertTransaction: (nessieTransaction: NessieTransaction, account: NessieAccount): any => {
    const amount = Math.abs(nessieTransaction.amount)
    const isDebit = nessieTransaction.amount < 0
    
    // Simple category mapping based on description
    const getCategory = (description: string): string => {
      const desc = description.toLowerCase()
      if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant')) return 'food'
      if (desc.includes('gas') || desc.includes('uber') || desc.includes('transport')) return 'transport'
      if (desc.includes('amazon') || desc.includes('store') || desc.includes('shopping')) return 'shopping'
      if (desc.includes('bill') || desc.includes('utility') || desc.includes('rent')) return 'bills'
      return 'dining'
    }

    // Simple classification based on amount and type
    const getClassification = (amount: number, type: string): string => {
      if (type === 'deposit') return 'responsible'
      if (amount > 100) return 'borderline'
      return 'responsible'
    }

    return {
      id: nessieTransaction._id,
      merchant: nessieTransaction.description || 'Unknown Merchant',
      amount: amount,
      category: getCategory(nessieTransaction.description),
      classification: getClassification(amount, nessieTransaction.type),
      date: new Date(nessieTransaction.transaction_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      rawTransaction: nessieTransaction,
    }
  },

  // Calculate weekly spending from transactions
  calculateWeeklySpending: (transactions: NessieTransaction[]): number => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return transactions
      .filter(t => new Date(t.transaction_date) >= oneWeekAgo && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  },

  // Get account balance
  getAccountBalance: (account: NessieAccount): number => {
    return account.balance
  },
}
