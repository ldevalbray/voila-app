-- Migration: Add RLS policies for project members management
-- Step: Project members management in Settings

-- ============================================
-- 1. ADD COMMENTS TO PROJECT_MEMBERSHIPS ROLES
-- ============================================

COMMENT ON COLUMN public.project_memberships.role IS 'Role of the user in the project. Values: project_admin (lead freelancer/project owner, can manage settings, members, roles), project_participant (internal collaborator, can work on tasks, log time, etc.), project_client (client-side user, will later have restricted access in /portal)';

-- ============================================
-- 2. CREATE HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

-- Helper function to check if a user is a member of a project
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
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

-- Helper function to check if a user is admin of a project
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

-- ============================================
-- 3. RLS POLICIES FOR VIEWING PROJECT MEMBERS
-- ============================================

-- Policy: Users can view all memberships for projects where they are members
-- This allows any project member to see the list of other members
-- NOTE: We use helper functions to avoid infinite recursion in RLS policies
DROP POLICY IF EXISTS "Users can view own memberships" ON public.project_memberships;
DROP POLICY IF EXISTS "Users can view project members" ON public.project_memberships;

CREATE POLICY "Users can view project members"
  ON public.project_memberships
  FOR SELECT
  USING (
    -- Allow viewing own memberships (original policy - no recursion)
    user_id = auth.uid()
    OR
    -- Allow viewing all memberships for projects where user is a member
    -- Use helper function to avoid recursion
    public.is_project_member(project_id, auth.uid())
  );

-- ============================================
-- 4. RLS POLICIES FOR MANAGING PROJECT MEMBERS (ADMINS ONLY)
-- ============================================

-- Policy: Project admins can INSERT new memberships
DROP POLICY IF EXISTS "Project admins can add members" ON public.project_memberships;

CREATE POLICY "Project admins can add members"
  ON public.project_memberships
  FOR INSERT
  WITH CHECK (
    -- Use helper function to avoid recursion
    public.is_project_admin(project_id, auth.uid())
  );

-- Policy: Project admins can UPDATE memberships (change roles)
DROP POLICY IF EXISTS "Project admins can update members" ON public.project_memberships;

CREATE POLICY "Project admins can update members"
  ON public.project_memberships
  FOR UPDATE
  USING (
    -- Use helper function to avoid recursion
    public.is_project_admin(project_id, auth.uid())
  )
  WITH CHECK (
    -- Use helper function to avoid recursion
    public.is_project_admin(project_id, auth.uid())
  );

-- Policy: Project admins can DELETE memberships (remove members)
DROP POLICY IF EXISTS "Project admins can remove members" ON public.project_memberships;

CREATE POLICY "Project admins can remove members"
  ON public.project_memberships
  FOR DELETE
  USING (
    -- Use helper function to avoid recursion
    public.is_project_admin(project_id, auth.uid())
  );

-- ============================================
-- 5. GRANT PERMISSIONS FOR INSERT/UPDATE/DELETE
-- ============================================

GRANT INSERT, UPDATE, DELETE ON public.project_memberships TO authenticated;

-- ============================================
-- 6. RLS POLICY FOR VIEWING USERS (for member list)
-- ============================================

-- Policy: Users can view profiles of other users who are members of the same projects
-- This is needed to display member names, avatars, etc. in the members list
-- NOTE: We ADD this policy, we don't replace "Users can view own profile" which already exists
-- The existing policy "Users can view own profile" allows users to see their own profile,
-- this one extends it to see profiles of users who share projects with them
CREATE POLICY "Users can view project member profiles"
  ON public.users
  FOR SELECT
  USING (
    -- Allow viewing profiles of users who share at least one project
    -- (own profile is already covered by "Users can view own profile" policy from migration 001)
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm1
      JOIN public.project_memberships pm2 ON pm2.project_id = pm1.project_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = users.id
        AND pm1.user_id != pm2.user_id  -- Exclude own profile (already covered by other policy)
    )
  );

