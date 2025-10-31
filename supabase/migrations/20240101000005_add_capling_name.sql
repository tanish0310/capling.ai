-- Add capling_name field to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN capling_name TEXT DEFAULT 'Capling';

-- Update the handle_new_user function to include capling_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, capling_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    'Capling'
  );
  
  INSERT INTO public.accounts (user_id, account_name, account_type, balance)
  VALUES (NEW.id, 'Main Checking', 'checking', 3912.29);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;