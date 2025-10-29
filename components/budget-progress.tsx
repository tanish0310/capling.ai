"use client"

import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface BudgetProgressProps {
  spent: number
  budget: number
}

export function BudgetProgress({ spent, budget }: BudgetProgressProps) {
  const percentage = Math.min((spent / budget) * 100, 100)
  const remaining = Math.max(budget - spent, 0)

  const getProgressColor = () => {
    if (percentage < 50) return "bg-primary"
    if (percentage < 80) return "bg-secondary"
    return "bg-destructive"
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">Weekly Budget Progress</h3>
          <span className="text-2xl font-bold text-card-foreground">{percentage.toFixed(0)}%</span>
        </div>
        <Progress value={percentage} className="h-3" indicatorClassName={getProgressColor()} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Spent: <span className="font-semibold text-foreground">${spent.toFixed(2)}</span>
          </span>
          <span className="text-muted-foreground">
            Remaining: <span className="font-semibold text-primary">${remaining.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </Card>
  )
}
