import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface XPEvent {
  eventType: 'happiness_streak' | 'lesson_read' | 'responsible_purchase' | 'goal_achieved' | 'daily_bonus';
  xpAmount: number;
  description: string;
  metadata?: any;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get user's current level and XP
    const { data: levelData, error: levelError } = await supabase
      .from('capling_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (levelError && levelError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching capling level:', levelError);
      return NextResponse.json(
        { error: 'Failed to fetch capling level' },
        { status: 500 }
      );
    }

    // If no level data exists, create initial level
    if (!levelData) {
      const { data: newLevelData, error: createError } = await supabase
        .from('capling_levels')
        .insert([{
          user_id: userId,
          current_level: 1,
          current_xp: 0,
          total_xp: 0,
          consecutive_happy_days: 0,
          lessons_read: 0
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating initial capling level:', createError);
        return NextResponse.json(
          { error: 'Failed to create initial capling level' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        levelData: newLevelData,
        level: newLevelData.current_level,
        xp: newLevelData.current_xp,
        totalXp: newLevelData.total_xp,
        consecutiveHappyDays: newLevelData.consecutive_happy_days,
        lessonsRead: newLevelData.lessons_read
      });
    }

    // Calculate level from total XP
    const { data: calculatedLevel } = await supabase
      .rpc('calculate_level_from_xp', { total_xp: levelData.total_xp });

    const { data: xpForNextLevel } = await supabase
      .rpc('xp_for_current_level_progress', { total_xp: levelData.total_xp });

    const { data: progressPercentage } = await supabase
      .rpc('current_level_progress_percentage', { total_xp: levelData.total_xp });

    return NextResponse.json({
      success: true,
      levelData,
      level: calculatedLevel || levelData.current_level,
      xp: levelData.current_xp,
      totalXp: levelData.total_xp,
      consecutiveHappyDays: levelData.consecutive_happy_days,
      lessonsRead: levelData.lessons_read,
      xpForNextLevel: xpForNextLevel || 0,
      progressPercentage: progressPercentage || 0
    });

  } catch (error) {
    console.error('Error in capling-levels API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, eventType, xpAmount, description, metadata }: { userId: string } & XPEvent = await request.json();

    if (!userId || !eventType || !xpAmount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, eventType, xpAmount, description' },
        { status: 400 }
      );
    }

    // Get current level data
    const { data: levelData, error: levelError } = await supabase
      .from('capling_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (levelError && levelError.code !== 'PGRST116') {
      console.error('Error fetching capling level:', levelError);
      return NextResponse.json(
        { error: 'Failed to fetch capling level' },
        { status: 500 }
      );
    }

    // Create initial level if doesn't exist
    let currentLevelData = levelData;
    if (!levelData) {
      const { data: newLevelData, error: createError } = await supabase
        .from('capling_levels')
        .insert([{
          user_id: userId,
          current_level: 1,
          current_xp: 0,
          total_xp: 0,
          consecutive_happy_days: 0,
          lessons_read: 0
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating initial capling level:', createError);
        return NextResponse.json(
          { error: 'Failed to create initial capling level' },
          { status: 500 }
        );
      }

      currentLevelData = newLevelData;
    }

    // Add XP event
    const { data: xpEvent, error: xpEventError } = await supabase
      .from('xp_events')
      .insert([{
        user_id: userId,
        event_type: eventType,
        xp_amount: xpAmount,
        description: description,
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (xpEventError) {
      console.error('Error creating XP event:', xpEventError);
      return NextResponse.json(
        { error: 'Failed to create XP event' },
        { status: 500 }
      );
    }

    // Update level data
    const newTotalXp = currentLevelData.total_xp + xpAmount;
    const newCurrentXp = currentLevelData.current_xp + xpAmount;

    // Calculate new level
    const { data: newLevel } = await supabase
      .rpc('calculate_level_from_xp', { total_xp: newTotalXp });

    // Update specific fields based on event type
    const updateData: any = {
      total_xp: newTotalXp,
      current_xp: newCurrentXp,
      current_level: newLevel || currentLevelData.current_level
    };

    if (eventType === 'lesson_read') {
      updateData.lessons_read = currentLevelData.lessons_read + 1;
    }

    const { data: updatedLevelData, error: updateError } = await supabase
      .from('capling_levels')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating capling level:', updateError);
      return NextResponse.json(
        { error: 'Failed to update capling level' },
        { status: 500 }
      );
    }

    // Calculate level progress
    const { data: xpForNextLevel } = await supabase
      .rpc('xp_for_current_level_progress', { total_xp: newTotalXp });

    const { data: progressPercentage } = await supabase
      .rpc('current_level_progress_percentage', { total_xp: newTotalXp });

    const leveledUp = (newLevel || 1) > currentLevelData.current_level;

    return NextResponse.json({
      success: true,
      xpEvent,
      levelData: updatedLevelData,
      level: newLevel || 1,
      xp: newCurrentXp,
      totalXp: newTotalXp,
      xpForNextLevel: xpForNextLevel || 0,
      progressPercentage: progressPercentage || 0,
      leveledUp,
      previousLevel: currentLevelData.current_level
    });

  } catch (error) {
    console.error('Error adding XP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}