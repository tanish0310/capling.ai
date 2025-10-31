import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, caplingName } = await request.json();

    if (!userId || !caplingName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, caplingName' },
        { status: 400 }
      );
    }

    // Validate capling name (basic validation)
    if (caplingName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Capling name cannot be empty' },
        { status: 400 }
      );
    }

    if (caplingName.length > 50) {
      return NextResponse.json(
        { error: 'Capling name must be 50 characters or less' },
        { status: 400 }
      );
    }

    // Update the capling name in user_profiles
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ capling_name: caplingName.trim() })
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      console.error('Failed to update capling name:', updateError);
      return NextResponse.json(
        { error: 'Failed to update Capling name', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      caplingName: updatedProfile.capling_name 
    });
  } catch (error) {
    console.error('Error updating capling name:', error);
    return NextResponse.json({ error: 'Failed to update Capling name' }, { status: 500 });
  }
}