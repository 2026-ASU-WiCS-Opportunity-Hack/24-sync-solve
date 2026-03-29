-- ============================================================
-- WIAL Platform - Fix audit_log INSERT RLS policy
-- Migration: 00005_fix_audit_log_rls
-- ============================================================
-- The previous policy "audit_service_insert" used WITH CHECK (true),
-- which allowed any authenticated user to insert audit records directly,
-- bypassing the log_audit() SECURITY DEFINER function.
--
-- The log_audit() function is owned by a superuser and is SECURITY DEFINER,
-- meaning it already bypasses RLS for its inserts. Direct authenticated-user
-- inserts are not a valid use case and should be blocked.
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "audit_service_insert" ON audit_log;

-- Only super admins may insert directly (for emergency/manual auditing).
-- All normal audit entries flow through log_audit() which bypasses RLS
-- as a SECURITY DEFINER function owned by postgres.
CREATE POLICY "audit_service_insert" ON audit_log
  FOR INSERT WITH CHECK (is_super_admin());
