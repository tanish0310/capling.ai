import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeTransaction, getLLMConfig } from '@/lib/llm-analyzer'

export async function POST(request: NextRequest) {
  try {
    // Create server client that bypasses RLS
    const supabase = createServerClient()
    
    const body = await request.json()
    const { 
      userId, 
      accountId, 
      merchant, 
      amount, 
      category, 
      description,
      timestamp 
    } = body

    // Validate required fields
    if (!userId || !merchant || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, merchant, amount' },
        { status: 400 }
      )
    }

    // If no accountId provided, get the user's default account or create one
    let finalAccountId = accountId
    if (!finalAccountId) {
      console.log('🔍 Looking for existing accounts for user:', userId)
      
      const { data: userAccounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      console.log('📊 Account lookup result:', { userAccounts, accountsError })

      if (accountsError) {
        console.error('❌ Error looking up accounts:', accountsError)
        return NextResponse.json(
          { error: 'Failed to lookup user accounts', details: accountsError.message },
          { status: 500 }
        )
      }

      if (!userAccounts || userAccounts.length === 0) {
        // No account found, create a default one
        console.log('No account found for user, creating default account...')
        
        const { data: newAccount, error: createAccountError } = await supabase
          .from('accounts')
          .insert([{
            user_id: userId,
            account_name: 'Main Checking',
            account_type: 'checking',
            balance: 1000.00 // Starting balance
          }])
          .select()
          .single()

        if (createAccountError || !newAccount) {
          console.error('Failed to create account:', createAccountError)
          return NextResponse.json(
            { 
              error: 'Failed to create account for user',
              details: createAccountError?.message || 'Unknown error',
              code: createAccountError?.code,
              hint: createAccountError?.hint,
              userId: userId
            },
            { status: 500 }
          )
        }

        finalAccountId = newAccount.id
        console.log('✅ Created default account:', finalAccountId)
      } else {
        finalAccountId = userAccounts[0].id
        console.log('✅ Found existing account:', finalAccountId)
      }
    } else {
      console.log('✅ Using provided accountId:', finalAccountId)
    }

    // Get the current account to verify it exists and get current balance
    console.log('🔍 Verifying account:', { finalAccountId, userId })
    
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', finalAccountId)
      .eq('user_id', userId)
      .single()

    console.log('📊 Account verification result:', { account, accountError })

    if (accountError) {
      console.error('❌ Account verification error:', accountError)
      return NextResponse.json(
        { 
          error: 'Account not found or access denied',
          details: accountError.message,
          accountId: finalAccountId,
          userId: userId
        },
        { status: 404 }
      )
    }

    if (!account) {
      console.error('❌ No account found for ID:', finalAccountId)
      return NextResponse.json(
        { 
          error: 'Account not found',
          accountId: finalAccountId,
          userId: userId
        },
        { status: 404 }
      )
    }

    // Determine transaction type (assume debit unless specified otherwise)
    const type = amount < 0 ? 'credit' : 'debit'
    const transactionAmount = Math.abs(amount)

    // Get LLM analysis for the transaction
    let analysis
    try {
      console.log('🔍 Starting LLM analysis for transaction:', { merchant, amount: transactionAmount, description })
      const config = getLLMConfig()
      console.log('🔧 LLM Config loaded:', { provider: config.provider, hasApiKey: !!config.apiKey })
      
      analysis = await analyzeTransaction(
        merchant,
        transactionAmount,
        description || merchant,
        config,
        account.balance
      )
      console.log('✅ LLM analysis completed:', analysis)
    } catch (llmError) {
      console.error('❌ LLM analysis failed:', llmError)
      // Fallback analysis if LLM fails
      analysis = {
        classification: 'neutral' as const,
        reflection: 'Transaction processed - analysis unavailable',
        confidence: 0.5,
        reasoning: 'LLM analysis failed'
      }
      console.log('🔄 Using fallback analysis:', analysis)
    }

    // Create transaction date
    const transactionDate = timestamp ? new Date(timestamp) : new Date()
    const formattedDate = transactionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Determine if transaction needs justification
    const needsJustification = analysis.classification === 'irresponsible' || analysis.classification === 'neutral'
    const justificationStatus = needsJustification ? 'pending' : 'none'

    // Create the transaction record
    const transactionData = {
      user_id: userId,
      account_id: finalAccountId,
      merchant,
      amount: transactionAmount,
      category: category || 'shopping',
      classification: analysis.classification,
      original_classification: analysis.classification,
      final_classification: analysis.classification,
      reflection: analysis.reflection,
      improvement_suggestion: analysis.improvement_suggestion,
      description: description || merchant,
      date: formattedDate,
      timestamp: transactionDate.getTime(),
      type,
      justification_status: justificationStatus
    }

    // Insert transaction into database
    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Update account balance
    const newBalance = type === 'credit' 
      ? account.balance + transactionAmount 
      : account.balance - transactionAmount

    const { error: balanceError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', finalAccountId)

    if (balanceError) {
      console.error('Failed to update account balance:', balanceError)
      // Transaction was created but balance update failed
      return NextResponse.json({
        success: true,
        transaction: newTransaction,
        warning: 'Transaction created but balance update failed',
        newBalance: account.balance // Return old balance
      })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      newBalance,
      analysis: {
        classification: analysis.classification,
        reflection: analysis.reflection
      },
      shouldShowGoalAllocation: transactionAmount > 0 && analysis.classification === 'irresponsible' // Only show goal allocation for irresponsible spending
    })

  } catch (error) {
    console.error('Error processing transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve recent transactions for an account
export async function GET(request: NextRequest) {
  try {
    // Create server client that bypasses RLS
    const supabase = createServerClient()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const accountId = searchParams.get('accountId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, accountId' },
        { status: 400 }
      )
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || []
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}