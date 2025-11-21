-- Migration: Fix login issue caused by migration 011
-- This migration fixes the RLS policies that were preventing users from logging in
-- The issue was infinite recursion in RLS policies that queried the same table they protect

-- ============================================
-- 1. CREATE HELPER FUNCTION TO CHECK MEMBERSHIP (SECURITY DEFINER)
-- ============================================

-- This function bypasses RLS to check if a user is a member of a project
-- It's safe because it only checks membership, doesn't modify data
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_memberships
    WHERE project_id = project_uuid
      AND user_id = user_uuid
  );
END;
$$;

-- ============================================
-- 2. FIX PROJECT_MEMBERSHIPS POLICY (NO RECURSION)
-- ============================================

-- Drop all potentially problematic policies
DROP POLICY IF EXISTS "Users can view own memberships" ON public.project_memberships;
DROP POLICY IF EXISTS "Users can view project members" ON public.project_memberships;

-- Create a new policy that uses the helper function to avoid recursion
CREATE POLICY "Users can view project members"
  ON public.project_memberships
  FOR SELECT
  USING (
    -- Allow viewing own memberships (no recursion, direct check)
    user_id = auth.uid()
    OR
    -- Allow viewing all memberships for projects where user is a member
    -- Use the helper function to avoid recursion
    public.is_project_member(project_id, auth.uid())
  );

-- ============================================
-- 3. FIX ADMIN POLICIES (USE HELPER FUNCTION)
-- ============================================

-- Drop admin policies that might have recursion issues
DROP POLICY IF EXISTS "Project admins can add members" ON public.project_memberships;
DROP POLICY IF EXISTS "Project admins can update members" ON public.project_memberships;
DROP POLICY IF EXISTS "Project admins can remove members" ON public.project_memberships;

-- Helper function to check if user is admin of a project
CREATE OR REPLACE FUNCTION public.is_project_admin(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_memberships
    WHERE project_id = project_uuid
      AND user_id = user_uuid
      AND role = 'project_admin'
  );
END;
$$;

-- Recreate admin policies using the helper function
CREATE POLICY "Project admins can add members"
  ON public.project_memberships
  FOR INSERT
  WITH CHECK (
    public.is_project_admin(project_id, auth.uid())
  );

CREATE POLICY "Project admins can update members"
  ON public.project_memberships
  FOR UPDATE
  USING (
    public.is_project_admin(project_id, auth.uid())
  )
  WITH CHECK (
    public.is_project_admin(project_id, auth.uid())
  );

CREATE POLICY "Project admins can remove members"
  ON public.project_memberships
  FOR DELETE
  USING (
    public.is_project_admin(project_id, auth.uid())
  );

-- ============================================
-- 4. ENSURE USERS TABLE POLICY EXISTS
-- ============================================

-- Ensure the "Users can view own profile" policy exists
-- This is critical for login to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

