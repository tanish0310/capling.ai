"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Coffee, Car, Home, Utensils, Gamepad2, Heart, DollarSign, MessageSquare, type LucideIcon } from "lucide-react"
import { JustificationPrompt } from "./justification-prompt"

type TransactionCategory = "shopping" | "food" | "transport" | "bills" | "dining" | "entertainment" | "health" | "income"
type TransactionClassification = "responsible" | "irresponsible" | "neutral"

interface Transaction {
  id: string
  merchant: string
  amount: number
  category: TransactionCategory
  classification: TransactionClassification
  reflection?: string
  date: string
  justification_status?: 'none' | 'pending' | 'justified' | 'rejected'
  original_classification?: string
  final_classification?: string
}

interface TransactionItemProps {
  transaction: Transaction
  onClick?: () => void
  onJustificationSubmitted?: (transactionId: string, justification: string) => void
}

const categoryIcons: Record<TransactionCategory, LucideIcon> = {
  shopping: ShoppingBag,
  food: Coffee,
  transport: Car,
  bills: Home,
  dining: Utensils,
  entertainment: Gamepad2,
  health: Heart,
  income: DollarSign,
}

export function TransactionItem({ transaction, onClick, onJustificationSubmitted }: TransactionItemProps) {
  const [showJustificationPrompt, setShowJustificationPrompt] = useState(false)
  const Icon = categoryIcons[transaction.category] || ShoppingBag

  const getClassificationBadge = () => {
    // Show final classification if it exists, otherwise show current classification
    const displayClassification = transaction.final_classification || transaction.classification
    
    switch (displayClassification) {
      case "responsible":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">✓ Responsible</Badge>
      case "neutral":
        return (
          <Badge className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 border-secondary/20">
            ⚠ Neutral
          </Badge>
        )
      case "irresponsible":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
            ✕ Irresponsible
          </Badge>
        )
    }
  }

  const handleJustificationSubmitted = (transactionId: string, justification: string) => {
    setShowJustificationPrompt(false)
    if (onJustificationSubmitted) {
      onJustificationSubmitted(transactionId, justification)
    }
  }

  const needsJustification = transaction.justification_status === 'pending'
  const isJustified = transaction.justification_status === 'justified'
  const isRejected = transaction.justification_status === 'rejected'

  return (
    <>
      <Card className={`p-4 hover:shadow-md transition-all ${needsJustification ? 'border-orange-200 bg-orange-50' : ''}`}>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-muted p-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-card-foreground">{transaction.merchant}</p>
                <p className="text-sm text-muted-foreground">{transaction.date}</p>
              </div>
              <p className="text-lg font-bold text-card-foreground">${transaction.amount.toFixed(2)}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {getClassificationBadge()}
              {isJustified && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✓ Justified
                </Badge>
              )}
              {isRejected && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  ✕ Rejected
                </Badge>
              )}
            </div>
            
            {transaction.reflection && (
              <p className="text-sm text-muted-foreground italic">{transaction.reflection}</p>
            )}
            
            {needsJustification && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowJustificationPrompt(true)
                  }}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Justify This Purchase
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {showJustificationPrompt && (
        <JustificationPrompt
          transaction={transaction}
          onJustificationSubmitted={handleJustificationSubmitted}
          onClose={() => setShowJustificationPrompt(false)}
        />
      )}
    </>
  )
}

export type { Transaction, TransactionCategory, TransactionClassification }