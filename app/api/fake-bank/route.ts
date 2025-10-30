import { NextRequest, NextResponse } from 'next/server'

// Simulate different types of bank transactions
interface BankTransaction {
  id: string
  merchant: string
  amount: number
  category: string
  description: string
  timestamp: number
  status: 'pending' | 'completed' | 'failed'
  bank_reference: string
}

// Simulate bank processing delays and responses
const simulateBankProcessing = async (transaction: Omit<BankTransaction, 'id' | 'status' | 'bank_reference'>) => {
  // Simulate network delay (100-500ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100))
  
  // Simulate occasional failures (5% chance)
  const shouldFail = Math.random() < 0.05
  
  if (shouldFail) {
    return {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      status: 'failed' as const,
      bank_reference: null
    }
  }
  
  // Generate bank reference number
  const bankReference = `BANK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  
  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...transaction,
    status: 'completed' as const,
    bank_reference: bankReference
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      merchant, 
      amount, 
      category, 
      description,
      accountNumber,
      routingNumber 
    } = body

    // Validate required fields
    if (!merchant || !amount || !accountNumber || !routingNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount, accountNumber, routingNumber' },
        { status: 400 }
      )
    }

    // Simulate bank validation
    if (accountNumber.length < 4 || routingNumber.length !== 9) {
      return NextResponse.json(
        { error: 'Invalid account or routing number' },
        { status: 400 }
      )
    }

    // Create transaction object
    const transaction = {
      merchant,
      amount: Math.abs(amount),
      category: category || 'shopping',
      description: description || merchant,
      timestamp: Date.now()
    }

    // Simulate bank processing
    const result = await simulateBankProcessing(transaction)

    if (result.status === 'failed') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction failed - insufficient funds or network error',
          transaction: result
        },
        { status: 402 } // Payment required
      )
    }

    // Return successful transaction
    return NextResponse.json({
      success: true,
      transaction: result,
      message: 'Transaction processed successfully'
    })

  } catch (error) {
    console.error('Error processing bank transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to simulate bank account lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountNumber = searchParams.get('accountNumber')
    const routingNumber = searchParams.get('routingNumber')

    if (!accountNumber || !routingNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: accountNumber, routingNumber' },
        { status: 400 }
      )
    }

    // Simulate bank lookup delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

    // Simulate account validation
    if (accountNumber.length < 4 || routingNumber.length !== 9) {
      return NextResponse.json(
        { error: 'Invalid account or routing number' },
        { status: 404 }
      )
    }

    // Return mock account info
    return NextResponse.json({
      success: true,
      account: {
        accountNumber: `****${accountNumber.slice(-4)}`,
        routingNumber,
        bankName: 'Demo Bank',
        accountType: 'Checking',
        status: 'active'
      }
    })

  } catch (error) {
    console.error('Error looking up account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}