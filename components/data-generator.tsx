'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, DollarSign, TrendingUp, Users } from 'lucide-react'

interface DataGeneratorProps {
  onDataGenerated?: (data: any) => void
}

export function DataGenerator({ onDataGenerated }: DataGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState<any>(null)

  const generateSampleData = async (incomeLevel: 'low' | 'medium' | 'high') => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          fullName: 'Demo User',
          incomeLevel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate data')
      }

      const result = await response.json()
      setGeneratedData(result.data)
      onDataGenerated?.(result.data)
    } catch (error) {
      console.error('Error generating data:', error)
    } finally {
      setLoading(false)
    }
  }

  const incomeLevels = [
    {
      level: 'low' as const,
      label: 'Low Income',
      description: '$30k-50k annually',
      budget: '~$400/week',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      level: 'medium' as const,
      label: 'Medium Income', 
      description: '$50k-80k annually',
      budget: '~$650/week',
      color: 'bg-green-100 text-green-800'
    },
    {
      level: 'high' as const,
      label: 'High Income',
      description: '$80k+ annually', 
      budget: '~$1000/week',
      color: 'bg-purple-100 text-purple-800'
    }
  ]

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Generate Realistic Financial Data</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Generate realistic bank accounts, transactions, and spending patterns based on different income levels.
      </p>

      <div className="grid gap-3">
        {incomeLevels.map(({ level, label, description, budget, color }) => (
          <div key={level} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{label}</span>
                <Badge className={color}>{budget}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateSampleData(level)}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        ))}
      </div>

      {generatedData && (
        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Generated Data Preview</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account:</span>
              <p className="font-medium">{generatedData.account.account_name}</p>
              <p className="text-muted-foreground">{generatedData.account.bank_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Balance:</span>
              <p className="font-medium">${generatedData.account.balance.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Weekly Budget:</span>
              <p className="font-medium">${generatedData.profile.weekly_budget.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Transactions:</span>
              <p className="font-medium">{generatedData.transactions.length} sample transactions</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}