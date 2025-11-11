'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

interface TransactionSimulatorProps {
  userId: string
  accountId?: string // Now optional - API will find default account
  onTransactionsAdded?: () => void
}

export function TransactionSimulator({ userId, accountId, onTransactionsAdded }: TransactionSimulatorProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [count, setCount] = useState(5)
  const [incomeLevel, setIncomeLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  const simulateTransactions = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/simulate-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...(accountId && { accountId }), // Only include accountId if provided
          count,
          incomeLevel,
          timeRange
        })
      })

      if (!response.ok) {
        throw new Error('Failed to simulate transactions')
      }

      const data = await response.json()
      setResult(data)
      onTransactionsAdded?.()
    } catch (error) {
      console.error('Error simulating transactions:', error)
      setResult({
        success: false,
        error: 'Failed to simulate transactions'
      })
    } finally {
      setLoading(false)
    }
  }

  const quickSimulate = async (preset: 'day' | 'week' | 'month') => {
    setTimeRange(preset)
    setCount(preset === 'day' ? 3 : preset === 'week' ? 8 : 15)
    await simulateTransactions()
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Transaction Simulator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Automatically generate realistic transactions to populate your account with sample data.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => quickSimulate('day')}
          disabled={loading}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Today (3)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => quickSimulate('week')}
          disabled={loading}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          This Week (8)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => quickSimulate('month')}
          disabled={loading}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          This Month (15)
        </Button>
      </div>

      {/* Custom Simulation */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="count">Number of Transactions</Label>
          <Input
            id="count"
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="income">Income Level</Label>
          <Select value={incomeLevel} onValueChange={(value: any) => setIncomeLevel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Income</SelectItem>
              <SelectItem value="medium">Medium Income</SelectItem>
              <SelectItem value="high">High Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeRange">Time Range</Label>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last Day</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={simulateTransactions}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Simulating Transactions...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Generate {count} Transactions
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
          {result.success ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Simulation Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Requested:</span>
                  <p className="font-medium">{result.summary.requested}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Processed:</span>
                  <p className="font-medium text-primary">{result.summary.processed}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span>
                  <p className="font-medium text-red-600">{result.summary.failed}</p>
                </div>
              </div>
              {result.transactions && result.transactions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Transactions:</p>
                  <div className="space-y-1">
                    {result.transactions.slice(0, 3).map((tx: any) => (
                      <div key={tx.id} className="flex justify-between text-sm">
                        <span>{tx.merchant}</span>
                        <span className="font-medium">${tx.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{result.error}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}