-- Migration: Create invoices table for minimal billing
-- Step 6: Minimal Invoices as Ledger Credits

-- ============================================
-- 1. INVOICES TABLE
-- ============================================
-- Invoices represent billing credits against the time ledger.
-- Each invoice covers a project with an amount and billed duration (in minutes).
-- The billed_minutes acts as a credit against time_entries for that project.
-- 
-- Note: There is no requirement that billed_minutes matches specific time_entries 1:1.
-- Business logic is free to decide how many minutes are considered covered by a given invoice.
-- Later, we can add a more detailed link between invoices and specific time_entries.

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  billed_minutes INTEGER NOT NULL CHECK (billed_minutes >= 0),
  issue_date DATE NOT NULL,
  due_date DATE,
  notes_internal TEXT,
  notes_client TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS invoices_project_id_idx ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON public.invoices(issue_date);

-- Composite index for common queries (project + status)
CREATE INDEX IF NOT EXISTS invoices_project_status_idx ON public.invoices(project_id, status);

-- Trigger: Update updated_at on invoices table updates
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. RLS POLICIES FOR INVOICES
-- ============================================

-- Policy: Users can SELECT invoices for projects they are members of
-- This allows any project member (internal or client) to view invoices for that project.
CREATE POLICY "Users can view invoices for accessible projects"
  ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = invoices.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT invoices only for Internal roles on that project
-- Only project_admin and project_participant can create invoices.
CREATE POLICY "Internal users can create invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = invoices.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can UPDATE invoices only if they are Internal roles on that project
-- Only project_admin and project_participant can update invoices.
CREATE POLICY "Internal users can update invoices"
  ON public.invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = invoices.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = invoices.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('project_admin', 'project_participant')
    )
  );

-- Policy: Users can DELETE invoices only if they are project_admin on that project
-- We restrict deletion to project_admin only. For other status changes, use UPDATE to set status = 'cancelled'.
-- This choice prevents accidental deletions and maintains an audit trail.
CREATE POLICY "Project admins can delete invoices"
  ON public.invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_memberships pm
      WHERE pm.project_id = invoices.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'project_admin'
    )
  );

