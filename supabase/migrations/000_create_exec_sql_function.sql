-- Migration: Create exec_sql RPC function for running migrations via API
-- This function allows executing SQL via the Supabase REST API
-- SECURITY WARNING: This function should only be accessible with service_role key

CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
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

-- Grant execute permission to authenticated users (or restrict to service_role only)
-- For security, you might want to restrict this to service_role only
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;

