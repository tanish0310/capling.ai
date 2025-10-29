'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  mockCustomer, 
  mockAccount, 
  initialMockTransactions,
  generateMockTransactions,
  calculateWeeklySpending,
  calculateCurrentBalance,
  generateSpendingInsights,
  addMockTransaction,
  type MockTransaction,
  type MockAccount,
  type MockCustomer
} from '@/lib/mock-data'

export interface CaplingTransaction {
  id: string
  merchant: string
  amount: number
  category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income'
  classification: 'responsible' | 'borderline' | 'impulsive'
  reflection?: string
  date: string
  rawTransaction: MockTransaction
}

export interface CaplingAccount {
  id: string
  nickname: string
  type: string
  balance: number
  accountNumber: string
  rawAccount: MockAccount
}

export function useMockData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customer] = useState<MockCustomer>(mockCustomer)
  const [account] = useState<MockAccount>(mockAccount)
  const [transactions, setTransactions] = useState<MockTransaction[]>(initialMockTransactions)
  const [selectedAccountId] = useState<string>(mockAccount.id)

  // Initialize mock data
  const initializeData = useCallback(() => {
    console.log('🔄 Initializing mock data...')
    console.log('📊 Initial transactions available:', initialMockTransactions.length)
    // Data is already loaded in useState, just ensure loading is false
    setLoading(false)
    setError(null)
    console.log('✅ Mock data ready')
  }, [])

  // Create new transaction
  const createTransaction = useCallback(async (accountId: string, transactionData: {
    amount: number
    description: string
    type?: string
  }) => {
    try {
      console.log('🤖 Creating transaction with LLM analysis...')
      
      // Determine category from description
      const getCategory = (description: string): CaplingTransaction['category'] => {
        const desc = description.toLowerCase()
        if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant')) return 'food'
        if (desc.includes('gas') || desc.includes('uber') || desc.includes('transport')) return 'transport'
        if (desc.includes('amazon') || desc.includes('store') || desc.includes('shopping')) return 'shopping'
        if (desc.includes('bill') || desc.includes('utility') || desc.includes('rent')) return 'bills'
        if (desc.includes('movie') || desc.includes('game') || desc.includes('entertainment')) return 'entertainment'
        if (desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('health')) return 'health'
        return 'dining'
      }

      const newTransaction = await addMockTransaction(
        transactions,
        transactionData.description,
        transactionData.amount,
        getCategory(transactionData.description),
        transactionData.description
      )

      console.log('✅ Transaction created with analysis:', newTransaction.classification)
      setTransactions(prev => [newTransaction, ...prev])
      return newTransaction
    } catch (err) {
      console.error('Error creating transaction:', err)
      throw err
    }
  }, [transactions])

  // Calculate weekly spending
  const getWeeklySpending = useCallback(() => {
    return calculateWeeklySpending(transactions)
  }, [transactions])

  // Get current account balance
  const getCurrentBalance = useCallback(() => {
    return calculateCurrentBalance(transactions)
  }, [transactions])

  // Get current account
  const getCurrentAccount = useCallback((): CaplingAccount => {
    return {
      id: account.id,
      nickname: account.nickname,
      type: account.type,
      balance: getCurrentBalance(),
      accountNumber: account.accountNumber,
      rawAccount: account
    }
  }, [account, getCurrentBalance])

  // Get spending insights
  const getSpendingInsights = useCallback(() => {
    return generateSpendingInsights(transactions)
  }, [transactions])

  // Convert MockTransaction to CaplingTransaction
  const convertToCaplingTransaction = useCallback((mockTx: MockTransaction): CaplingTransaction => ({
    id: mockTx.id,
    merchant: mockTx.merchant,
    amount: mockTx.amount,
    category: mockTx.category,
    classification: mockTx.classification,
    reflection: mockTx.reflection,
    date: mockTx.date,
    rawTransaction: mockTx,
  }), [])

  // Get all transactions as Capling format
  const getCaplingTransactions = useCallback((): CaplingTransaction[] => {
    return transactions.map(convertToCaplingTransaction)
  }, [transactions, convertToCaplingTransaction])

  // Refresh data (regenerate some transactions)
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Keep some existing transactions and add a few new ones
      const existingCount = Math.max(10, Math.floor(transactions.length * 0.7))
      const existingTransactions = transactions.slice(0, existingCount)
      const newTransactions = generateMockTransactions(5)
      
      setTransactions([...existingTransactions, ...newTransactions])
    } catch (err) {
      console.error('Error refreshing data:', err)
    } finally {
      setLoading(false)
    }
  }, [transactions])

  // Initialize on mount
  useEffect(() => {
    console.log('🚀 useEffect triggered, initializing data...')
    initializeData()
  }, [initializeData])

  return {
    // State
    loading,
    error,
    customer,
    accounts: [getCurrentAccount()],
    transactions: getCaplingTransactions(),
    selectedAccountId,
    
    // Computed values
    weeklySpending: getWeeklySpending(),
    currentBalance: getCurrentBalance(),
    currentAccount: getCurrentAccount(),
    spendingInsights: getSpendingInsights(),
    
    // Actions
    initializeData,
    createTransaction,
    refreshData,
    
    // Utilities
    convertToCaplingTransaction,
  }
}
