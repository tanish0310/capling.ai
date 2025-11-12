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
import { Wallet, Target, TrendingUp, Plus, Home, Receipt, Trophy, Menu, AlertCircle, RefreshCw, BookOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { useGoals, type Goal } from "@/hooks/use-goals"
import { useBadges } from "@/hooks/use-badges"
import { BadgeNotification } from "@/components/badge-notification"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { GoalModal } from "@/components/goal-modal"
import { GoalAllocationModal } from "@/components/goal-allocation-modal"
import { DinosaurIcon } from "@/components/dinosaur-icon"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UserMenu } from "@/components/auth/user-menu"
import { AuthForm } from "@/components/auth/auth-form"
import { SimpleDemo } from "@/components/simple-demo"
import { useAuth } from "@/contexts/auth-context"
import { useGoalAllocation } from "@/contexts/goal-allocation-context"
import { OnboardingForm } from "@/components/onboarding-form"
import { LearnTab } from "@/components/learn-tab"
import { useCaplingLevels } from "@/hooks/use-capling-levels"

export default function CaplingApp() {
  return (
    <ProtectedRoute>
      <AppRouter />
    </ProtectedRoute>
  )
}

function AppRouter() {
  const { user, needsOnboarding, completeOnboarding } = useAuth()


  // If Supabase is available but user is not logged in, show auth form
  if (!user) {
    return <AuthForm />
  }

  // If user needs onboarding, show onboarding form
  if (needsOnboarding) {
    return (
      <OnboardingForm 
        userId={user?.id || ''}
        userEmail={user?.email || ''}
        onComplete={async () => {
          completeOnboarding()
          // Small delay to ensure database changes are committed
          await new Promise(resolve => setTimeout(resolve, 1000))
          // Refresh the page to reload all data
          window.location.reload()
        }}
      />
    )
  }

  // Otherwise show the regular app
  return <CaplingAppContent />
}

function CaplingAppContent() {
  const { user, needsOnboarding } = useAuth()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { pendingTransaction, showGoalAllocation, triggerGoalAllocation, completeGoalAllocation } = useGoalAllocation()
  // Use Supabase data system
  const {
    loading,
    error,
    transactions,
    currentAccount,
    currentBalance,
    weeklyBudget,
    spendingInsights,
    userProfile,
    createTransaction,
    refreshData,
  } = useSupabaseData()

  const [caplingName, setCaplingName] = useState<string>("Capling")

  // Update Capling name when user profile loads
  useEffect(() => {
    if (userProfile && 'capling_name' in userProfile && userProfile.capling_name) {
      setCaplingName(userProfile.capling_name as string)
    }
  }, [userProfile])

  // Check for pending goal allocation from test API
  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingGoalAllocation')
    if (pendingData) {
      try {
        const transactionData = JSON.parse(pendingData)
        triggerGoalAllocation(transactionData)
        sessionStorage.removeItem('pendingGoalAllocation')
      } catch (error) {
        console.error('Error parsing pending goal allocation data:', error)
        sessionStorage.removeItem('pendingGoalAllocation')
      }
    }
  }, [triggerGoalAllocation])

  // Set page title
  useEffect(() => {
    document.title = 'Capling - Your Financial Companion'
  }, [])

  // Use goals system
  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoals()

  // Use badge system
  const {
    badges,
    newBadge,
    showNotification,
    dismissNotification
  } = useBadges()

  const weeklySpending = spendingInsights.totalSpent
  const reflectionScore = Math.round(spendingInsights.responsiblePercentage) || 75

  // Get happiness streak from capling levels
  const { levelInfo, fetchLevelData } = useCaplingLevels()
  const happinessStreak = levelInfo?.consecutiveHappyDays || 0

  // Note: Happiness streak will be updated through other means (e.g., daily checks, manual updates)
  // For now, we'll just display the current streak from the database

  const getMood = () => {
    if (!transactions || transactions.length === 0) return "neutral"
    
    // Check if user is in debt (negative account balance) - this overrides everything else
    if (currentAccount && currentAccount.balance < 0) {
      return "depressed"
    }
    
    // Get recent transactions (last 7 days)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate >= weekAgo
    })
    
    // Calculate budget percentage
    const budgetPercentage = (weeklySpending / weeklyBudget) * 100
    
    // Analyze transaction classifications
    const responsibleCount = recentTransactions.filter(tx => tx.classification === 'responsible').length
    const irresponsibleCount = recentTransactions.filter(tx => tx.classification === 'irresponsible').length
    const neutralCount = recentTransactions.filter(tx => tx.classification === 'neutral').length
    const totalRecent = recentTransactions.length
    
    // Calculate responsible spending ratio
    const responsibleRatio = totalRecent > 0 ? responsibleCount / totalRecent : 0.5
    
    // Check for concerning patterns
    const largeTransactions = recentTransactions.filter(tx => tx.amount > 100).length
    const frequentIrresponsible = irresponsibleCount >= 3
    const overBudget = budgetPercentage > 100
    const highIrresponsibleRatio = totalRecent > 0 && (irresponsibleCount / totalRecent) > 0.6
    
    // Calculate mood score (0-100, higher = happier)
    let moodScore = 50 // Start neutral
    
    // Budget factor (40% weight)
    if (budgetPercentage < 50) moodScore += 20
    else if (budgetPercentage < 80) moodScore += 10
    else if (budgetPercentage < 100) moodScore -= 10
    else moodScore -= 30
    
    // Responsible spending factor (35% weight)
    if (responsibleRatio > 0.7) moodScore += 15
    else if (responsibleRatio > 0.5) moodScore += 5
    else if (responsibleRatio > 0.3) moodScore -= 10
    else moodScore -= 20
    
    // Pattern analysis (25% weight)
    if (frequentIrresponsible) moodScore -= 15
    if (highIrresponsibleRatio) moodScore -= 10
    if (largeTransactions > 2) moodScore -= 10
    if (overBudget) moodScore -= 15
    
    // Determine mood based on score
    if (moodScore >= 70) return "happy"
    if (moodScore >= 45) return "neutral"
    if (moodScore >= 25) return "worried"
    return "sad"
  }

  const getMoodMessage = () => {
    if (!transactions || transactions.length === 0) {
      return "Capling is excited to help you track your spending! Start by adding your first transaction."
    }
    
    const mood = getMood()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate >= weekAgo
    })
    
    const budgetPercentage = (weeklySpending / weeklyBudget) * 100
    const responsibleCount = recentTransactions.filter(tx => tx.classification === 'responsible').length
    const irresponsibleCount = recentTransactions.filter(tx => tx.classification === 'irresponsible').length
    const totalRecent = recentTransactions.length
    const responsibleRatio = totalRecent > 0 ? responsibleCount / totalRecent : 0.5
    
    switch (mood) {
      case "happy":
        if (responsibleRatio > 0.7 && budgetPercentage < 60) {
          return "Capling is absolutely thrilled! You're making excellent financial decisions and staying well within budget. You're a spending superstar! 🌟"
        } else if (responsibleRatio > 0.6) {
          return "Capling is proud of your responsible spending choices! You're making smart decisions that will pay off in the long run. Keep it up! 💪"
        } else {
          return "Capling is happy with your progress! You're managing your budget well and making mostly good choices. Great job! 😊"
        }
        
      case "neutral":
        if (budgetPercentage > 80 && responsibleRatio < 0.5) {
          return "Capling notices you're getting close to your budget limit and making some questionable purchases. Let's focus on more responsible choices! 🤔"
        } else if (budgetPercentage > 80) {
          return "Capling is keeping an eye on your spending. You're approaching your budget limit, but your choices are mostly responsible. Stay mindful! 👀"
        } else if (responsibleRatio < 0.4) {
          return "Capling sees you're staying within budget, but some of your recent purchases could be more thoughtful. Let's work on better decision-making! 💭"
        } else {
          return "Capling thinks you're doing okay overall, but there's definitely room for improvement in your spending habits. Small changes can make a big difference! 📈"
        }
        
      case "worried":
        if (budgetPercentage > 100) {
          return "Capling is concerned! You've exceeded your budget and made several questionable purchases. Let's create a plan to get back on track! 🚨"
        } else if (irresponsibleCount >= 3) {
          return "Capling is worried about your recent spending patterns. You've made multiple irresponsible purchases lately. Let's break this cycle! ⚠️"
        } else if (responsibleRatio < 0.3) {
          return "Capling is concerned about your spending choices. Most of your recent purchases have been classified as irresponsible. Time for a spending reset! 🔄"
        } else {
          return "Capling is getting worried about your spending habits. You're making some concerning choices that could impact your financial health. Let's talk! 💬"
        }
        
      case "sad":
        if (budgetPercentage > 120) {
          return "Capling is really sad about your spending situation. You're way over budget and making many poor financial decisions. We need to take action now! 😢"
        } else if (irresponsibleCount >= 5) {
          return "Capling is heartbroken by your recent spending choices. You've made too many irresponsible purchases in a short time. Let's turn this around together! 💔"
        } else {
          return "Capling is saddened by your current spending patterns. Your financial choices are concerning and need immediate attention. Don't worry, we'll fix this! 🤗"
        }
        
      case "depressed":
        return "Capling is deeply concerned and depressed about your financial situation. Your account is in the negative, which is a serious problem that needs immediate attention. Let's work together to get you back on track! 💔"
        
      default:
        return "Capling is here to help you with your financial journey!"
    }
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setModalOpen(true)
  }

  const handleCaplingNameUpdate = (newName: string) => {
    setCaplingName(newName)
    // Refresh data to get updated profile
    refreshData()
  }

  const handleAddTransaction = async (transactionData: any, shouldShowGoalAllocation?: boolean) => {
    try {
      // Transaction is already created by the API, just refresh the data
      refreshData()
      
      // Show goal allocation modal only for irresponsible spending
      if (shouldShowGoalAllocation && transactionData.amount > 0) {
        triggerGoalAllocation({
          amount: transactionData.amount,
          merchant: transactionData.merchant,
          category: transactionData.category
        })
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  const handleAddGoal = async (goalData: any) => {
    try {
      await createGoal(goalData)
    } catch (error) {
      console.error('Failed to add goal:', error)
      throw error
    }
  }

  const handleGoalAllocationComplete = () => {
    completeGoalAllocation()
    // Refresh data to show updated goal progress
    refreshData()
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setAddGoalOpen(true)
  }

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    try {
      await updateGoal(goalId, updates)
      setEditingGoal(null)
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
    } catch (error) {
      console.error('Failed to delete goal:', error)
      throw error
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
    justification_status: supabaseTx.justification_status,
    original_classification: supabaseTx.original_classification,
    final_classification: supabaseTx.final_classification,
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DinosaurIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Capling</h1>
                {user && (
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user?.user_metadata?.full_name || user?.email}!
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
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="learn" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Learn</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Dashboard */}
          <TabsContent value="home" className="space-y-6">
            {/* Hero Section with Capling */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border border-primary/20 p-8">
              <div className="flex flex-col items-center text-center space-y-8">
                {/* Capling Character - Centered and Large */}
                <div className="flex justify-center">
                  <CaplingCharacter 
                    mood={getMood()} 
                    name={caplingName}
                    showNameEditor={true}
                    onNameUpdate={handleCaplingNameUpdate}
                    userId={user?.id}
                  />
                </div>
                
                {/* Welcome Message */}
                <div className="space-y-6 max-w-2xl">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Welcome back!
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {getMoodMessage()}
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className="bg-background/50 backdrop-blur-sm rounded-lg px-6 py-3 border">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xl font-semibold text-foreground">${weeklySpending.toFixed(2)}</p>
                  </div>
                  <div className="bg-background/50 backdrop-blur-sm rounded-lg px-6 py-3 border">
                    <p className="text-sm text-muted-foreground">Budget Left</p>
                    <p className="text-xl font-semibold text-foreground">${(weeklyBudget - weeklySpending).toFixed(2)}</p>
                  </div>
                  <div className="bg-background/50 backdrop-blur-sm rounded-lg px-6 py-3 border">
                    <p className="text-sm text-muted-foreground">Happy Days</p>
                    <p className="text-xl font-semibold text-foreground">{happinessStreak} days</p>
                  </div>
                </div>
              </div>
            </div>

            <BudgetProgress 
              spent={weeklySpending} 
              budget={weeklyBudget}
              userId={user?.id || ''}
              onBudgetUpdate={(newBudget) => {
                // Update the local state or trigger a refresh
                refreshData()
              }}
            />

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
                title="Happy Streak"
                value={`${happinessStreak} days`}
                icon={TrendingUp}
                trend={`Keep Capling happy to build your streak!`}
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
                    onJustificationSubmitted={(transactionId, justification) => {
                      console.log('Justification submitted for transaction:', transactionId)
                      // Refresh data to show updated classification and budget changes
                      setTimeout(() => {
                        refreshData()
                      }, 1000) // Small delay to ensure database updates are complete
                    }}
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

            <div className="space-y-4">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => setAddTransactionOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Add Transaction
              </Button>
              
            </div>
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
                  onJustificationSubmitted={(transactionId, justification) => {
                    console.log('Justification submitted for transaction:', transactionId)
                    // Refresh data to show updated classification and budget changes
                    setTimeout(() => {
                      refreshData()
                    }, 1000) // Small delay to ensure database updates are complete
                  }}
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Your Goals</h2>
                <p className="text-muted-foreground">Track your progress and earn rewards</p>
              </div>
              <Button onClick={() => setAddGoalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Active Goals</h3>
              {goalsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading your goals...</p>
                </div>
              ) : goalsError ? (
                <div className="text-center py-8 text-destructive">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                  <p>Failed to load goals: {goalsError}</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
                  <p>Create your first financial goal to start tracking your progress!</p>
                  <Button 
                    onClick={() => setAddGoalOpen(true)} 
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Goal
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Badges & Achievements</h3>
                <div className="text-sm text-muted-foreground">
                  {badges.filter(b => b.earned).length} of {badges.length} earned
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    title={badge.title}
                    description={badge.description}
                    emoji={badge.emoji}
                    earned={badge.earned}
                  />
                ))}
              </div>
            </div>

          </TabsContent>

          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-6">
            <LearnTab />
          </TabsContent>

        </Tabs>
      </main>

      <JustificationModal open={modalOpen} onOpenChange={setModalOpen} transaction={selectedTransaction} />
      <AddTransactionModal 
        open={addTransactionOpen} 
        onOpenChange={setAddTransactionOpen} 
        onTransactionAdded={handleAddTransaction}
        accountId={currentAccount?.id || ''}
        userId={user?.id || ''}
      />
      <GoalModal
        open={addGoalOpen}
        onOpenChange={(open) => {
          setAddGoalOpen(open)
          if (!open) setEditingGoal(null)
        }}
        onGoalAdded={handleAddGoal}
        editingGoal={editingGoal}
        onGoalUpdated={handleUpdateGoal}
      />
      <GoalAllocationModal
        open={showGoalAllocation}
        onOpenChange={(open) => !open && completeGoalAllocation()}
        transactionAmount={pendingTransaction?.amount || 0}
        transactionMerchant={pendingTransaction?.merchant || ''}
        transactionCategory={pendingTransaction?.category}
        onAllocationComplete={handleGoalAllocationComplete}
      />

      {/* Badge Notification */}
      {newBadge && (
        <BadgeNotification
          badge={newBadge}
          show={showNotification}
          onComplete={dismissNotification}
        />
      )}
      
    </div>
  )
}