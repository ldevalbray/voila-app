-- Migration: Create epics, tasks, and task_assignees tables
-- Step 3: Epics & Tasks V1

-- ============================================
-- 1. EPICS TABLE
-- ============================================
-- Epics are high-level features or work items that group related tasks.
-- They are linked to projects and can have a status (open, in_progress, done, archived).

CREATE TABLE IF NOT EXISTS public.epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'archived')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on epics
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epics TO authenticated;

-- Index for faster project-based queries
CREATE INDEX IF NOT EXISTS epics_project_id_idx ON public.epics(project_id);
CREATE INDEX IF NOT EXISTS epics_status_idx ON public.epics(status);

-- Trigger: Update updated_at on epics table updates
CREATE TRIGGER update_epics_updated_at
  BEFORE UPDATE ON public.epics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. TASKS TABLE
-- ============================================
-- Tasks are work items that can be linked to an epic and assigned to users.
-- They have a type (bug, new_feature, improvement), status, priority, and estimate bucket.

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('bug', 'new_feature', 'improvement')),
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'waiting_for_client', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimate_bucket TEXT CHECK (estimate_bucket IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  is_client_visible BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_epic_id_idx ON public.tasks(epic_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_type_idx ON public.tasks(type);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_is_client_visible_idx ON public.tasks(is_client_visible);

-- Trigger: Update updated_at on tasks table updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. TASK_ASSIGNEES TABLE (many-to-many)
-- ============================================
-- This table allows multiple users to be assigned to a task.
-- Note: Application-level validation should ensure that assignees are project members.
-- This constraint is documented but not enforced at the database level for Step 3.

CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (task_id, user_id)
);

-- Enable RLS on task_assignees
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.task_assignees TO authenticated;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS task_assignees_task_id_idx ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS task_assignees_user_id_idx ON public.task_assignees(user_id);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- ============================================
-- 4.1 EPICS RLS POLICIES
-- ============================================

-- Policy: Users can SELECT epics for projects they are members of
-- This allows any project member (internal or client) to view epics.
CREATE POLICY "Users can view epics for accessible projects"
  ON public.epics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = epics.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Only Internal roles (project_admin, project_participant) can INSERT epics
CREATE POLICY "Internal users can create epics"
  ON public.epics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = epics.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
    AND created_by = auth.uid()
  );

-- Policy: Only Internal roles can UPDATE epics
CREATE POLICY "Internal users can update epics"
  ON public.epics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = epics.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = epics.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Only Internal roles can DELETE epics
CREATE POLICY "Internal users can delete epics"
  ON public.epics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = epics.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- ============================================
-- 4.2 TASKS RLS POLICIES
-- ============================================

-- Policy: Users can SELECT tasks for projects they are members of
-- This allows any project member (internal or client) to view tasks.
-- Note: Client visibility filtering (is_client_visible) should be handled at the application level.
CREATE POLICY "Users can view tasks for accessible projects"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Only Internal roles can INSERT tasks
CREATE POLICY "Internal users can create tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
    AND created_by = auth.uid()
  );

-- Policy: Only Internal roles can UPDATE tasks
CREATE POLICY "Internal users can update tasks"
  ON public.tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Only Internal roles can DELETE tasks
CREATE POLICY "Internal users can delete tasks"
  ON public.tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- ============================================
-- 4.3 TASK_ASSIGNEES RLS POLICIES
-- ============================================

-- Policy: Users can SELECT task_assignees for tasks they can view
-- This uses the same condition as tasks SELECT policy.
CREATE POLICY "Users can view task assignees for accessible tasks"
  ON public.task_assignees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.project_memberships pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Only Internal roles can INSERT task assignees
-- Note: Application-level validation should ensure assignees are project members.
CREATE POLICY "Internal users can assign tasks"
  ON public.task_assignees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.project_memberships pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Only Internal roles can DELETE task assignees
CREATE POLICY "Internal users can unassign tasks"
  ON public.task_assignees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.project_memberships pm ON pm.project_id = t.project_id
      WHERE t.id = task_assignees.task_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

