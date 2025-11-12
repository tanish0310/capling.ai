'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  needsOnboarding: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  completeOnboarding: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    // Set loading to false immediately to prevent hanging
    setLoading(false)
    
    // Check if Supabase is available in the background
    const checkSupabaseConnection = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Supabase connection error:', error)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check if user needs onboarding
        if (session?.user) {
          checkOnboardingStatus(session.user.id)
        }
      } catch (error) {
        console.warn('Supabase not available:', error)
      }
    }

    checkSupabaseConnection()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Check onboarding status when user changes
      if (session?.user) {
        console.log('User authenticated, checking onboarding status')
        checkOnboardingStatus(session.user.id)
      } else {
        console.log('No user session')
        setNeedsOnboarding(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkOnboardingStatus = async (userId: string) => {
    try {
      console.log('Checking onboarding status for user:', userId)
      
      // First, verify the user actually exists in auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser.user || authUser.user.id !== userId) {
        console.log('User not properly authenticated, signing out')
        await supabase.auth.signOut()
        setNeedsOnboarding(false)
        return
      }
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('weekly_budget')
        .eq('id', userId)
        .maybeSingle()
      
      console.log('Profile check result:', { profile, error })
      
      if (error || !profile || !profile.weekly_budget) {
        console.log('User needs onboarding')
        setNeedsOnboarding(true)
      } else {
        console.log('User onboarding complete')
        setNeedsOnboarding(false)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setNeedsOnboarding(true)
    }
  }

  const completeOnboarding = () => {
    setNeedsOnboarding(false)
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      
      console.log('Signup result:', { data, error })
      
      // If signup is successful and user is created, set needsOnboarding to true
      if (!error && data.user) {
        console.log('User created successfully:', data.user.id)
        setNeedsOnboarding(true)
      } else if (error) {
        console.error('Signup error:', error)
      }
      
      return { error }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        error: { 
          message: 'Database connection failed. Please make sure Supabase is running.' 
        } 
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Signin error:', error)
      return { 
        error: { 
          message: 'Database connection failed. Please make sure Supabase is running.' 
        } 
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }


  const value = {
    user,
    session,
    loading,
    needsOnboarding,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}