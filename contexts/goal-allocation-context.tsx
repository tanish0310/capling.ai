"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface PendingTransaction {
  amount: number
  merchant: string
  category?: string
}

interface GoalAllocationContextType {
  pendingTransaction: PendingTransaction | null
  showGoalAllocation: boolean
  triggerGoalAllocation: (transaction: PendingTransaction) => void
  completeGoalAllocation: () => void
}

const GoalAllocationContext = createContext<GoalAllocationContextType | undefined>(undefined)

export function GoalAllocationProvider({ children }: { children: ReactNode }) {
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null)
  const [showGoalAllocation, setShowGoalAllocation] = useState(false)

  const triggerGoalAllocation = (transaction: PendingTransaction) => {
    setPendingTransaction(transaction)
    setShowGoalAllocation(true)
  }

  const completeGoalAllocation = () => {
    setPendingTransaction(null)
    setShowGoalAllocation(false)
  }

  return (
    <GoalAllocationContext.Provider value={{
      pendingTransaction,
      showGoalAllocation,
      triggerGoalAllocation,
      completeGoalAllocation
    }}>
      {children}
    </GoalAllocationContext.Provider>
  )
}

export function useGoalAllocation() {
  const context = useContext(GoalAllocationContext)
  if (context === undefined) {
    throw new Error('useGoalAllocation must be used within a GoalAllocationProvider')
  }
  return context
}