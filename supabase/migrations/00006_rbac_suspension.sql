-- ============================================================
-- Migration 00006: Add 'user' enum value to user_role
-- ============================================================
-- Must run in its own transaction before 00007 can use the new
-- value in DML. PostgreSQL requires ALTER TYPE ADD VALUE to be
-- committed before the new value can be referenced in queries.
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
