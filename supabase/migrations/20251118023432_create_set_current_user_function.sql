/*
  # Create set_current_user function

  1. New Functions
    - `set_current_user` - Sets the current user ID in the session for RLS policies
    
  2. Security
    - Allows authenticated users to set their user context
    - Required for storage RLS policies to work with external auth
*/

-- Function to set current user ID in session
CREATE OR REPLACE FUNCTION set_current_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$;