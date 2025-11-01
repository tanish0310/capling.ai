'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { UserInfo } from '@/components/user-info'
import { useAuth } from '@/contexts/auth-context'
import { useSupabaseData } from '@/hooks/use-supabase-data'
import { ProtectedRoute } from '@/components/auth/protected-route'

function TestAPIContent() {
  const { user } = useAuth()
  const { currentAccount, loading: dataLoading } = useSupabaseData()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    merchant: '',
    amount: '',
    category: 'shopping',
    description: ''
  })
  const [depositForm, setDepositForm] = useState({
    amount: '',
    description: ''
  })

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">API Testing Dashboard</h1>
          <p className="text-muted-foreground">Please sign in to test the API</p>
        </div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">API Testing Dashboard</h1>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!currentAccount) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">API Testing Dashboard</h1>
          <p className="text-muted-foreground">No account found. Please complete onboarding first.</p>
          <div className="mt-4">
            <Button onClick={() => window.location.href = '/'}>
              Go to Main App
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const addResult = (test: string, success: boolean, data: any, error?: string) => {
    setResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleString()
    }])
  }

  const testFakeBank = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fake-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: 'Test Store',
          amount: 25.99,
          category: 'shopping',
          description: 'Test purchase',
          accountNumber: '1234',
          routingNumber: '123456789'
        })
      })

      const result = await response.json()
      addResult('Fake Bank API', response.ok, result, response.ok ? undefined : result.error)
    } catch (error) {
      addResult('Fake Bank API', false, null, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testLLM = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: 'Starbucks',
          amount: 5.50,
          description: 'Morning coffee'
        })
      })

      const result = await response.json()
      addResult('LLM Test (Mock)', response.ok, result, response.ok ? undefined : result.error)
    } catch (error) {
      addResult('LLM Test (Mock)', false, null, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomTransaction = () => {
    const transactions = [
      { merchant: 'Starbucks', amount: 5.50, category: 'dining', description: 'Morning coffee' },
      { merchant: 'McDonald\'s', amount: 8.75, category: 'dining', description: 'Lunch combo' },
      { merchant: 'Target', amount: 24.99, category: 'shopping', description: 'Household items' },
      { merchant: 'Shell Gas', amount: 45.20, category: 'transport', description: 'Gas fill-up' },
      { merchant: 'Netflix', amount: 15.99, category: 'entertainment', description: 'Monthly subscription' },
      { merchant: 'Amazon', amount: 67.50, category: 'shopping', description: 'Online purchase' },
      { merchant: 'Uber', amount: 12.30, category: 'transport', description: 'Ride to downtown' },
      { merchant: 'Whole Foods', amount: 89.45, category: 'food', description: 'Grocery shopping' },
      { merchant: 'Spotify', amount: 9.99, category: 'entertainment', description: 'Premium subscription' },
      { merchant: 'CVS Pharmacy', amount: 18.75, category: 'health', description: 'Prescription pickup' },
      { merchant: 'Chipotle', amount: 11.25, category: 'dining', description: 'Burrito bowl' },
      { merchant: 'Apple Store', amount: 29.00, category: 'shopping', description: 'iPhone case' },
      { merchant: 'Walmart', amount: 156.80, category: 'shopping', description: 'Weekly groceries' },
      { merchant: 'Lyft', amount: 8.45, category: 'transport', description: 'Short ride' },
      { merchant: 'Pizza Hut', amount: 22.50, category: 'dining', description: 'Pizza delivery' }
    ]
    
    return transactions[Math.floor(Math.random() * transactions.length)]
  }

  const simulateCustomTransaction = async () => {
    setLoading(true)
    try {
      // Validate form
      if (!transactionForm.merchant || !transactionForm.amount) {
        addResult('Custom Transaction', false, null, 'Please fill in merchant and amount')
        setLoading(false)
        return
      }

      const amount = parseFloat(transactionForm.amount)
      if (isNaN(amount) || amount <= 0) {
        addResult('Custom Transaction', false, null, 'Please enter a valid amount')
        setLoading(false)
        return
      }

      console.log('🔍 Simulating custom transaction:', transactionForm)

      // Use the same API that the "Add Transaction" button uses
      const response = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          merchant: transactionForm.merchant,
          amount: amount,
          category: transactionForm.category,
          description: transactionForm.description || transactionForm.merchant
        })
      })

      const result = await response.json()
      addResult(`Simulate ${transactionForm.merchant} Transaction`, response.ok, result, response.ok ? undefined : result.error)
      
      // Clear form on success
      if (response.ok) {
        setTransactionForm({
          merchant: '',
          amount: '',
          category: 'shopping',
          description: ''
        })
      }
    } catch (error) {
      addResult('Custom Transaction', false, null, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const makeDeposit = async () => {
    setLoading(true)
    try {
      // Validate form
      if (!depositForm.amount) {
        addResult('Deposit', false, null, 'Please enter deposit amount')
        return
      }

      const amount = parseFloat(depositForm.amount)
      if (isNaN(amount) || amount <= 0) {
        addResult('Deposit', false, null, 'Please enter a valid positive amount')
        return
      }

      console.log('Making deposit:', { amount, description: depositForm.description })

      const response = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          merchant: 'Deposit',
          amount: -amount, // Negative amount to make it a credit (deposit)
          category: 'income',
          description: depositForm.description || 'Test deposit'
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addResult('Deposit', true, result, `Successfully deposited $${amount}`)
        // Clear form
        setDepositForm({ amount: '', description: '' })
      } else {
        addResult('Deposit', false, result, result.error || 'Deposit failed')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      addResult('Deposit', false, null, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const simulateMultipleTransactions = async (count: number = 5) => {
    setLoading(true)
    try {
      const results = []
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < count; i++) {
        const randomTransaction = generateRandomTransaction()
        
        console.log(`🔍 Simulating transaction ${i + 1}/${count}:`, randomTransaction)

        try {
          const response = await fetch('/api/process-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              merchant: randomTransaction.merchant,
              amount: randomTransaction.amount,
              category: randomTransaction.category,
              description: randomTransaction.description
            })
          })

          const result = await response.json()
          
          if (response.ok) {
            successCount++
            results.push(`${randomTransaction.merchant} - $${randomTransaction.amount}`)
          } else {
            failCount++
            results.push(`❌ ${randomTransaction.merchant} - ${result.error}`)
          }
        } catch (error) {
          failCount++
          results.push(`❌ ${randomTransaction.merchant} - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Small delay between transactions to avoid overwhelming the API
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      addResult(
        `Generate ${count} Transactions`, 
        failCount === 0, 
        {
          summary: `Success: ${successCount}, Failed: ${failCount}`,
          transactions: results
        },
        failCount > 0 ? `${failCount} transactions failed` : undefined
      )
    } catch (error) {
      addResult('Generate Multiple Transactions', false, null, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Testing Dashboard</h1>
          <p className="text-muted-foreground">Test the Capling API system</p>
        </div>

        {/* User Info */}
        <UserInfo userId={user.id} userEmail={user.email} />

        {/* Transaction Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Custom Transaction</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Starbucks, Amazon, Shell Gas"
                  value={transactionForm.merchant}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, merchant: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 5.50, 25.99"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="dining">Dining</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Morning coffee, Gas fill-up"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <Button 
              onClick={simulateCustomTransaction} 
              disabled={loading || !transactionForm.merchant || !transactionForm.amount} 
              className="w-full bg-primary text-lg py-6"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Simulate Transaction
            </Button>
          </div>
        </Card>

        {/* Deposit Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Make Deposit</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount ($)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 100.00, 500.00"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-description">Description (Optional)</Label>
                <Input
                  id="deposit-description"
                  placeholder="e.g., Paycheck, Gift, Refund"
                  value={depositForm.description}
                  onChange={(e) => setDepositForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Current Balance: ${currentAccount?.balance?.toFixed(2) || '0.00'}</span>
              {currentAccount?.balance && currentAccount.balance < 0 && (
                <Badge variant="destructive">In Debt</Badge>
              )}
            </div>
            
            {/* Quick Deposit Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Deposits:</Label>
              <div className="flex flex-wrap gap-2">
                {[100, 250, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositForm(prev => ({ ...prev, amount: amount.toString() }))}
                    disabled={loading}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={makeDeposit} 
              disabled={loading || !depositForm.amount} 
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Make Deposit
            </Button>
          </div>
        </Card>

        {/* Other Tests */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Other Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={testLLM} disabled={loading} variant="outline" className="text-lg py-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Test LLM (Mock)
            </Button>
            <Button onClick={testFakeBank} disabled={loading} variant="outline" className="text-lg py-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Test Fake Bank API
            </Button>
            <Button onClick={() => simulateMultipleTransactions(5)} disabled={loading} variant="secondary" className="text-lg py-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              Generate 5 Random Transactions
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No tests run yet. Click a test button above to get started.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                  </div>
                  
                  {result.error && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="bg-muted p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* API Documentation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">POST /api/process-transaction</h3>
              <p className="text-sm text-muted-foreground">Process a single transaction with LLM analysis</p>
            </div>
            <div>
              <h3 className="font-medium">POST /api/fake-bank</h3>
              <p className="text-sm text-muted-foreground">Simulate bank transaction processing</p>
            </div>
            <div>
              <h3 className="font-medium">POST /api/simulate-transactions</h3>
              <p className="text-sm text-muted-foreground">Generate multiple realistic transactions</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function TestAPIPage() {
  return (
    <ProtectedRoute>
      <TestAPIContent />
    </ProtectedRoute>
  )
}