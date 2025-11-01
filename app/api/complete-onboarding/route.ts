import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, weeklyBudget, initialBalance, goals } = await request.json();
    
    console.log('Received onboarding data:', { userId, weeklyBudget, initialBalance, goals });
    console.log('Goals type:', typeof goals);
    console.log('Goals is array:', Array.isArray(goals));
    console.log('Goals length:', goals?.length);

    if (!userId || !weeklyBudget || initialBalance === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, weeklyBudget, initialBalance' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update user profile with weekly budget
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        weekly_budget: parseFloat(weeklyBudget)
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Update the account balance (the account was created by the trigger with a default balance)
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: parseFloat(initialBalance) })
      .eq('user_id', userId)
      .eq('account_name', 'Main Checking');

    if (accountError) {
      console.error('Error updating account balance:', accountError);
      return NextResponse.json(
        { error: 'Failed to update account balance', details: accountError.message },
        { status: 500 }
      );
    }

    // Create goals if any
    if (goals && Array.isArray(goals) && goals.length > 0) {
      console.log('Creating goals:', goals);
      const goalsData = goals.map((goal: any) => ({
        user_id: userId,
        title: goal.title,
        target_amount: goal.targetAmount,
        current_amount: 0,
        category: goal.category,
        emoji: goal.emoji,
        is_completed: false
      }));

      console.log('Goals data to insert:', goalsData);

      const { data: insertedGoals, error: goalsError } = await supabase
        .from('goals')
        .insert(goalsData)
        .select();

      if (goalsError) {
        console.error('Error creating goals:', goalsError);
        return NextResponse.json(
          { error: 'Failed to create goals', details: goalsError.message },
          { status: 500 }
        );
      }

      console.log('Goals created successfully:', insertedGoals);
    } else {
      console.log('No goals to create');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}