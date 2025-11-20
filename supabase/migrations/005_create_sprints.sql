-- Migration: Create sprints table and add sprint_id to tasks
-- Step 4: Sprints & Sprint picker

-- ============================================
-- 1. SPRINTS TABLE
-- ============================================
-- Sprints are time-boxed work periods within a project.
-- Each project can have multiple sprints, but only one should be 'active' at a time.
-- The application logic should enforce this constraint (not enforced at DB level for Step 4).

CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled', 'archived')),
  start_date DATE,
  end_date DATE,
  sort_index INTEGER,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on sprints
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS sprints_project_id_idx ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS sprints_status_idx ON public.sprints(status);
CREATE INDEX IF NOT EXISTS sprints_start_date_idx ON public.sprints(start_date);

-- Trigger: Update updated_at on sprints table updates
CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. ADD SPRINT_ID TO TASKS TABLE
-- ============================================
-- Link tasks to sprints. A task belongs to at most one sprint.
-- The sprint_id must refer to a sprint of the same project as the task.
-- This constraint is enforced at the application level for Step 4.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS tasks_sprint_id_idx ON public.tasks(sprint_id);

-- ============================================
-- 3. RLS POLICIES FOR SPRINTS
-- ============================================

-- Policy: Users can SELECT sprints for projects they are members of
-- This allows any project member (internal or client) to view sprints.
CREATE POLICY "Users can view sprints for accessible projects"
  ON public.sprints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = sprints.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Only Internal roles (project_admin, project_participant) can INSERT sprints
CREATE POLICY "Internal users can create sprints"
  ON public.sprints
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = sprints.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
    AND created_by = auth.uid()
  );

-- Policy: Only Internal roles can UPDATE sprints
CREATE POLICY "Internal users can update sprints"
  ON public.sprints
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = sprints.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = sprints.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Only Internal roles can DELETE sprints
CREATE POLICY "Internal users can delete sprints"
  ON public.sprints
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = sprints.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

