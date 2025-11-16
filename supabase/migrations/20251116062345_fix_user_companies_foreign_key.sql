/*
  # Fix user_companies Foreign Key Reference
  
  ## Changes
  1. Remove foreign key constraint from auth.users
  2. Add new foreign key constraint to app_users table
  
  ## Why
  The system uses external authentication, so user IDs come from the external auth system
  and are stored in app_users, not in auth.users.
*/

-- Drop the existing foreign key constraint
ALTER TABLE user_companies 
  DROP CONSTRAINT IF EXISTS user_companies_user_id_fkey;

-- Add new foreign key constraint to app_users
ALTER TABLE user_companies 
  ADD CONSTRAINT user_companies_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES app_users(id) 
  ON DELETE CASCADE;
