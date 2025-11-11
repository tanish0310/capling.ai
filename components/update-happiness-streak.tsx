import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, mood } = await request.json();

    if (!userId || !mood) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, mood' },
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
          lessons_read: 0,
          last_happiness_check: new Date().toISOString()
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

    const now = new Date();
    const lastCheck = new Date(currentLevelData.last_happiness_check);
    const daysSinceLastCheck = Math.floor((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));

    let newConsecutiveHappyDays = currentLevelData.consecutive_happy_days;
    let xpToAdd = 0;

    // Only update if it's a new day (or first time)
    if (daysSinceLastCheck >= 1) {
      if (mood === 'happy') {
        // Increment happy days
        newConsecutiveHappyDays += 1;
        
        // Award XP for happiness streak milestones
        if (newConsecutiveHappyDays === 1) {
          xpToAdd = 10; // First happy day
        } else if (newConsecutiveHappyDays === 3) {
          xpToAdd = 20; // 3-day streak
        } else if (newConsecutiveHappyDays === 7) {
          xpToAdd = 50; // Week streak
        } else if (newConsecutiveHappyDays === 14) {
          xpToAdd = 100; // Two week streak
        } else if (newConsecutiveHappyDays === 30) {
          xpToAdd = 200; // Month streak
        } else if (newConsecutiveHappyDays % 7 === 0) {
          xpToAdd = 25; // Weekly bonus
        } else {
          xpToAdd = 5; // Daily happy bonus
        }
      } else {
        // Reset streak if not happy
        newConsecutiveHappyDays = 0;
      }

      // Update the level data
      const newTotalXp = currentLevelData.total_xp + xpToAdd;
      const newCurrentXp = currentLevelData.current_xp + xpToAdd;

      // Calculate new level
      const { data: newLevel } = await supabase
        .rpc('calculate_level_from_xp', { total_xp: newTotalXp });

      const { data: updatedLevelData, error: updateError } = await supabase
        .from('capling_levels')
        .update({
          total_xp: newTotalXp,
          current_xp: newCurrentXp,
          current_level: newLevel || currentLevelData.current_level,
          consecutive_happy_days: newConsecutiveHappyDays,
          last_happiness_check: now.toISOString()
        })
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

      // Add XP event if XP was awarded
      if (xpToAdd > 0) {
        await supabase
          .from('xp_events')
          .insert([{
            user_id: userId,
            event_type: 'happiness_streak',
            xp_amount: xpToAdd,
            description: `Kept Capling happy for ${newConsecutiveHappyDays} days`,
            metadata: { 
              mood, 
              consecutive_days: newConsecutiveHappyDays,
              streak_milestone: newConsecutiveHappyDays === 1 || newConsecutiveHappyDays === 3 || newConsecutiveHappyDays === 7 || newConsecutiveHappyDays === 14 || newConsecutiveHappyDays === 30
            }
          }]);
      }

      return NextResponse.json({
        success: true,
        consecutiveHappyDays: newConsecutiveHappyDays,
        xpAwarded: xpToAdd,
        levelData: updatedLevelData,
        leveledUp: (newLevel || 1) > currentLevelData.current_level,
        previousLevel: currentLevelData.current_level,
        newLevel: newLevel || 1
      });
    } else {
      // Same day, just return current data
      return NextResponse.json({
        success: true,
        consecutiveHappyDays: currentLevelData.consecutive_happy_days,
        xpAwarded: 0,
        levelData: currentLevelData,
        leveledUp: false,
        previousLevel: currentLevelData.current_level,
        newLevel: currentLevelData.current_level
      });
    }

  } catch (error) {
    console.error('Error updating happiness streak:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}