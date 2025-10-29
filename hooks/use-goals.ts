'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  target_amount: number
  current_amount: number
  emoji: string
  category: string
  target_date?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateGoalData {
  title: string
  description?: string
  target_amount: number
  emoji?: string
  category?: string
  target_date?: string
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  // supabase client is imported directly

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setGoals(data || [])
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create a new goal
  const createGoal = useCallback(async (goalData: CreateGoalData) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.target_amount,
          emoji: goalData.emoji || '🎯',
          category: goalData.category || 'savings',
          target_date: goalData.target_date,
          current_amount: 0,
          is_completed: false
        }])
        .select()
        .single()

      if (error) throw error

      setGoals(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error creating goal:', err)
      throw new Error(`Failed to create goal: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user])

  // Update a goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<CreateGoalData>) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? data : goal
      ))
      return data
    } catch (err) {
      console.error('Error updating goal:', err)
      throw new Error(`Failed to update goal: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user])

  // Delete a goal
  const deleteGoal = useCallback(async (goalId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (error) throw error

      setGoals(prev => prev.filter(goal => goal.id !== goalId))
    } catch (err) {
      console.error('Error deleting goal:', err)
      throw new Error(`Failed to delete goal: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user])

  // Add progress to a goal
  const addProgress = useCallback(async (goalId: string, amount: number) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) {
        throw new Error('Goal not found')
      }

      const newAmount = Math.min(goal.current_amount + amount, goal.target_amount)
      const isCompleted = newAmount >= goal.target_amount

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted
        })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setGoals(prev => prev.map(g => 
        g.id === goalId ? data : g
      ))
      return data
    } catch (err) {
      console.error('Error adding progress:', err)
      throw new Error(`Failed to add progress: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [user, goals])

  // Load goals when user changes
  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    addProgress,
    refreshGoals: fetchGoals
  }
}