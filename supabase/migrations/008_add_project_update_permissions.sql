-- Migration: Add UPDATE permissions and RLS policies for projects table
-- This allows project_admin users to update project settings (e.g., client_id)

-- ============================================
-- 1. GRANT UPDATE PERMISSION ON PROJECTS
-- ============================================

-- Grant UPDATE permission on projects table to authenticated users
GRANT UPDATE ON public.projects TO authenticated;

-- ============================================
-- 2. RLS POLICY FOR PROJECT UPDATES
-- ============================================

-- Policy: Only project_admin can UPDATE projects
-- This allows project admins to update project settings like client_id, name, description, etc.
CREATE POLICY "Project admins can update projects"
  ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.role = 'project_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.role = 'project_admin'
    )
  );

-- ============================================
-- 3. ADDITIONAL RLS POLICY FOR CLIENTS
-- ============================================

-- Policy: Allow internal users (project_admin, project_participant) to view all clients
-- This is useful for selecting clients when creating/updating projects
-- We keep the existing policy for backwards compatibility
CREATE POLICY "Internal users can view all clients"
  ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
      LIMIT 1
    )
  );

