import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeJustification } from '@/lib/llm-analyzer'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const body = await request.json()
    const { transactionId, justification } = body

    if (!transactionId || !justification) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, justification' },
        { status: 400 }
      )
    }

    // Get the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if transaction is in pending status
    if (transaction.justification_status !== 'pending') {
      return NextResponse.json(
        { error: 'Transaction does not require justification' },
        { status: 400 }
      )
    }

    console.log('🔍 Analyzing justification for transaction:', {
      transactionId,
      merchant: transaction.merchant,
      amount: transaction.amount,
      originalClassification: transaction.original_classification,
      justification
    })

    // Analyze the justification using LLM
    const justificationAnalysis = await analyzeJustification(
      transaction.merchant,
      transaction.amount,
      transaction.description,
      justification,
      transaction.original_classification
    )

    console.log('✅ Justification analysis completed:', justificationAnalysis)

    // Update transaction based on justification analysis
    const updateData = {
      justification: justification,
      justification_status: justificationAnalysis.isValid ? 'justified' : 'rejected',
      final_classification: justificationAnalysis.isValid ? 'responsible' : transaction.original_classification,
      classification: justificationAnalysis.isValid ? 'responsible' : transaction.original_classification,
      reflection: justificationAnalysis.newReflection || transaction.reflection
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    // Check if we need to adjust budget due to justified over-budget spending
    let budgetAdjusted = false
    let newBudget = null
    
    if (justificationAnalysis.isValid && transaction.original_classification === 'irresponsible') {
      console.log('🔍 Checking if budget adjustment is needed for justified over-budget transaction')
      
      // Get user's current weekly budget
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('weekly_budget')
        .eq('id', transaction.user_id)
        .single()

      if (profileError) {
        console.error('Failed to get user profile for budget adjustment:', profileError)
      } else {
        const currentBudget = userProfile.weekly_budget || 0
        
        // Calculate total spending for current week
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        
        const { data: weeklyTransactions, error: weeklyError } = await supabase
          .from('transactions')
          .select('amount, final_classification, classification')
          .eq('user_id', transaction.user_id)
          .gte('date', weekStart.toISOString().split('T')[0])
          .order('date', { ascending: true })

        if (weeklyError) {
          console.error('Failed to get weekly transactions for budget calculation:', weeklyError)
        } else {
          // Calculate total weekly spending (use final_classification if available, otherwise classification)
          const totalWeeklySpending = weeklyTransactions.reduce((sum, tx) => {
            const classification = tx.final_classification || tx.classification
            // Only count non-income transactions
            if (classification !== 'income') {
              return sum + Number(tx.amount)
            }
            return sum
          }, 0)

          console.log('📊 Budget adjustment analysis:', {
            currentBudget,
            totalWeeklySpending,
            transactionAmount: transaction.amount,
            wasOverBudget: totalWeeklySpending > currentBudget
          })

          // If user was over budget and this transaction was justified, adjust budget
          if (totalWeeklySpending > currentBudget) {
            // Set new budget to 10% above total weekly spending for buffer
            newBudget = Math.ceil(totalWeeklySpending * 1.1)
            
            const { error: budgetUpdateError } = await supabase
              .from('user_profiles')
              .update({ weekly_budget: newBudget })
              .eq('id', transaction.user_id)

            if (budgetUpdateError) {
              console.error('Failed to update budget:', budgetUpdateError)
            } else {
              budgetAdjusted = true
              console.log('✅ Budget automatically adjusted:', {
                from: currentBudget,
                to: newBudget,
                reason: 'Justified over-budget spending'
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      justificationAnalysis: {
        isValid: justificationAnalysis.isValid,
        reasoning: justificationAnalysis.reasoning,
        newReflection: justificationAnalysis.newReflection
      },
      budgetAdjustment: budgetAdjusted ? {
        adjusted: true,
        newBudget: newBudget,
        reason: 'Budget automatically adjusted due to justified over-budget spending'
      } : {
        adjusted: false
      }
    })

  } catch (error) {
    console.error('Error processing justification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
