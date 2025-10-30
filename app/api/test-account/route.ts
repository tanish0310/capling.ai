import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing account creation for user:', userId)

    // Check if user already has an account
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)

    console.log('📊 Existing accounts check:', { existingAccounts, checkError })

    if (checkError) {
      console.error('❌ Error checking existing accounts:', checkError)
      return NextResponse.json(
        { 
          error: 'Failed to check existing accounts',
          details: checkError.message
        },
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

    // Try to create a new account
    console.log('💾 Creating new account...')
    
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert([{
        user_id: userId,
        account_name: 'Main Checking',
        account_type: 'checking',
        balance: 1000.00
      }])
      .select()
      .single()

    console.log('📊 Account creation result:', { newAccount, createError })

    if (createError) {
      console.error('❌ Failed to create account:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create account',
          details: createError.message,
          code: createError.code,
          hint: createError.hint
        },
        { status: 500 }
      )
    }

    if (!newAccount) {
      return NextResponse.json(
        { error: 'Account creation returned no data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account: newAccount
    })

  } catch (error) {
    console.error('❌ Error in test account:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}