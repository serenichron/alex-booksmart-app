-- Fix handle_new_user trigger to match current profiles table schema
-- The profiles table has: user_id, first_name, last_name (not id, email, full_name, avatar_url)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that matches current profiles schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with correct columns: user_id, first_name, last_name
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,  -- user_id references auth.users(id)
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
