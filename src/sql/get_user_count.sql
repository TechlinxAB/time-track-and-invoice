
-- Function to safely get the count of users in auth.users table
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
EXCEPTION WHEN OTHERS THEN
  -- If there's an error (like permissions), return -1
  RETURN -1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
