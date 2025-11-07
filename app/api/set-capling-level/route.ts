import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, level, totalXp, currentXp } = await request.json();

    if (!userId || !level || totalXp === undefined || currentXp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, level, totalXp, currentXp' },
        { status: 400 }
      );
    }

    // Validate level range
    if (level < 1 || level > 50) {
      return NextResponse.json(
        { error: 'Level must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Check if capling_levels record exists
    const { data: existingLevel, error: fetchError } = await supabase
      .from('capling_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching capling level:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch capling level' },
        { status: 500 }
      );
    }

    // Update or create the level record
    const { data: levelData, error: upsertError } = await supabase
      .from('capling_levels')
      .upsert([{
        user_id: userId,
        current_level: level,
        total_xp: totalXp,
        current_xp: currentXp,
        lessons_read: existingLevel?.lessons_read || 0,
        consecutive_happy_days: existingLevel?.consecutive_happy_days || 0,
        last_happiness_check: existingLevel?.last_happiness_check || new Date().toISOString()
      }], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error setting capling level:', upsertError);
      return NextResponse.json(
        { error: 'Failed to set capling level' },
        { status: 500 }
      );
    }

    // Calculate level progress
    const { data: xpForNextLevel } = await supabase
      .rpc('xp_for_current_level_progress', { total_xp: totalXp });

    const { data: progressPercentage } = await supabase
      .rpc('current_level_progress_percentage', { total_xp: totalXp });

    return NextResponse.json({
      success: true,
      levelData,
      level: level,
      xp: currentXp,
      totalXp: totalXp,
      xpForNextLevel: xpForNextLevel || 0,
      progressPercentage: progressPercentage || 0
    });

  } catch (error) {
    console.error('Error setting capling level:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}