-- Add missing columns to the existing goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🎯',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'savings',
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Update the target_date column to be nullable if it isn't already
ALTER TABLE public.goals ALTER COLUMN target_date DROP NOT NULL;