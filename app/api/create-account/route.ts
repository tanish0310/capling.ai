import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, accountName = 'Main Checking', accountType = 'checking', balance = 1000.00 } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Check if user already has an account
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    if (checkError) {
      console.error('Error checking existing accounts:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing accounts' },
        { status: 500 }
      )
    }

    if (existingAccounts && existingAccounts.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already has an account',
        account: existingAccounts[0]
      })
    }

    // Create new account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert([{
        user_id: userId,
        account_name: accountName,
        account_type: accountType,
        balance: balance
      }])
      .select()
      .single()

    if (createError || !newAccount) {
      console.error('Failed to create account:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account: newAccount
    })

  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has an account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hasAccount: accounts && accounts.length > 0,
      accounts: accounts || []
    })

  } catch (error) {
    console.error('Error checking accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}