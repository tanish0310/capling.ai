-- Create lessons table for financial literacy content
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('tip', 'vocabulary', 'concept')),
  topic TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_lessons_user_id ON lessons(user_id);
CREATE INDEX idx_lessons_created_at ON lessons(created_at DESC);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lessons" ON lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lessons" ON lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons" ON lessons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons" ON lessons
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_lessons_updated_at();