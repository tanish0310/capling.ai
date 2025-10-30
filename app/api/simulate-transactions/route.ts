import { NextRequest, NextResponse } from 'next/server'
import { generateRealisticTransactions } from '@/lib/realistic-fake-data'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      accountId, 
      count = 5,
      incomeLevel = 'medium',
      timeRange = 'week' // 'day', 'week', 'month'
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // If no accountId provided, get the user's default account or create one
    let finalAccountId = accountId
    if (!finalAccountId) {
      const { data: userAccounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (accountsError || !userAccounts || userAccounts.length === 0) {
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
            { error: 'Failed to create account for user' },
            { status: 500 }
          )
        }

        finalAccountId = newAccount.id
        console.log('Created default account:', finalAccountId)
      } else {
        finalAccountId = userAccounts[0].id
      }
    }

    // Generate realistic transactions
    const transactions = generateRealisticTransactions(
      userId,
      finalAccountId,
      count,
      incomeLevel as 'low' | 'medium' | 'high'
    )

    // Adjust timestamps based on time range
    const now = new Date()
    const timeRanges = {
      day: 1,
      week: 7,
      month: 30
    }
    
    const daysBack = timeRanges[timeRange as keyof typeof timeRanges] || 7
    
    const adjustedTransactions = transactions.map(tx => ({
      ...tx,
      timestamp: now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000,
      date: new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
    }))

    // Process each transaction through the bank API
    const processedTransactions = []
    const failedTransactions = []

    for (const transaction of adjustedTransactions) {
      try {
        // Simulate bank processing
        const bankResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fake-bank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant: transaction.merchant,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description,
            accountNumber: '1234', // Mock account number
            routingNumber: '123456789' // Mock routing number
          })
        })

        const bankResult = await bankResponse.json()

        if (bankResult.success) {
          // Process through our transaction API
          const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              accountId: finalAccountId,
              merchant: transaction.merchant,
              amount: transaction.amount,
              category: transaction.category,
              description: transaction.description,
              timestamp: transaction.timestamp
            })
          })

          const transactionResult = await transactionResponse.json()

          if (transactionResult.success) {
            processedTransactions.push(transactionResult.transaction)
          } else {
            failedTransactions.push({
              transaction,
              error: transactionResult.error
            })
          }
        } else {
          failedTransactions.push({
            transaction,
            error: bankResult.error
          })
        }

        // Add small delay between transactions to simulate real processing
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failedTransactions.push({
          transaction,
          error: 'Processing failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        requested: count,
        processed: processedTransactions.length,
        failed: failedTransactions.length
      },
      transactions: processedTransactions,
      failures: failedTransactions
    })

  } catch (error) {
    console.error('Error simulating transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to get simulation options
export async function GET() {
  return NextResponse.json({
    options: {
      incomeLevels: ['low', 'medium', 'high'],
      timeRanges: ['day', 'week', 'month'],
      maxCount: 50
    },
    examples: {
      simulateWeek: {
        method: 'POST',
        body: {
          userId: 'user_123',
          accountId: 'acc_456',
          count: 10,
          incomeLevel: 'medium',
          timeRange: 'week'
        }
      },
      simulateMonth: {
        method: 'POST',
        body: {
          userId: 'user_123',
          accountId: 'acc_456',
          count: 25,
          incomeLevel: 'high',
          timeRange: 'month'
        }
      }
    }
  })
}