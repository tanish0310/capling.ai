'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseData } from './use-supabase-data'

export interface Badge {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  earnedAt?: Date
  category: 'spending' | 'saving' | 'streak' | 'milestone'
}

export function useBadges() {
  const { transactions, currentAccount, userProfile } = useSupabaseData()
  const [badges, setBadges] = useState<Badge[]>([])
  const [newBadge, setNewBadge] = useState<Badge | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set())

  // Calculate badge achievements
  const calculateBadges = useCallback(() => {
    const now = new Date()
    
    // Get current week's transactions
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const thisWeekTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= weekStart
    })

    // Get current month's transactions
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= monthStart
    })

    const weeklySpending = thisWeekTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const weeklyBudget = userProfile?.weekly_budget || 850
    const currentBalance = currentAccount?.balance || 0
    const coffeeTransactions = transactions.filter(tx => 
      tx.merchant.toLowerCase().includes('starbucks') || 
      tx.merchant.toLowerCase().includes('coffee') ||
      tx.description?.toLowerCase().includes('coffee')
    )
    const responsibleTransactions = transactions.filter(tx => tx.classification === 'responsible')

    // Define all possible badges
    const allBadges: Badge[] = [
      {
        id: 'first-transaction',
        title: 'Getting Started',
        description: 'Made your first transaction',
        emoji: '🎯',
        earned: transactions.length >= 1,
        category: 'milestone'
      },
      {
        id: 'smart-spender',
        title: 'Smart Spender',
        description: 'Stayed under budget for a week',
        emoji: '💰',
        earned: thisWeekTransactions.length > 0 && weeklySpending <= weeklyBudget,
        category: 'spending'
      },
      {
        id: 'coffee-lover',
        title: 'Coffee Lover',
        description: 'Made 5+ coffee purchases',
        emoji: '☕',
        earned: coffeeTransactions.length >= 5,
        category: 'spending'
      },
      {
        id: 'responsible-shopper',
        title: 'Responsible Shopper',
        description: 'Made 10+ responsible purchases',
        emoji: '🛡️',
        earned: responsibleTransactions.length >= 10,
        category: 'spending'
      },
      {
        id: 'account-builder',
        title: 'Account Builder',
        description: 'Built your account balance to $1000+',
        emoji: '🏦',
        earned: currentBalance >= 1000,
        category: 'saving'
      },
      {
        id: 'transaction-tracker',
        title: 'Transaction Tracker',
        description: 'Tracked 25+ transactions',
        emoji: '📊',
        earned: transactions.length >= 25,
        category: 'milestone'
      },
      {
        id: 'budget-master',
        title: 'Budget Master',
        description: 'Mastered your budget management',
        emoji: '👑',
        earned: transactions.length >= 20 && weeklySpending <= weeklyBudget,
        category: 'spending'
      },
      {
        id: 'goal-crusher',
        title: 'Goal Crusher',
        description: 'Making progress toward your goals',
        emoji: '🎯',
        earned: transactions.length >= 15,
        category: 'saving'
      }
    ]

    return allBadges
  }, [transactions, currentAccount, userProfile])

  // Load earned badges from localStorage on mount
  useEffect(() => {
    const savedEarnedBadges = localStorage.getItem('earnedBadges')
    if (savedEarnedBadges) {
      try {
        const parsed = JSON.parse(savedEarnedBadges)
        setEarnedBadges(new Set(parsed))
        console.log('📱 Loaded earned badges from storage:', parsed)
      } catch (error) {
        console.error('Failed to parse earned badges from localStorage:', error)
      }
    }
  }, [])

  // Check for new badges
  useEffect(() => {
    const newBadges = calculateBadges()
    console.log('🔍 Badge calculation result:', newBadges.map(b => ({ id: b.id, title: b.title, earned: b.earned })))
    console.log('🔍 Current earned badges:', [...earnedBadges])
    console.log('🔍 Is initialized:', isInitialized)
    
    setBadges(prevBadges => {
      // On first load, just set the badges without showing notifications
      if (!isInitialized) {
        console.log('🎯 Badge system initializing - no notifications')
        setIsInitialized(true)
        return newBadges
      }

      // Find newly earned badges by comparing with persistent earned badges
      const newlyEarned = newBadges.filter(newBadge => {
        // Badge is newly earned if it's earned now but wasn't in our earned badges set
        const isNewlyEarned = newBadge.earned && !earnedBadges.has(newBadge.id)
        if (isNewlyEarned) {
          console.log('🎉 Newly earned badge detected:', newBadge.id, newBadge.title)
          // Add to earned badges set
          setEarnedBadges(prev => {
            const newSet = new Set(prev)
            newSet.add(newBadge.id)
            // Save to localStorage
            localStorage.setItem('earnedBadges', JSON.stringify([...newSet]))
            return newSet
          })
        }
        return isNewlyEarned
      })

      console.log('🔍 Newly earned badges found:', newlyEarned.length)

      // Show notification for newly earned badges
      if (newlyEarned.length > 0) {
        console.log('🎊 Showing badge notification for:', newlyEarned[0].title)
        setNewBadge(newlyEarned[0]) // Show the first new badge
        setShowNotification(true)
      }

      return newBadges
    })
  }, [calculateBadges, isInitialized, earnedBadges])

  const dismissNotification = useCallback(() => {
    setShowNotification(false)
    setNewBadge(null)
  }, [])

  return {
    badges,
    newBadge,
    showNotification,
    dismissNotification
  }
}