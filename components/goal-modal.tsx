"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Target } from "lucide-react"
import { Goal, CreateGoalData } from "@/hooks/use-goals"

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalAdded: (goal: CreateGoalData) => Promise<void>
  editingGoal?: Goal | null
  onGoalUpdated?: (goalId: string, updates: Partial<CreateGoalData>) => Promise<void>
}

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Savings' },
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'education', label: 'Education' },
  { value: 'home', label: 'Home' },
  { value: 'car', label: 'Car' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' }
]

const GOAL_EMOJIS = [
  '🎯', '💰', '🏦', '✈️', '🏠', '🚗', '💻', '📚', 
  '🏥', '🎓', '💍', '🎮', '📱', '👕', '🍕', '☕'
]

export function GoalModal({ 
  open, 
  onOpenChange, 
  onGoalAdded, 
  editingGoal, 
  onGoalUpdated 
}: GoalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    emoji: '🎯',
    category: 'savings',
    target_date: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes or editing goal changes
  useEffect(() => {
    if (open) {
      if (editingGoal) {
        setFormData({
          title: editingGoal.title,
          description: editingGoal.description || '',
          target_amount: editingGoal.target_amount.toString(),
          emoji: editingGoal.emoji,
          category: editingGoal.category,
          target_date: editingGoal.target_date || '',
        })
      } else {
        setFormData({
          title: '',
          description: '',
          target_amount: '',
          emoji: '🎯',
          category: 'savings',
          target_date: '',
        })
      }
      setError(null)
    }
  }, [open, editingGoal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.target_amount) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const amount = parseFloat(formData.target_amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      const goalData: CreateGoalData = {
        title: formData.title,
        description: formData.description || undefined,
        target_amount: amount,
        emoji: formData.emoji,
        category: formData.category,
        target_date: formData.target_date || undefined,
      }

      if (editingGoal && onGoalUpdated) {
        await onGoalUpdated(editingGoal.id, goalData)
      } else {
        await onGoalAdded(goalData)
      }
      
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      target_amount: '',
      emoji: '🎯',
      category: 'savings',
      target_date: '',
    })
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </DialogTitle>
          <DialogDescription>
            {editingGoal ? 'Update your goal details' : 'Set a new financial goal to track your progress'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Save for vacation"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of your goal"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Target Amount *</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.target_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                    formData.emoji === emoji 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingGoal ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}