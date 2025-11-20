-- Migration: Fix clients RLS policy to prevent information leakage
-- SECURITY FIX: The policy "Internal users can view all clients" from migration 008
-- allowed internal users to see ALL clients, even those from projects they don't have access to.
-- This migration removes that overly permissive policy.
--
-- Note: The restrictive policy "Users can view clients of accessible projects" from migration 003
-- already exists and is correct. We only need to drop the permissive one from migration 008.

-- Drop the overly permissive policy from migration 008
DROP POLICY IF EXISTS "Internal users can view all clients" ON public.clients;

-- The correct policy "Users can view clients of accessible projects" from migration 003
-- remains in place and ensures users can only see clients for projects they are members of.

