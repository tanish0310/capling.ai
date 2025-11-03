"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface JustificationPromptProps {
  transaction: {
    id: string
    merchant: string
    amount: number
    classification: string
    reflection?: string
  }
  onJustificationSubmitted: (transactionId: string, justification: string) => void
  onClose: () => void
}

export function JustificationPrompt({ transaction, onJustificationSubmitted, onClose }: JustificationPromptProps) {
  const [justification, setJustification] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!justification.trim()) {
      toast({
        title: "Justification Required",
        description: "Please provide a reason for this purchase.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/justify-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          justification: justification.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit justification')
      }

      if (result.justificationAnalysis.isValid) {
        let description = "Your purchase has been reclassified as responsible."
        
        // Check if budget was adjusted
        if (result.budgetAdjustment?.adjusted) {
          description += ` Your weekly budget has been automatically adjusted to $${result.budgetAdjustment.newBudget} to accommodate your justified spending.`
        }
        
        toast({
          title: "Justification Accepted! 🎉",
          description: description,
        })
      } else {
        toast({
          title: "Justification Not Accepted",
          description: result.justificationAnalysis.reasoning,
          variant: "destructive"
        })
      }

      onJustificationSubmitted(transaction.id, justification.trim())
      onClose()
    } catch (error) {
      console.error('Error submitting justification:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit justification',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getClassificationIcon = () => {
    switch (transaction.classification) {
      case 'irresponsible':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'neutral':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-primary" />
    }
  }

  const getClassificationColor = () => {
    switch (transaction.classification) {
      case 'irresponsible':
        return 'border-destructive/20 bg-destructive/10'
      case 'neutral':
        return 'border-yellow-500/20 bg-yellow-500/10'
      default:
        return 'border-primary/20 bg-primary/10'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-card border-border shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getClassificationIcon()}
            <div>
              <h3 className="font-semibold text-lg">Justify Your Purchase</h3>
              <p className="text-sm text-muted-foreground">
                {transaction.merchant} - ${transaction.amount}
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${getClassificationColor()}`}>
            <p className="text-sm font-medium mb-1">Current Classification: {transaction.classification}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.reflection || 'This purchase needs justification.'}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="justification" className="text-sm font-medium">
              Why was this purchase necessary or justified?
            </label>
            <Textarea
              id="justification"
              placeholder="Explain your reasoning... (e.g., 'I needed this for work', 'It was on sale and I planned for it', 'Emergency situation')"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Be specific and honest. Good justifications include work needs, planned purchases, emergencies, or legitimate reasons.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !justification.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Submit Justification"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}