import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, weeklyBudget } = await request.json();
    
    console.log('Updating budget:', { userId, weeklyBudget });

    if (!userId || weeklyBudget === undefined || weeklyBudget === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, weeklyBudget' },
        { status: 400 }
      );
    }

    if (isNaN(weeklyBudget) || weeklyBudget < 0) {
      return NextResponse.json(
        { error: 'Invalid budget amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update user profile with new weekly budget
    const { data: updatedProfile, error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        weekly_budget: weeklyBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Failed to update profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update budget', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('Budget updated successfully:', updatedProfile);

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}