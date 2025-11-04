"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Target, Plus, Minus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useGoals } from "@/hooks/use-goals"
import { getSmartAllocation } from "@/lib/goal-suggestions"

interface Goal {
  id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  emoji: string
  category: string
  target_date: string | null
  is_completed: boolean
}

interface GoalAllocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionAmount: number
  transactionMerchant: string
  transactionCategory?: string
  onAllocationComplete: () => void
}

export function GoalAllocationModal({ 
  open, 
  onOpenChange, 
  transactionAmount, 
  transactionMerchant,
  transactionCategory = 'general',
  onAllocationComplete 
}: GoalAllocationModalProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const { goals, addProgress } = useGoals()
  const { toast } = useToast()

  // Reset allocations when modal opens and apply smart suggestions
  useEffect(() => {
    if (open) {
      const smartAllocation = getSmartAllocation(
        transactionAmount,
        transactionMerchant,
        transactionCategory,
        goals
      )
      setAllocations(smartAllocation)
    }
  }, [open, transactionAmount, transactionMerchant, transactionCategory, goals])

  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0)
  const remainingAmount = transactionAmount - totalAllocated

  const handleAllocationChange = (goalId: string, amount: number) => {
    setAllocations(prev => ({
      ...prev,
      [goalId]: Math.max(0, Math.min(amount, remainingAmount + (prev[goalId] || 0)))
    }))
  }

  const quickAllocate = (goalId: string, percentage: number) => {
    const amount = (transactionAmount * percentage) / 100
    setAllocations(prev => ({
      ...prev,
      [goalId]: amount
    }))
  }

  const handleSubmit = async () => {
    if (totalAllocated === 0) {
      toast({
        title: "No Allocation",
        description: "Please allocate some amount towards your goals or click 'Skip' to continue.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Add progress to each goal
      const promises = Object.entries(allocations).map(([goalId, amount]) => {
        if (amount > 0) {
          return addProgress(goalId, amount)
        }
        return Promise.resolve()
      })

      await Promise.all(promises)

      toast({
        title: "Money Allocated! 💰",
        description: `Successfully allocated $${totalAllocated.toFixed(2)} towards your goals and deducted from checking account.`,
      })

      onAllocationComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating goals:', error)
      toast({
        title: "Error",
        description: "Failed to update goals. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onAllocationComplete()
    onOpenChange(false)
  }

  const activeGoals = goals.filter(goal => !goal.is_completed)

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Turn This Into Progress! 🎯
          </DialogTitle>
          <DialogDescription>
            That ${transactionAmount.toFixed(2)} at {transactionMerchant} might not have been the best choice. 
            Let's make it count by allocating this amount towards your financial goals instead!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Transaction Amount</p>
                <p className="text-2xl font-bold text-primary">${transactionAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Allocated</p>
                <p className="text-lg font-semibold">${totalAllocated.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-2">
              <Progress 
                value={(totalAllocated / transactionAmount) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {remainingAmount > 0 ? `$${remainingAmount.toFixed(2)} remaining` : 'Fully allocated'}
              </p>
            </div>
          </Card>

          {/* Goals List */}
          {activeGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Active Goals</h3>
              <p>Create some financial goals to start tracking your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Your Goals</h3>
              {activeGoals.map((goal) => {
                const currentAllocation = allocations[goal.id] || 0
                const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                const newPercentage = Math.min(((goal.current_amount + currentAllocation) / goal.target_amount) * 100, 100)

                return (
                  <Card key={goal.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{goal.emoji}</span>
                          <div>
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${goal.current_amount.toFixed(0)} / ${goal.target_amount.toFixed(0)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>

                      <Progress value={percentage} className="h-2" />
                      {currentAllocation > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>After allocation:</span>
                            <span className="font-medium">
                              ${(goal.current_amount + currentAllocation).toFixed(0)} / ${goal.target_amount.toFixed(0)}
                            </span>
                          </div>
                          <Progress value={newPercentage} className="h-2 [&>div]:bg-green-500" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor={`goal-${goal.id}`}>Amount to allocate</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`goal-${goal.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingAmount + currentAllocation}
                            value={currentAllocation || ''}
                            onChange={(e) => handleAllocationChange(goal.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="flex-1"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => quickAllocate(goal.id, 25)}
                              disabled={remainingAmount <= 0}
                            >
                              25%
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => quickAllocate(goal.id, 50)}
                              disabled={remainingAmount <= 0}
                            >
                              50%
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => quickAllocate(goal.id, 100)}
                              disabled={remainingAmount <= 0}
                            >
                              All
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading || totalAllocated === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Goals...
                </>
              ) : (
                `Allocate $${totalAllocated.toFixed(2)}`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}