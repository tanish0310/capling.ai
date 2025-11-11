'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface Lesson {
  id: string
  user_id: string
  title: string
  content: string
  lesson_type: 'tip' | 'vocabulary' | 'concept'
  topic: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
}

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const { user } = useAuth()

  // Fetch lessons
  const fetchLessons = useCallback(async () => {
    if (!user) {
      setLessons([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/lessons?userId=${user.id}`)
      
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
      setLessons(data.lessons || [])
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate daily lesson
  const generateDailyLesson = useCallback(async (forceGenerate = false) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, forceGenerate })
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

      // Refresh lessons list
      await fetchLessons()
      
      return data.lesson
    } catch (err) {
      console.error('Error generating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate lesson')
      throw err
    } finally {
      setGenerating(false)
    }
  }, [user, fetchLessons])

  // Check if user has today's lesson
  const hasTodaysLesson = useCallback(() => {
    if (!lessons.length) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaysLesson = lessons.find(lesson => {
      const lessonDate = new Date(lesson.created_at)
      lessonDate.setHours(0, 0, 0, 0)
      return lessonDate.getTime() === today.getTime()
    })

    return !!todaysLesson
  }, [lessons])

  // Get today's lesson
  const getTodaysLesson = useCallback(() => {
    if (!lessons.length) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return lessons.find(lesson => {
      const lessonDate = new Date(lesson.created_at)
      lessonDate.setHours(0, 0, 0, 0)
      return lessonDate.getTime() === today.getTime()
    }) || null
  }, [lessons])

  // Auto-generate today's lesson if it doesn't exist
  const autoGenerateTodaysLesson = useCallback(async () => {
    if (!user || loading || generating) return

    try {
      // Check if we already have today's lesson
      const hasToday = hasTodaysLesson()
      if (hasToday) return

      // Auto-generate today's lesson
      await generateDailyLesson()
    } catch (err) {
      console.error('Error auto-generating lesson:', err)
      // Don't set error state for auto-generation failures
    }
  }, [user, loading, generating, hasTodaysLesson, generateDailyLesson])

  // Load lessons when user changes
  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // Auto-generate today's lesson after lessons are loaded
  useEffect(() => {
    if (!loading && lessons.length >= 0) {
      autoGenerateTodaysLesson()
    }
  }, [loading, lessons.length, autoGenerateTodaysLesson])

  return {
    lessons,
    loading,
    error,
    generating,
    fetchLessons,
    generateDailyLesson,
    hasTodaysLesson,
    getTodaysLesson,
    autoGenerateTodaysLesson
  }
}