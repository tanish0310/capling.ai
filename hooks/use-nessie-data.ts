'use client'

import { useState, useEffect, useCallback } from 'react'
import { nessieApi, nessieUtils, type NessieAccount, type NessieTransaction, type NessieCustomer } from '@/lib/nessie-api'
import { config } from '@/lib/config'

export interface CaplingTransaction {
  id: string
  merchant: string
  amount: number
  category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining'
  classification: 'responsible' | 'borderline' | 'impulsive'
  reflection?: string
  date: string
  rawTransaction: NessieTransaction
}

export interface CaplingAccount {
  id: string
  nickname: string
  type: string
  balance: number
  accountNumber: string
  rawAccount: NessieAccount
}

export function useNessieData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<NessieCustomer | null>(null)
  const [accounts, setAccounts] = useState<CaplingAccount[]>([])
  const [transactions, setTransactions] = useState<CaplingTransaction[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // Load customer data
  const loadCustomer = useCallback(async (customerId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const id = customerId || config.nessie.defaultCustomerId
      if (!id) {
        throw new Error('No customer ID provided')
      }

      const customerData = await nessieApi.getCustomer(id)
      setCustomer(customerData)
      return customerData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer'
      setError(errorMessage)
      console.error('Error loading customer:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Load accounts for customer
  const loadAccounts = useCallback(async (customerId: string) => {
    try {
      const accountsData = await nessieApi.getAccounts(customerId)
      const caplingAccounts: CaplingAccount[] = accountsData.map(account => ({
        id: account._id,
        nickname: account.nickname,
        type: account.type,
        balance: account.balance,
        accountNumber: account.account_number,
        rawAccount: account,
      }))
      
      setAccounts(caplingAccounts)
      
      // Auto-select first account if none selected
      if (caplingAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(caplingAccounts[0].id)
      }
      
      return caplingAccounts
    } catch (err) {
      console.error('Error loading accounts:', err)
      throw err
    }
  }, [selectedAccountId])

  // Load transactions for account
  const loadTransactions = useCallback(async (accountId: string) => {
    try {
      const [transactionsData, accountData] = await Promise.all([
        nessieApi.getTransactions(accountId),
        nessieApi.getAccount(accountId)
      ])

      const caplingTransactions: CaplingTransaction[] = transactionsData
        .map(transaction => nessieUtils.convertTransaction(transaction, accountData))
        .sort((a, b) => new Date(b.rawTransaction.transaction_date).getTime() - new Date(a.rawTransaction.transaction_date).getTime())

      setTransactions(caplingTransactions)
      return caplingTransactions
    } catch (err) {
      console.error('Error loading transactions:', err)
      throw err
    }
  }, [])

  // Initialize data
  const initializeData = useCallback(async (customerId?: string) => {
    try {
      setLoading(true)
      setError(null)

      const customerData = await loadCustomer(customerId)
      const accountsData = await loadAccounts(customerData._id)
      
      // Load transactions for the first account
      if (accountsData.length > 0) {
        await loadTransactions(accountsData[0].id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loadCustomer, loadAccounts, loadTransactions])

  // Create new transaction
  const createTransaction = useCallback(async (accountId: string, transactionData: {
    amount: number
    description: string
    type?: string
  }) => {
    try {
      const newTransaction = await nessieApi.createTransaction(accountId, {
        amount: -transactionData.amount, // Negative for debits
        description: transactionData.description,
        type: transactionData.type || 'purchase',
        medium: 'balance',
        status: 'completed',
        transaction_date: new Date().toISOString(),
      })

      // Reload transactions to get updated list
      await loadTransactions(accountId)
      return newTransaction
    } catch (err) {
      console.error('Error creating transaction:', err)
      throw err
    }
  }, [loadTransactions])

  // Calculate weekly spending
  const getWeeklySpending = useCallback(() => {
    if (transactions.length === 0) return 0
    return nessieUtils.calculateWeeklySpending(transactions.map(t => t.rawTransaction))
  }, [transactions])

  // Get current account balance
  const getCurrentBalance = useCallback(() => {
    const currentAccount = accounts.find(acc => acc.id === selectedAccountId)
    return currentAccount?.balance || 0
  }, [accounts, selectedAccountId])

  // Get current account
  const getCurrentAccount = useCallback(() => {
    return accounts.find(acc => acc.id === selectedAccountId)
  }, [accounts, selectedAccountId])

  // Switch account
  const switchAccount = useCallback(async (accountId: string) => {
    setSelectedAccountId(accountId)
    await loadTransactions(accountId)
  }, [loadTransactions])

  // Initialize on mount
  useEffect(() => {
    if (config.nessie.apiKey) {
      initializeData()
    } else {
      setError('Nessie API key not configured')
      setLoading(false)
    }
  }, [initializeData])

  return {
    // State
    loading,
    error,
    customer,
    accounts,
    transactions,
    selectedAccountId,
    
    // Computed values
    weeklySpending: getWeeklySpending(),
    currentBalance: getCurrentBalance(),
    currentAccount: getCurrentAccount(),
    
    // Actions
    initializeData,
    loadCustomer,
    loadAccounts,
    loadTransactions,
    createTransaction,
    switchAccount,
    
    // Utilities
    refreshData: () => initializeData(),
  }
}
