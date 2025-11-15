import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
interface LessonGenerationRequest {
  userId: string;
  forceGenerate?: boolean; // For testing purposes
}

interface Lesson {
  title: string;
  content: string;
  lesson_type: 'tip' | 'vocabulary' | 'concept';
  topic: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { userId, forceGenerate = false }: LessonGenerationRequest = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Check if user already has a lesson for today
    if (!forceGenerate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingLessons, error: checkError } = await supabase
        .from('lessons')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (checkError) {
        console.error('Error checking existing lessons:', checkError);
        return NextResponse.json(
          { error: 'Failed to check existing lessons' },
          { status: 500 }
        );
      }

      if (existingLessons && existingLessons.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Lesson already exists for today',
          lesson: existingLessons[0]
        });
      }
    }

    // Get all existing lesson topics to avoid duplicates
    const { data: existingLessons, error: topicsError } = await supabase
      .from('lessons')
      .select('topic, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (topicsError) {
      console.error('Error fetching existing topics:', topicsError);
      return NextResponse.json(
        { error: 'Failed to fetch existing topics' },
        { status: 500 }
      );
    }

    const existingTopics = existingLessons?.map(lesson => lesson.topic) || [];
    const existingTitles = existingLessons?.map(lesson => lesson.title) || [];

    // Generate lesson using LLM
    const lesson = await generateLessonWithLLM(existingTopics, existingTitles);

    if (!lesson) {
      return NextResponse.json(
        { error: 'Failed to generate lesson' },
        { status: 500 }
      );
    }

    // Save lesson to database
    const { data: newLesson, error: insertError } = await supabase
      .from('lessons')
      .insert([{
        user_id: userId,
        title: lesson.title,
        content: lesson.content,
        lesson_type: lesson.lesson_type,
        topic: lesson.topic,
        difficulty_level: lesson.difficulty_level
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error saving lesson:', insertError);
      return NextResponse.json(
        { error: 'Failed to save lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson: newLesson,
      message: 'Daily lesson generated successfully'
    });

  } catch (error) {
    console.error('Error generating daily lesson:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateLessonWithLLM(existingTopics: string[], existingTitles: string[]): Promise<Lesson | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found');
      return null;
    }

    const existingTopicsText = existingTopics.length > 0 
      ? `\n\nAVOID these topics (already covered): ${existingTopics.join(', ')}`
      : '';
    
    const existingTitlesText = existingTitles.length > 0
      ? `\n\nAVOID these titles (already used): ${existingTitles.slice(0, 10).join(', ')}`
      : '';

    const prompt = `You are a financial literacy expert creating daily lessons for a personal finance app called Capling. 

Generate ONE unique financial literacy lesson that is:
- Educational and practical
- Easy to understand
- Actionable for daily life
- Engaging and encouraging

${existingTopicsText}${existingTitlesText}

Choose ONE lesson type:
- "tip": A practical financial tip or strategy
- "vocabulary": A financial term with clear explanation and examples
- "concept": A fundamental financial concept explained simply

Choose ONE difficulty level:
- "beginner": Basic concepts, simple language
- "intermediate": More detailed explanations, some financial knowledge assumed
- "advanced": Complex topics, requires good financial understanding

Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Short, engaging title (max 60 characters)",
  "content": "Detailed lesson content (200-400 words). Include practical examples and actionable advice. Be encouraging and supportive.",
  "lesson_type": "tip|vocabulary|concept",
  "topic": "Main topic category (e.g., 'budgeting', 'investing', 'debt management', 'saving')",
  "difficulty_level": "beginner|intermediate|advanced"
}

Make it unique, practical, and helpful for someone learning personal finance.`;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
      }
    })

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const content = response.text()

    if (!content) {
      console.error('No content in Gemini response');
      return null;
    }

    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('No JSON found in response');
        return null;
      }
      
      const lesson = JSON.parse(jsonMatch[0]) as Lesson;
      
      // Validate the lesson structure
      if (!lesson.title || !lesson.content || !lesson.lesson_type || !lesson.topic || !lesson.difficulty_level) {
        console.error('Invalid lesson structure:', lesson);
        return null;
      }

      return lesson;
    } catch (parseError) {
      console.error('Failed to parse lesson JSON:', parseError);
      console.error('Raw content:', content);
      return null;
    }

  } catch (error) {
    console.error('Error generating lesson with LLM:', error);
    return null;
  }
}