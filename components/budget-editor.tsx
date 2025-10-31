'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Edit3, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BudgetEditorProps {
  currentBudget: number | null
  userId: string
  onBudgetUpdate: (newBudget: number) => void
}

export function BudgetEditor({ currentBudget, userId, onBudgetUpdate }: BudgetEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [budget, setBudget] = useState(currentBudget?.toString() || '')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!budget || isNaN(parseFloat(budget))) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid number for your weekly budget.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/update-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weeklyBudget: parseFloat(budget)
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update budget')
      }

      onBudgetUpdate(parseFloat(budget))
      setIsOpen(false)
      
      toast({
        title: "Budget Updated",
        description: `Your weekly budget has been updated to $${parseFloat(budget).toFixed(2)}.`,
      })
    } catch (error) {
      console.error('Error updating budget:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update budget. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setBudget(currentBudget?.toString() || '')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit3 className="h-4 w-4" />
          Edit Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Edit Weekly Budget
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Weekly Budget</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="pl-8"
                placeholder="Enter your weekly budget"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simple inline budget editor for quick edits
export function InlineBudgetEditor({ currentBudget, userId, onBudgetUpdate }: BudgetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [budget, setBudget] = useState(currentBudget?.toString() || '')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!budget || isNaN(parseFloat(budget))) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid number for your weekly budget.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/update-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weeklyBudget: parseFloat(budget)
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update budget')
      }

      onBudgetUpdate(parseFloat(budget))
      setIsEditing(false)
      
      toast({
        title: "Budget Updated",
        description: `Your weekly budget has been updated to $${parseFloat(budget).toFixed(2)}.`,
      })
    } catch (error) {
      console.error('Error updating budget:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update budget. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setBudget(currentBudget?.toString() || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-24 h-8 text-sm"
          placeholder="0.00"
          autoFocus
        />
        <Button size="sm" onClick={handleSave} disabled={loading}>
          {loading ? '...' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setIsEditing(true)}
      className="h-6 w-6 p-0"
    >
      <Edit3 className="h-3 w-3" />
    </Button>
  )
}