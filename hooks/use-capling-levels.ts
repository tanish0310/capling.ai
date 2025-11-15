'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface CaplingLevelData {
  id: string
  user_id: string
  current_level: number
  current_xp: number
  total_xp: number
  consecutive_happy_days: number
  lessons_read: number
  last_happiness_check: string
  created_at: string
  updated_at: string
}

export interface XPEvent {
  id: string
  user_id: string
  event_type: 'happiness_streak' | 'lesson_read' | 'responsible_purchase' | 'goal_achieved' | 'daily_bonus'
  xp_amount: number
  description: string
  metadata: any
  created_at: string
}

export interface LevelInfo {
  level: number
  xp: number
  totalXp: number
  consecutiveHappyDays: number
  lessonsRead: number
  xpForNextLevel: number
  progressPercentage: number
}

export function useCaplingLevels() {
  const [levelData, setLevelData] = useState<CaplingLevelData | null>(null)
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingXP, setAddingXP] = useState(false)
  const { user } = useAuth()

  // Fetch level data
  const fetchLevelData = useCallback(async () => {
    if (!user) {
      setLevelData(null)
      setLevelInfo(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/capling-levels?userId=${user.id}`)
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use the status text
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      setLevelData(data.levelData)
      setLevelInfo({
        level: data.level,
        xp: data.xp,
        totalXp: data.totalXp,
        consecutiveHappyDays: data.consecutiveHappyDays,
        lessonsRead: data.lessonsRead,
        xpForNextLevel: data.xpForNextLevel,
        progressPercentage: data.progressPercentage
      })
    } catch (err) {
      console.error('Error fetching capling level:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch capling level')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Add XP for an event
  const addXP = useCallback(async (
    eventType: 'happiness_streak' | 'lesson_read' | 'responsible_purchase' | 'goal_achieved' | 'daily_bonus',
    xpAmount: number,
    description: string,
    metadata?: any
  ) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setAddingXP(true)
      setError(null)

      const response = await fetch('/api/capling-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          eventType,
          xpAmount,
          description,
          metadata
        })
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use the status text
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Update local state
      setLevelData(data.levelData)
      setLevelInfo({
        level: data.level,
        xp: data.xp,
        totalXp: data.totalXp,
        consecutiveHappyDays: data.levelData.consecutive_happy_days,
        lessonsRead: data.levelData.lessons_read,
        xpForNextLevel: data.xpForNextLevel,
        progressPercentage: data.progressPercentage
      })

      return {
        leveledUp: data.leveledUp,
        previousLevel: data.previousLevel,
        newLevel: data.level,
        xpGained: xpAmount
      }
    } catch (err) {
      console.error('Error adding XP:', err)
      setError(err instanceof Error ? err.message : 'Failed to add XP')
      throw err
    } finally {
      setAddingXP(false)
    }
  }, [user])

  // Add XP for reading a lesson
  const addLessonXP = useCallback(async (lessonTitle: string) => {
    return addXP('lesson_read', 25, `Read lesson: "${lessonTitle}"`, { lessonTitle })
  }, [addXP])

  // Add XP for happiness streak
  const addHappinessXP = useCallback(async (days: number, mood: string) => {
    const xpAmount = Math.min(days * 10, 100) // Max 100 XP per streak
    return addXP('happiness_streak', xpAmount, `Kept Capling ${mood} for ${days} days`, { days, mood })
  }, [addXP])

  // Add XP for responsible purchase
  const addResponsiblePurchaseXP = useCallback(async (merchant: string, amount: number) => {
    return addXP('responsible_purchase', 15, `Made responsible purchase at ${merchant}`, { merchant, amount })
  }, [addXP])

  // Add XP for goal achievement
  const addGoalXP = useCallback(async (goalTitle: string) => {
    return addXP('goal_achieved', 50, `Achieved goal: "${goalTitle}"`, { goalTitle })
  }, [addXP])

  // Add daily bonus XP
  const addDailyBonusXP = useCallback(async () => {
    return addXP('daily_bonus', 5, 'Daily login bonus', {})
  }, [addXP])

  // Get level title based on level
  const getLevelTitle = useCallback((level: number) => {
    if (level >= 50) return 'Financial Master'
    if (level >= 40) return 'Investment Guru'
    if (level >= 30) return 'Budget Expert'
    if (level >= 20) return 'Smart Saver'
    if (level >= 15) return 'Money Manager'
    if (level >= 10) return 'Budget Builder'
    if (level >= 5) return 'Financial Learner'
    return 'Capling Beginner'
  }, [])

  // Get level color based on level
  const getLevelColor = useCallback((level: number) => {
    if (level >= 50) return 'from-purple-600 to-pink-600'
    if (level >= 40) return 'from-blue-600 to-purple-600'
    if (level >= 30) return 'from-green-600 to-blue-600'
    if (level >= 20) return 'from-yellow-500 to-green-600'
    if (level >= 15) return 'from-orange-500 to-yellow-500'
    if (level >= 10) return 'from-red-500 to-orange-500'
    if (level >= 5) return 'from-pink-500 to-red-500'
    return 'from-gray-500 to-gray-600'
  }, [])

  // Load level data when user changes
  useEffect(() => {
    fetchLevelData()
  }, [fetchLevelData])

  return {
    levelData,
    levelInfo,
    loading,
    error,
    addingXP,
    fetchLevelData,
    addXP,
    addLessonXP,
    addHappinessXP,
    addResponsiblePurchaseXP,
    addGoalXP,
    addDailyBonusXP,
    getLevelTitle,
    getLevelColor
  }
}
