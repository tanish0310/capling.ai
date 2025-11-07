-- Create capling_levels table for tracking user's Capling level and XP
CREATE TABLE capling_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  last_happiness_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  consecutive_happy_days INTEGER NOT NULL DEFAULT 0,
  lessons_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create xp_events table for tracking XP earning history
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('happiness_streak', 'lesson_read', 'responsible_purchase', 'goal_achieved', 'daily_bonus')),
  xp_amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create read_lessons table to track which lessons have been read for XP
CREATE TABLE read_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  xp_awarded BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_capling_levels_user_id ON capling_levels(user_id);
CREATE INDEX idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX idx_xp_events_created_at ON xp_events(created_at DESC);
CREATE INDEX idx_read_lessons_user_id ON read_lessons(user_id);
CREATE INDEX idx_read_lessons_lesson_id ON read_lessons(lesson_id);

-- Enable RLS
ALTER TABLE capling_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for capling_levels
CREATE POLICY "Users can view their own capling levels" ON capling_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capling levels" ON capling_levels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capling levels" ON capling_levels
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for xp_events
CREATE POLICY "Users can view their own xp events" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp events" ON xp_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for read_lessons
CREATE POLICY "Users can view their own read lessons" ON read_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read lessons" ON read_lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read lessons" ON read_lessons
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_capling_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_capling_levels_updated_at
  BEFORE UPDATE ON capling_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_capling_levels_updated_at();

-- Create function to calculate level from total XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(total_xp / 50) + 1
  -- This means:
  -- Level 1: 0-49 XP
  -- Level 2: 50-99 XP  
  -- Level 3: 100-149 XP
  -- Level 4: 150-199 XP
  -- Level 5: 200-249 XP
  -- Level 10: 450-499 XP
  -- Level 20: 950-999 XP
  -- etc.
  RETURN FLOOR(total_xp / 50.0) + 1;
END;
$$ language 'plpgsql';

-- Create function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION xp_needed_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- XP needed = (level - 1) * 50
  RETURN (level - 1) * 50;
END;
$$ language 'plpgsql';

-- Create function to calculate XP needed for current level progress
CREATE OR REPLACE FUNCTION xp_for_current_level_progress(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_level INTEGER;
  xp_for_current_level INTEGER;
  xp_for_next_level INTEGER;
BEGIN
  current_level := calculate_level_from_xp(total_xp);
  xp_for_current_level := xp_needed_for_level(current_level);
  xp_for_next_level := xp_needed_for_level(current_level + 1);
  
  RETURN xp_for_next_level - xp_for_current_level;
END;
$$ language 'plpgsql';

-- Create function to calculate current level progress percentage
CREATE OR REPLACE FUNCTION current_level_progress_percentage(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_level INTEGER;
  xp_for_current_level INTEGER;
  xp_for_next_level INTEGER;
  current_level_xp INTEGER;
BEGIN
  current_level := calculate_level_from_xp(total_xp);
  xp_for_current_level := xp_needed_for_level(current_level);
  xp_for_next_level := xp_needed_for_level(current_level + 1);
  current_level_xp := total_xp - xp_for_current_level;
  
  RETURN ROUND((current_level_xp::FLOAT / (xp_for_next_level - xp_for_current_level)) * 100);
END;
$$ language 'plpgsql';