
-- This trigger makes the first registered user an admin
CREATE OR REPLACE FUNCTION public.check_first_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- If this is the first user (count is 0 before insert)
  IF user_count = 0 THEN
    -- Make this user an admin
    NEW.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply this trigger before insert on profiles
DROP TRIGGER IF EXISTS on_profile_create_check_first ON public.profiles;
CREATE TRIGGER on_profile_create_check_first
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_first_user();
