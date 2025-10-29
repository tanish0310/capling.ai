'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CaplingCharacter } from "@/components/capling-character"
import { BudgetProgress } from "@/components/budget-progress"
import { SummaryCard } from "@/components/summary-card"
import { TransactionItem, type Transaction } from "@/components/transaction-item"
import { JustificationModal } from "@/components/justification-modal"
import { Wallet, Target, TrendingUp, Plus, Home, Receipt, Trophy, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMockData } from "@/hooks/use-mock-data"
import { AddTransactionModal } from "@/components/add-transaction-modal"

export default function DemoPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  // Use mock data for demo
  const {
    loading,
    error,
    transactions,
    currentAccount,
    currentBalance,
    weeklyBudget,
    spendingInsights,
    createTransaction,
    refreshData,
  } = useMockData()

  const weeklySpending = spendingInsights.weeklySpending || 0
  const reflectionScore = Math.round(spendingInsights.responsiblePercentage) || 75

  const getMood = () => {
    const percentage = (weeklySpending / weeklyBudget) * 100
    if (percentage < 50) return "happy"
    if (percentage < 80) return "neutral"
    if (percentage < 100) return "worried"
    return "sad"
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setModalOpen(true)
  }

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await createTransaction('demo-account', transactionData)
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw error
    }
  }

  // Convert mock transaction to Transaction for compatibility
  const convertToTransaction = (mockTx: any): Transaction => ({
    id: mockTx.id,
    merchant: mockTx.merchant,
    amount: mockTx.amount,
    category: mockTx.category,
    classification: mockTx.classification,
    reflection: mockTx.reflection,
    date: mockTx.date,
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading demo data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🌱</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Capling</h1>
                <p className="text-sm text-muted-foreground">
                  Demo Mode - Welcome!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentAccount && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{currentAccount.nickname}</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${currentBalance.toFixed(2)}
                  </p>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={refreshData}>
                <RefreshCw className="h-5 w-5" />
              </Button>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                DEMO
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎮</div>
            <div>
              <h3 className="font-semibold">Demo Mode Active</h3>
              <p className="text-sm text-muted-foreground">
                You're exploring Capling with sample data. Add transactions to see GPT analysis!
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="home" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Dashboard */}
          <TabsContent value="home" className="space-y-6">
            <div className="flex flex-col items-center gap-6 py-6">
              <CaplingCharacter mood={getMood()} />
            </div>

            <BudgetProgress spent={weeklySpending} budget={weeklyBudget} />

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                title="This Week's Spending"
                value={`$${weeklySpending.toFixed(2)}`}
                icon={Wallet}
                trend={`${spendingInsights.mostSpentCategory} is your top category`}
              />
              <SummaryCard 
                title="Account Balance" 
                value={`$${currentBalance.toFixed(2)}`} 
                icon={Target} 
                trend={`${transactions.length} transactions this month`} 
              />
              <SummaryCard
                title="Reflection Score"
                value={`${reflectionScore}%`}
                icon={TrendingUp}
                trend={`${Math.round(spendingInsights.responsiblePercentage)}% responsible spending`}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tabs = document.querySelector('[value="transactions"]') as HTMLElement
                    tabs?.click()
                  }}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={convertToTransaction(transaction)}
                    onClick={() => handleTransactionClick(convertToTransaction(transaction))}
                  />
                ))}
              </div>
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => setAddTransactionOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Add Transaction
            </Button>
          </TabsContent>

          {/* Transactions Feed */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">All Transactions</h2>
              <Button 
                className="gap-2"
                onClick={() => setAddTransactionOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={convertToTransaction(transaction)}
                  onClick={() => handleTransactionClick(convertToTransaction(transaction))}
                />
              ))}
            </div>
          </TabsContent>

          {/* Goals & Rewards */}
          <TabsContent value="goals" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your Goals</h2>
              <p className="text-muted-foreground">Track your progress and earn rewards</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Active Goals</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">✈️</div>
                    <div>
                      <h4 className="font-semibold">Save for Trip</h4>
                      <p className="text-sm text-muted-foreground">$450 / $1,000</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🏦</div>
                    <div>
                      <h4 className="font-semibold">Emergency Fund</h4>
                      <p className="text-sm text-muted-foreground">$2,300 / $5,000</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '46%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <JustificationModal open={modalOpen} onOpenChange={setModalOpen} transaction={selectedTransaction} />
      <AddTransactionModal 
        open={addTransactionOpen} 
        onOpenChange={setAddTransactionOpen} 
        onTransactionAdded={handleAddTransaction}
        accountId="demo-account"
      />
    </div>
  )
}
