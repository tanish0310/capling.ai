'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Target, DollarSign, RefreshCw } from 'lucide-react'

interface OnboardingFormProps {
  userId: string
  userEmail: string
  onComplete: () => void
  onClearAuth?: () => void
}

interface Goal {
  id: string
  title: string
  targetAmount: number
  category: string
  emoji: string
}

export function OnboardingForm({ userId, userEmail, onComplete, onClearAuth }: OnboardingFormProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [weeklyBudget, setWeeklyBudget] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    category: 'general',
    emoji: '🎯'
  })

  const goalCategories = [
    { value: 'general', label: 'General', emoji: '🎯' },
    { value: 'travel', label: 'Travel', emoji: '✈️' },
    { value: 'emergency', label: 'Emergency Fund', emoji: '🆘' },
    { value: 'education', label: 'Education', emoji: '📚' },
    { value: 'home', label: 'Home', emoji: '🏠' },
    { value: 'car', label: 'Car', emoji: '🚗' },
    { value: 'health', label: 'Health', emoji: '💊' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' }
  ]

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount) return

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      category: newGoal.category,
      emoji: newGoal.emoji
    }

    setGoals([...goals, goal])
    setNewGoal({
      title: '',
      targetAmount: '',
      category: 'general',
      emoji: '🎯'
    })
  }

  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id))
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const requestData = {
        userId,
        weeklyBudget: parseFloat(weeklyBudget),
        goals: goals.length > 0 ? goals : undefined
      }
      
      console.log('Sending onboarding data:', requestData)
      console.log('Goals array:', goals)
      console.log('Goals length:', goals.length)
      
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete onboarding')
      }

      console.log('Onboarding completed successfully')
      onComplete()
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to complete setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && weeklyBudget) {
      setStep(2)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Capling! 🦕</h1>
          <p className="text-muted-foreground">
            Let's set up your financial goals and budget
          </p>
          {onClearAuth && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearAuth}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear Auth State (Fix Issues)
              </Button>
            </div>
          )}
        </div>

        {/* Step 1: Weekly Budget */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-2">Set Your Weekly Budget</h2>
              <p className="text-muted-foreground">
                How much would you like to spend per week?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Weekly Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 200.00"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Conservative</div>
                  <div className="text-muted-foreground">$100-150</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Moderate</div>
                  <div className="text-muted-foreground">$150-250</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">Comfortable</div>
                  <div className="text-muted-foreground">$250+</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={nextStep} 
                disabled={!weeklyBudget}
                className="px-8"
              >
                Next: Set Goals
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-2">Set Your Financial Goals</h2>
              <p className="text-muted-foreground">
                What are you saving for? (Optional - you can add more later)
              </p>
            </div>

            {/* Existing Goals */}
            {goals.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Your Goals:</h3>
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <div className="font-medium">{goal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: ${goal.targetAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Goal */}
            <div className="space-y-4 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <h3 className="font-medium">Add a Goal:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g., Vacation to Europe"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-amount">Target Amount ($)</Label>
                  <Input
                    id="goal-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-category">Category</Label>
                <Select value={newGoal.category} onValueChange={(value) => {
                  const category = goalCategories.find(c => c.value === value)
                  setNewGoal(prev => ({ 
                    ...prev, 
                    category: value,
                    emoji: category?.emoji || '🎯'
                  }))
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.emoji} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={addGoal} 
                disabled={!newGoal.title || !newGoal.targetAmount}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                className="px-8"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}