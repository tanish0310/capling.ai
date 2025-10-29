"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Info, Sparkles, TrendingUp, DollarSign } from "lucide-react"

export function DemoNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/20 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
                       <h3 className="font-semibold text-foreground flex items-center gap-2">
                         <Info className="h-4 w-4" />
                         Supabase + GPT Integration
                       </h3>
                       <p className="text-sm text-muted-foreground mt-1">
                         Your data is securely stored in Supabase and analyzed by GPT! Add transactions to see intelligent insights and personalized feedback.
                       </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
                     <Badge variant="secondary" className="gap-1">
                       <DollarSign className="h-3 w-3" />
                       Secure Storage
                     </Badge>
                     <Badge variant="secondary" className="gap-1">
                       <TrendingUp className="h-3 w-3" />
                       GPT Analysis
                     </Badge>
                     <Badge variant="secondary" className="gap-1">
                       <Sparkles className="h-3 w-3" />
                       Real-time Sync
                     </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p><strong>Try this:</strong> Add "Emergency vet bill - $300" vs "New shoes - $300" to see how GPT analyzes context and provides personalized feedback!</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
