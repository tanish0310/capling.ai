import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, lessonId } = await request.json();

    if (!userId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, lessonId' },
        { status: 400 }
      );
    }

    // Check if lesson has already been read for XP
    const { data: existingRead, error: readError } = await supabase
      .from('read_lessons')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (readError && readError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking read lesson:', readError);
      return NextResponse.json(
        { error: 'Failed to check lesson read status' },
        { status: 500 }
      );
    }

    // If already read and XP awarded, return success without awarding XP again
    if (existingRead && existingRead.xp_awarded) {
      return NextResponse.json({
        success: true,
        xpAwarded: false,
        message: 'Lesson already read for XP'
      });
    }

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('title, lesson_type')
      .eq('id', lessonId)
      .eq('user_id', userId)
      .single();

    if (lessonError) {
      console.error('Error fetching lesson:', lessonError);
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Mark lesson as read (insert or update)
    const { data: readLesson, error: markError } = await supabase
      .from('read_lessons')
      .upsert([{
        user_id: userId,
        lesson_id: lessonId,
        xp_awarded: true,
        read_at: new Date().toISOString()
      }], {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();

    if (markError) {
      console.error('Error marking lesson as read:', markError);
      return NextResponse.json(
        { error: 'Failed to mark lesson as read' },
        { status: 500 }
      );
    }

    // Award XP for reading the lesson
    const xpAmount = 25;
    const description = `Read lesson: "${lesson.title}"`;

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
        event_type: 'lesson_read',
        xp_amount: xpAmount,
        description: description,
        metadata: { lessonId, lessonTitle: lesson.title, lessonType: lesson.lesson_type }
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

    // Update level data
    const { data: updatedLevelData, error: updateError } = await supabase
      .from('capling_levels')
      .update({
        total_xp: newTotalXp,
        current_xp: newCurrentXp,
        current_level: newLevel || currentLevelData.current_level,
        lessons_read: currentLevelData.lessons_read + 1
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

    // Calculate level progress
    const { data: xpForNextLevel } = await supabase
      .rpc('xp_for_current_level_progress', { total_xp: newTotalXp });

    const { data: progressPercentage } = await supabase
      .rpc('current_level_progress_percentage', { total_xp: newTotalXp });

    const leveledUp = (newLevel || 1) > currentLevelData.current_level;

    return NextResponse.json({
      success: true,
      xpAwarded: true,
      xpEvent,
      levelData: updatedLevelData,
      level: newLevel || 1,
      xp: newCurrentXp,
      totalXp: newTotalXp,
      xpForNextLevel: xpForNextLevel || 0,
      progressPercentage: progressPercentage || 0,
      leveledUp,
      previousLevel: currentLevelData.current_level,
      xpGained: xpAmount
    });

  } catch (error) {
    console.error('Error marking lesson as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}