import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// For client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side usage with SSR
export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// For server-side API routes (bypasses RLS)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  return createClient(supabaseUrl, serviceRoleKey)
}

// Database types
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
          category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income'
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
          category: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income'
          classification: 'responsible' | 'irresponsible' | 'neutral'
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
          category?: 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income'
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
