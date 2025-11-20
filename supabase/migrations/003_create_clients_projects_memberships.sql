-- Migration: Create clients, projects, and project_memberships tables
-- Step 2: Core data model & modes

-- ============================================
-- 1. CLIENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on clients (policies will be created after all tables exist)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.clients TO authenticated;

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on projects (policies will be created after all tables exist)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.projects TO authenticated;

-- ============================================
-- 3. PROJECT_MEMBERSHIPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('project_admin', 'project_participant', 'project_client')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_memberships (policies will be created after all tables exist)
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.project_memberships TO authenticated;

-- ============================================
-- 4. TRIGGERS FOR updated_at
-- ============================================

-- Trigger: Update updated_at on clients table updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on projects table updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on project_memberships table updates
CREATE TRIGGER update_project_memberships_updated_at
  BEFORE UPDATE ON public.project_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. FUNCTION TO AUTO-CREATE PROJECT ADMIN MEMBERSHIP
-- ============================================

-- Function to automatically create project_admin membership when a project is created
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_memberships (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'project_admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically create project_admin membership when a project is created
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_project();

-- ============================================
-- 6. RLS POLICIES (created after all tables exist)
-- ============================================

-- RLS Policy: Users can SELECT their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.project_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can SELECT projects where they have at least one membership
CREATE POLICY "Users can view projects they are members of"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can SELECT clients that are referenced by projects they can see
CREATE POLICY "Users can view clients of accessible projects"
  ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.project_memberships pm ON pm.project_id = p.id
      WHERE p.client_id = clients.id
        AND pm.user_id = auth.uid()
    )
  );

