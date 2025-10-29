-- Fix the handle_new_user function to reference the correct schema
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.accounts (user_id, account_name, balance)
  VALUES (NEW.id, 'Main Checking', 3912.29);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;
