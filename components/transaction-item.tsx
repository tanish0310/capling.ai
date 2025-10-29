"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Coffee, Car, Home, Utensils, Gamepad2, Heart, DollarSign, type LucideIcon } from "lucide-react"

type TransactionCategory = "shopping" | "food" | "transport" | "bills" | "dining" | "entertainment" | "health" | "income"
type TransactionClassification = "responsible" | "borderline" | "impulsive"

interface Transaction {
  id: string
  merchant: string
  amount: number
  category: TransactionCategory
  classification: TransactionClassification
  reflection?: string
  date: string
}

interface TransactionItemProps {
  transaction: Transaction
  onClick?: () => void
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

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const Icon = categoryIcons[transaction.category] || ShoppingBag

  const getClassificationBadge = () => {
    switch (transaction.classification) {
      case "responsible":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">✓ Responsible</Badge>
      case "borderline":
        return (
          <Badge className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 border-secondary/20">
            ⚠ Borderline
          </Badge>
        )
      case "impulsive":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
            ✕ Impulsive
          </Badge>
        )
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
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
          <div className="flex items-center gap-2">{getClassificationBadge()}</div>
          {transaction.reflection && <p className="text-sm text-muted-foreground italic">{transaction.reflection}</p>}
        </div>
      </div>
    </Card>
  )
}

export type { Transaction, TransactionCategory, TransactionClassification }
