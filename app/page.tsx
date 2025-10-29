"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CaplingCharacter } from "@/components/capling-character"
import { BudgetProgress } from "@/components/budget-progress"
import { SummaryCard } from "@/components/summary-card"
import { TransactionItem, type Transaction } from "@/components/transaction-item"
import { JustificationModal } from "@/components/justification-modal"
import { GoalCard } from "@/components/goal-card"
import { BadgeCard } from "@/components/badge-card"
import { Wallet, Target, TrendingUp, Plus, Home, Receipt, Trophy, Menu, AlertCircle, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { DemoNotice } from "@/components/demo-notice"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UserMenu } from "@/components/auth/user-menu"
import { AuthForm } from "@/components/auth/auth-form"
import { SimpleDemo } from "@/components/simple-demo"
import { useAuth } from "@/contexts/auth-context"

export default function CaplingApp() {
  return (
    <ProtectedRoute>
      <AppRouter />
    </ProtectedRoute>
  )
}

function AppRouter() {
  const { user } = useAuth()
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)

  // Check if Supabase is available
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const response = await fetch('http://127.0.0.1:54321/rest/v1/', {
          method: 'HEAD',
        })
        setSupabaseAvailable(response.ok)
      } catch (error) {
        setSupabaseAvailable(false)
      }
    }
    checkSupabase()
  }, [])

  // If Supabase is not available, show demo mode
  if (!supabaseAvailable) {
    return <SimpleDemo />
  }

  // If Supabase is available but user is not logged in, show auth form
  if (!user) {
    return <AuthForm />
  }

  // Otherwise show the regular app
  return <CaplingAppContent />
}

function CaplingAppContent() {
  const { user } = useAuth()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)

  // Use Supabase data system
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
  } = useSupabaseData()

  const weeklySpending = spendingInsights.totalSpent
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
      await createTransaction(transactionData)
      // The hook will automatically update the data
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  // Convert Supabase transaction to Transaction for compatibility
  const convertToTransaction = (supabaseTx: any): Transaction => ({
    id: supabaseTx.id,
    merchant: supabaseTx.merchant,
    amount: supabaseTx.amount,
    category: supabaseTx.category,
    classification: supabaseTx.classification,
    reflection: supabaseTx.reflection,
    date: supabaseTx.date,
  })

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Unable to Load Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              There was an issue loading your data. This might be due to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Database connection issues</li>
              <li>• Authentication problems</li>
              <li>• Network connectivity problems</li>
            </ul>
          </div>
          <Button onClick={refreshData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
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
                {user && (
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user.user_metadata?.full_name || user.email}!
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentAccount && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{currentAccount.account_name}</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${currentBalance.toFixed(2)}
                  </p>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={refreshData}>
                <RefreshCw className="h-5 w-5" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <DemoNotice />
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
                trend={`${spendingInsights.topCategory} is your top category`}
              />
              <SummaryCard 
                title="Account Balance" 
                value={`$${currentBalance.toFixed(2)}`} 
                icon={Target} 
                trend={`${spendingInsights.transactionCount} transactions this month`} 
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
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent transactions found</p>
                    <p className="text-sm">Your transactions will appear here</p>
                  </div>
                )}
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
              {transactions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                  <p>Your transaction history will appear here once you start using your account.</p>
                </div>
              )}
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
                <GoalCard title="Save for Trip" target={1000} current={450} emoji="✈️" />
                <GoalCard title="Emergency Fund" target={5000} current={2300} emoji="🏦" />
                <GoalCard title="New Laptop" target={1500} current={680} emoji="💻" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Badges & Achievements</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <BadgeCard title="Smart Saver" description="Stayed under budget for 4 weeks" emoji="💰" earned={true} />
                <BadgeCard
                  title="Impulse Slayer"
                  description="Avoided 10 impulsive purchases"
                  emoji="🛡️"
                  earned={true}
                />
                <BadgeCard
                  title="Budget Master"
                  description="Complete 12 weeks under budget"
                  emoji="👑"
                  earned={false}
                />
                <BadgeCard title="Goal Crusher" description="Achieve 5 savings goals" emoji="🎯" earned={false} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Weekly Streak</h3>
              <div className="flex items-center gap-2 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-foreground">7 Days</p>
                  <p className="text-sm text-muted-foreground">Keep it up! Capling is proud of you 🌟</p>
                </div>
                <div className="text-5xl animate-bounce-subtle">🔥</div>
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
        accountId={currentAccount?.id || ''}
      />
    </div>
  )
}