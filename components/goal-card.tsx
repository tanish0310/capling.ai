import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface GoalCardProps {
  title: string
  target: number
  current: number
  emoji: string
}

export function GoalCard({ title, target, current, emoji }: GoalCardProps) {
  const percentage = Math.min((current / target) * 100, 100)

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                ${current.toFixed(0)} / ${target.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </Card>
  )
}
