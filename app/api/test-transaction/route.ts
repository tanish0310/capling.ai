import { NextRequest, NextResponse } from 'next/server'
import { analyzeTransaction, getLLMConfig } from '@/lib/llm-analyzer'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      merchant, 
      amount, 
      category, 
      description 
    } = body

    // Validate required fields
    if (!userId || !merchant || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, merchant, amount' },
        { status: 400 }
      )
    }

    // Validate data types
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 }
      )
    }

    console.log('🔍 Test transaction request:', {
      userId,
      merchant,
      amount: numericAmount,
      category,
      description
    })

    // Create a mock transaction for LLM analysis
    const mockTransaction = {
      merchant: merchant || 'Unknown Store',
      amount: numericAmount,
      category: category || 'shopping',
      description: description || merchant || 'Purchase',
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now()
    }

    console.log('🧪 Testing LLM analysis for transaction:', mockTransaction)

    // Run LLM analysis
    console.log('🔍 Calling analyzeTransaction with:', {
      merchant: mockTransaction.merchant,
      amount: mockTransaction.amount,
      description: mockTransaction.description
    })
    
    const analysis = await analyzeTransaction(
      mockTransaction.merchant,
      mockTransaction.amount,
      mockTransaction.description
    )

    console.log('✅ LLM analysis result:', analysis)

    // Now create a real transaction in the database
    console.log('💾 Creating real transaction in database...')
    
    // Get or create account for the user
    let accountId
    const { data: userAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (accountsError || !userAccounts || userAccounts.length === 0) {
      // Create a default account
      console.log('Creating default account for user...')
      const { data: newAccount, error: createAccountError } = await supabase
        .from('accounts')
        .insert([{
          user_id: userId,
          account_name: 'Main Checking',
          account_type: 'checking',
          balance: 1000.00
        }])
        .select()
        .single()

      if (createAccountError || !newAccount) {
        console.error('Failed to create account:', createAccountError)
        console.error('Account creation details:', {
          userId,
          accountName: 'Main Checking',
          accountType: 'checking',
          balance: 1000.00,
          error: createAccountError
        })
        return NextResponse.json(
          { 
            error: 'Failed to create account for user',
            details: createAccountError?.message || 'Unknown error',
            userId: userId
          },
          { status: 500 }
        )
      }
      accountId = newAccount.id
    } else {
      accountId = userAccounts[0].id
    }

    // Create the transaction record with proper enum values
    const transactionData = {
      user_id: userId,
      account_id: accountId,
      merchant: mockTransaction.merchant,
      amount: mockTransaction.amount,
      category: mockTransaction.category as 'shopping' | 'food' | 'transport' | 'bills' | 'dining' | 'entertainment' | 'health' | 'income',
      classification: analysis.classification as 'responsible' | 'borderline' | 'impulsive',
      reflection: analysis.reflection,
      description: mockTransaction.description,
      date: mockTransaction.date,
      timestamp: mockTransaction.timestamp,
      type: 'debit' as 'debit' | 'credit'
    }

    const { data: newTransaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()

    if (transactionError || !newTransaction) {
      console.error('Failed to create transaction:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create transaction in database' },
        { status: 500 }
      )
    }

    // Update account balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      console.error('Failed to get account for balance update:', accountError)
    } else {
      const newBalance = account.balance - mockTransaction.amount
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)

      if (balanceError) {
        console.error('Failed to update account balance:', balanceError)
      } else {
        console.log('✅ Account balance updated to:', newBalance)
      }
    }

    console.log('✅ Real transaction created:', newTransaction)

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      analysis: analysis,
      message: 'Transaction created and analyzed successfully'
    })

  } catch (error) {
    console.error('❌ Error in test transaction:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}