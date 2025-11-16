import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Determine which Supabase URL and anon key to use:
 * - Local dev (CLI): .env.local or defaults to 127.0.0.1
 * - Production: picks up Vercel environment variables
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbXVjYnZmY3NsamFxYXVia2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTMyMDQsImV4cCI6MjA3ODg2OTIwNH0.QnC24ln9fO9HJo-ZY1rrwbovA3j2wMe4kzjdHOWDhS4'

// Client-side Supabase (for React/SSR)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase API (service role, bypasses RLS)
export function createServerClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbXVjYnZmY3NsamFxYXVia2pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI5MzIwNCwiZXhwIjoyMDc4ODY5MjA0fQ.SKAwOy0Zu7qCLypt9YoJgQ6NhSmgPtUiy-hkAcEIj_4'
  return createClient(supabaseUrl, serviceRoleKey)
}

// Database types (keep as-is)
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          account_name: string
          account_type: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_name?: string
          account_type?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_name?: string
          account_type?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          merchant: string
          amount: number
          category:
            | 'shopping'
            | 'food'
            | 'transport'
            | 'bills'
            | 'dining'
            | 'entertainment'
            | 'health'
            | 'income'
          classification: 'responsible' | 'irresponsible' | 'neutral'
          reflection: string | null
          description: string | null
          date: string
          timestamp: number
          type: 'debit' | 'credit'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          merchant: string
          amount: number
          category:
            | 'shopping'
            | 'food'
            | 'transport'
            | 'bills'
            | 'dining'
            | 'entertainment'
            | 'health'
            | 'income'
          classification?: 'responsible' | 'irresponsible' | 'neutral'
          reflection?: string | null
          description?: string | null
          date: string
          timestamp: number
          type?: 'debit' | 'credit'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          merchant?: string
          amount?: number
          category?:
            | 'shopping'
            | 'food'
            | 'transport'
            | 'bills'
            | 'dining'
            | 'entertainment'
            | 'health'
            | 'income'
          classification?: 'responsible' | 'borderline' | 'impulsive'
          reflection?: string | null
          description?: string | null
          date?: string
          timestamp?: number
          type?: 'debit' | 'credit'
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_amount: number
          current_amount: number
          emoji: string
          category: string
          target_date: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_amount: number
          current_amount?: number
          emoji?: string
          category?: string
          target_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          emoji?: string
          category?: string
          target_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          weekly_budget: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          weekly_budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          weekly_budget?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
