
-- This trigger makes the first registered user an admin
CREATE OR REPLACE FUNCTION public.check_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user being inserted into the profiles table
  -- Supabase has a built-in auth.users table which this trigger checks
  IF (SELECT COUNT(*) FROM auth.users) <= 1 THEN
    -- Make this user an admin
    NEW.role = 'admin';
    -- Ensure we have full name data
    IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
      NEW.full_name = COALESCE(NEW.email, 'Administrator');
    END IF;
  END IF;
  
  -- Also check if the user has the is_admin_setup flag from the setup page
  -- This handles race conditions if multiple users register simultaneously
  DECLARE
    is_admin_setup BOOLEAN;
  BEGIN
    SELECT raw_user_meta_data->>'is_admin_setup' = 'true' INTO is_admin_setup
    FROM auth.users 
    WHERE id = NEW.id;
    
    IF is_admin_setup THEN
      NEW.role = 'admin';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If error reading metadata, fall back to previous logic
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply this trigger before insert on profiles
DROP TRIGGER IF EXISTS on_profile_create_check_first ON public.profiles;
CREATE TRIGGER on_profile_create_check_first
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_first_user();
