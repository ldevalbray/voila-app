-- Migration: Create time_entries table for time tracking
-- Step 5: Time tracking & Time ledger

-- ============================================
-- 1. TIME_ENTRIES TABLE
-- ============================================
-- Time entries track work done on projects and optionally on tasks.
-- Duration is stored in minutes (canonical unit) to avoid ambiguity.
-- Categories are a fixed set of codes: project_management, development, documentation, maintenance_evolution.
-- 
-- Note: If task_id is set, the application should ensure that tasks.project_id = time_entries.project_id.
-- This constraint is enforced at the application level for Step 5.

CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('project_management', 'development', 'documentation', 'maintenance_evolution')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on time_entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS time_entries_project_id_idx ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS time_entries_task_id_idx ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON public.time_entries(date);
CREATE INDEX IF NOT EXISTS time_entries_category_idx ON public.time_entries(category);

-- Composite index for common queries (project + date range)
CREATE INDEX IF NOT EXISTS time_entries_project_date_idx ON public.time_entries(project_id, date);

-- Trigger: Update updated_at on time_entries table updates
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. RLS POLICIES FOR TIME_ENTRIES
-- ============================================

-- Policy: Users can SELECT time entries for projects they are members of
-- This allows any project member (internal or client) to view all time entries of that project.
CREATE POLICY "Users can view time entries for accessible projects"
  ON public.time_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT their own time entries for projects they are members of
-- For Step 5, we simplify: user_id must equal auth.uid() for INSERT.
-- Future: project admins/participants could insert entries for others.
CREATE POLICY "Users can create their own time entries"
  ON public.time_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: Users can UPDATE their own time entries
-- Additionally, project admins/participants can update any time entry in their project.
CREATE POLICY "Users can update their own time entries or admins can update any"
  ON public.time_entries
  FOR UPDATE
  USING (
    -- User owns the entry
    (time_entries.user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
    ))
    OR
    -- User is project admin/participant
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  )
  WITH CHECK (
    -- Same checks for WITH CHECK
    (time_entries.user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
    ))
    OR
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Users can DELETE their own time entries
-- Additionally, project admins/participants can delete any time entry in their project.
CREATE POLICY "Users can delete their own time entries or admins can delete any"
  ON public.time_entries
  FOR DELETE
  USING (
    -- User owns the entry
    (time_entries.user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
    ))
    OR
    -- User is project admin/participant
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = time_entries.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

