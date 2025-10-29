import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BadgeCardProps {
  title: string
  description: string
  emoji: string
  earned: boolean
}

export function BadgeCard({ title, description, emoji, earned }: BadgeCardProps) {
  return (
    <Card
      className={`p-4 transition-all ${
        earned ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20" : "bg-muted/30 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-4xl ${earned ? "animate-bounce-subtle" : "grayscale"}`}>{emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-card-foreground">{title}</h3>
            {earned && <Badge className="bg-primary text-primary-foreground">Earned</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  )
}
