'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AuthForm } from './auth-form'
import { DemoMode } from './demo-mode'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

  // Show fallback after 3 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowFallback(true)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowFallback(false)
    }
  }, [loading])

  if (loading && !showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading && showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-6 text-center space-y-4">
          <div className="text-6xl">🌱</div>
          <h1 className="text-2xl font-bold">Capling</h1>
          <p className="text-muted-foreground">
            Setting up your secure connection...
          </p>
          <div className="bg-muted p-4 rounded-lg text-left space-y-2">
            <p className="text-sm font-semibold">If this takes too long:</p>
            <ol className="text-xs space-y-1 list-decimal list-inside">
              <li>Install Supabase CLI: <code className="bg-background px-1 rounded">brew install supabase/tap/supabase</code></li>
              <li>Start Supabase: <code className="bg-background px-1 rounded">supabase start</code></li>
              <li>Apply migrations: <code className="bg-background px-1 rounded">supabase db reset</code></li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-primary hover:underline text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Always show children - the main app will handle demo mode vs auth
  return <>{children}</>
}
