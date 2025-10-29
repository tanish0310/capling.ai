import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Goal } from "@/hooks/use-goals"

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (goalId: string) => void
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const isCompleted = goal.is_completed || percentage >= 100

  return (
    <Card className={`p-5 hover:shadow-md transition-shadow ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{goal.emoji}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground">{goal.title}</h3>
              <p className="text-sm text-muted-foreground">
                ${goal.current_amount.toFixed(0)} / ${goal.target_amount.toFixed(0)}
              </p>
              {goal.description && (
                <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
              )}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(goal.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Progress 
          value={percentage} 
          className={`h-2 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} 
        />
        {isCompleted && (
          <p className="text-xs text-green-600 font-medium">🎉 Goal completed!</p>
        )}
      </div>
    </Card>
  )
}
