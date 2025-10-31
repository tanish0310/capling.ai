'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Account = Database['public']['Tables']['accounts']['Row']
type Goal = Database['public']['Tables']['goals']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface SpendingInsights {
  totalSpent: number
  responsiblePercentage: number
  topCategory: string
  transactionCount: number
}

export function useSupabaseData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Computed values
  const [spendingInsights, setSpendingInsights] = useState<SpendingInsights>({
    totalSpent: 0,
    responsiblePercentage: 0,
    topCategory: 'shopping',
    transactionCount: 0
  })

  const currentAccount = accounts[0] || null
  const currentBalance = currentAccount?.balance || 0
  const weeklyBudget = userProfile?.weekly_budget || 850

  // Fetch all user data
  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        { data: transactionsData, error: transactionsError },
        { data: accountsData, error: accountsError },
        { data: goalsData, error: goalsError },
        { data: profileData, error: profileError }
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false }),
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
      ])

      if (transactionsError) {
        console.error('Transactions query error:', transactionsError)
        throw new Error(`Failed to fetch transactions: ${transactionsError.message}`)
      }
      if (accountsError) {
        console.error('Accounts query error:', accountsError)
        throw new Error(`Failed to fetch accounts: ${accountsError.message}`)
      }
      if (goalsError) {
        console.error('Goals query error:', goalsError)
        throw new Error(`Failed to fetch goals: ${goalsError.message}`)
      }
      if (profileError) {
        console.error('Profile query error:', profileError)
        throw new Error(`Failed to fetch user profile: ${profileError.message}`)
      }

      // If no profile exists, create a realistic one
      let finalProfileData = profileData
      if (!profileData) {
        console.log('No user profile found - user needs to complete onboarding')
        // Don't create realistic data - let the onboarding process handle it
        finalProfileData = null
      }

      // If no account exists, don't create one automatically during onboarding
      let finalAccountsData = accountsData
      if (!accountsData || accountsData.length === 0) {
        console.log('No account found - user needs to complete onboarding')
        // Don't create realistic data - let the onboarding process handle it
        finalAccountsData = []
      }

      // If no transactions exist, don't create them automatically during onboarding
      let finalTransactionsData = transactionsData
      if (!transactionsData || transactionsData.length === 0) {
        console.log('No transactions found - user needs to complete onboarding')
        // Don't create realistic data - let the onboarding process handle it
        finalTransactionsData = []
      }

      setTransactions(finalTransactionsData || [])
      setAccounts(finalAccountsData || [])
      setGoals(goalsData || [])
      setUserProfile(finalProfileData)

      // Calculate spending insights
      const totalSpent = (finalTransactionsData || [])
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)

      const responsibleCount = (finalTransactionsData || [])
        .filter(t => t.classification === 'responsible').length

      const totalCount = (finalTransactionsData || []).length
      const responsiblePercentage = totalCount > 0 ? (responsibleCount / totalCount) * 100 : 0

      // Find top category
      const categoryCounts = (finalTransactionsData || []).reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'shopping'

      setSpendingInsights({
        totalSpent,
        responsiblePercentage,
        topCategory,
        transactionCount: totalCount
      })

    } catch (err) {
      console.error('Error fetching user data:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        user: user ? { id: user.id, email: user.email } : 'No user',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create a new transaction
  const createTransaction = useCallback(async (transactionData: {
    merchant: string
    amount: number
    category: Transaction['category']
    description?: string
  }) => {
    if (!user) {
      throw new Error('User not authenticated. Please sign in.')
    }
    if (!currentAccount) {
      throw new Error('No account found. Please create an account first.')
    }
    
    console.log('Creating transaction with:', {
      user: user.id,
      account: currentAccount.id,
      transactionData
    })

    try {
      // Get LLM analysis
      const response = await fetch('/api/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: transactionData.merchant,
          amount: transactionData.amount,
          description: transactionData.description || transactionData.merchant
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Transaction analysis failed:', response.status, errorText)
        throw new Error(`Failed to analyze transaction: ${response.status} ${errorText}`)
      }

      const analysis = await response.json()

      const now = new Date()
      const newTransaction = {
        user_id: user.id,
        account_id: currentAccount.id,
        merchant: transactionData.merchant,
        amount: transactionData.amount,
        category: transactionData.category,
        classification: analysis.classification,
        reflection: analysis.reflection,
        description: transactionData.description || transactionData.merchant,
        date: now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: now.getTime(),
        type: 'debit' as const
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select()
        .single()

      if (error) throw error

      // Update local state
      setTransactions(prev => [data, ...prev])

      // Update account balance
      const newBalance = currentAccount.balance - transactionData.amount
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', currentAccount.id)

      if (updateError) throw updateError

      setAccounts(prev => prev.map(acc => 
        acc.id === currentAccount.id 
          ? { ...acc, balance: newBalance }
          : acc
      ))

      return data
    } catch (err) {
      console.error('Error creating transaction:', err)
      if (err instanceof Error) {
        throw new Error(`Failed to create transaction: ${err.message}`)
      } else {
        throw new Error('Failed to create transaction: Unknown error')
      }
    }
  }, [user, currentAccount])

  // Refresh data
  const refreshData = useCallback(() => {
    fetchUserData()
  }, [fetchUserData])

  // Load data on mount and when user changes
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return {
    loading,
    error,
    transactions,
    accounts,
    goals,
    userProfile,
    currentAccount,
    currentBalance,
    weeklyBudget,
    spendingInsights,
    createTransaction,
    refreshData
  }
}