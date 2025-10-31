"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { Transaction } from "./transaction-item"

interface JustificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function JustificationModal({ open, onOpenChange, transaction }: JustificationModalProps) {
  const [justification, setJustification] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResponse, setAiResponse] = useState<{
    classification: string
    reflection: string
  } | null>(null)

  const handleSubmit = async () => {
    if (!justification.trim()) return

    setIsAnalyzing(true)
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock AI response
    const responses = [
      {
        classification: "Responsible",
        reflection: "Great choice! This purchase aligns with your goals.",
      },
      {
        classification: "Neutral",
        reflection: "Consider if this is a need or a want. Try waiting 24 hours.",
      },
      {
        classification: "Irresponsible",
        reflection: "Try meal prepping next week — that's $40 saved.",
      },
    ]

    setAiResponse(responses[Math.floor(Math.random() * responses.length)])
    setIsAnalyzing(false)
  }

  const handleClose = () => {
    setJustification("")
    setAiResponse(null)
    onOpenChange(false)
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Justify Your Purchase</DialogTitle>
          <DialogDescription>Help Capling understand your spending decision</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-card-foreground">{transaction.merchant}</p>
                <p className="text-sm text-muted-foreground">{transaction.category}</p>
              </div>
              <p className="text-xl font-bold text-card-foreground">${transaction.amount.toFixed(2)}</p>
            </div>
          </Card>

          {!aiResponse ? (
            <>
              <Textarea
                placeholder="Why did you make this purchase?"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-24 resize-none"
              />
              <Button onClick={handleSubmit} disabled={!justification.trim() || isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Submit Justification"
                )}
              </Button>
            </>
          ) : (
            <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-secondary/5 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                  <span className="text-3xl">
                    {aiResponse.classification === "Responsible"
                      ? "✓"
                      : aiResponse.classification === "Neutral"
                        ? "⚠"
                        : "✕"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{aiResponse.classification}</h3>
                <p className="text-sm text-muted-foreground">{aiResponse.reflection}</p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Got it!
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
