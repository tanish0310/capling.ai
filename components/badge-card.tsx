import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

interface BadgeCardProps {
  title: string
  description: string
  emoji: string
  earned: boolean
}

export function BadgeCard({ title, description, emoji, earned }: BadgeCardProps) {
  return (
    <Card
      className={`p-4 transition-all relative ${
        earned 
          ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-sm" 
          : "bg-muted/30 border-muted-foreground/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-4xl relative ${earned ? "animate-bounce-subtle" : "grayscale opacity-60"}`}>
          {emoji}
          {!earned && (
            <div className="absolute -top-1 -right-1 bg-muted-foreground/20 rounded-full p-1">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${earned ? "text-card-foreground" : "text-muted-foreground"}`}>
              {title}
            </h3>
            {earned ? (
              <Badge className="bg-primary text-primary-foreground text-xs">Earned</Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">
                Locked
              </Badge>
            )}
          </div>
          <p className={`text-sm ${earned ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}