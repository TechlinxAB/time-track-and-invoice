
-- Function to safely get the count of users in auth.users table
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Try to get the count from auth.users (requires proper permissions)
  BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RETURN user_count;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error (like permissions), fall back to profiles count
    BEGIN
      SELECT COUNT(*) INTO user_count FROM public.profiles;
      RETURN user_count;
    EXCEPTION WHEN OTHERS THEN
      -- If both methods fail, return -1 to indicate error
      RETURN -1;
    END;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set proper ownership and permissions for the function
COMMENT ON FUNCTION public.get_user_count() IS 'Counts users in the system, for first-user detection';

