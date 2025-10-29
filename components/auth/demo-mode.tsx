'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, Database, Sparkles } from 'lucide-react'

interface DemoModeProps {
  onEnterDemo: () => void
}

export function DemoMode({ onEnterDemo }: DemoModeProps) {
  const [entering, setEntering] = useState(false)

  const handleEnterDemo = async () => {
    setEntering(true)
    // Simulate loading
    setTimeout(() => {
      onEnterDemo()
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-3xl">🌱</div>
            <CardTitle className="text-2xl">Capling</CardTitle>
          </div>
          <CardDescription>
            Your personal finance companion with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Supabase Not Running</p>
                <p className="text-sm">
                  The database isn't available, but you can still explore Capling in demo mode!
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">Demo Mode Features:</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                GPT-powered transaction analysis
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Interactive spending insights
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Capling's mood reactions
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Goal tracking simulation
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleEnterDemo} 
              className="w-full gap-2" 
              disabled={entering}
            >
              <Play className="h-4 w-4" />
              {entering ? 'Starting Demo...' : 'Enter Demo Mode'}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                To enable full features with data persistence:
              </p>
              <div className="text-xs space-y-1 mt-2">
                <p><code className="bg-muted px-1 rounded">brew install supabase/tap/supabase</code></p>
                <p><code className="bg-muted px-1 rounded">supabase start</code></p>
                <p><code className="bg-muted px-1 rounded">supabase db reset</code></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
