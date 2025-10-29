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
          .single()
      ])

      if (transactionsError) throw transactionsError
      if (accountsError) throw accountsError
      if (goalsError) throw goalsError
      if (profileError) throw profileError

      setTransactions(transactionsData || [])
      setAccounts(accountsData || [])
      setGoals(goalsData || [])
      setUserProfile(profileData)

      // Calculate spending insights
      const totalSpent = transactionsData
        ?.filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0) || 0

      const responsibleCount = transactionsData
        ?.filter(t => t.classification === 'responsible').length || 0

      const totalCount = transactionsData?.length || 0
      const responsiblePercentage = totalCount > 0 ? (responsibleCount / totalCount) * 100 : 0

      // Find top category
      const categoryCounts = transactionsData?.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

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
    if (!user || !currentAccount) {
      throw new Error('User or account not found')
    }

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
        throw new Error('Failed to analyze transaction')
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
      throw err
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
