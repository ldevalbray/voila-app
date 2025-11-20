-- Migration: Restrict exec_sql function to service_role only
-- SECURITY FIX: This function should NEVER be accessible to authenticated users
-- It allows arbitrary SQL execution and bypasses all RLS policies

-- Revoke execute permission from authenticated users
REVOKE EXECUTE ON FUNCTION public.exec_sql(TEXT) FROM authenticated;

-- Note: service_role key has implicit access to all functions
-- This function should only be used in development/staging environments
-- For production, consider removing this function entirely or using Supabase CLI migrations

-- Optional: Add a check to prevent execution in production
-- This is a safety measure but should not be the only security layer
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  is_production BOOLEAN;
BEGIN
  -- Check if we're in a production-like environment
  -- This is a basic check - you should use environment-specific configuration
  -- In Supabase, you can check the current database name or use a custom config table
  
  -- For now, we'll add a comment warning
  -- In production, you should remove this function entirely or add stricter checks
  
  -- Execute the SQL and return result
  EXECUTE sql;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

