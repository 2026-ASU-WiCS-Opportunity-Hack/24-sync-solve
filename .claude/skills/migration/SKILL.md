---
name: migration
description: Create a new Supabase database migration with proper table definitions, indexes, RLS policies, and triggers.
user-invocable: true
---

# Create Supabase Migration

Scaffold a new database migration following project conventions.

## Usage

`/migration [description]` — e.g., `/migration add notifications table` or `/migration update coach profiles add linkedin`

Parse `$ARGUMENTS` to extract a description of what the migration does.

## Steps

1. **Determine migration number**: Read `supabase/migrations/` directory, find the highest number, increment by 1
2. **Generate filename**: `supabase/migrations/{number}_{snake_case_description}.sql`
3. **Write the SQL** following the conventions below

## Critical: Verify Against Live Docs

Before writing RLS policies, check https://supabase.com/docs/guides/database/postgres/row-level-security for the latest syntax and patterns. Supabase RLS syntax evolves.

## Conventions

### Table Creation

```sql
-- Always include these columns
CREATE TABLE public.{table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... domain columns ...
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Always add updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.{table_name}
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Always enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;
```

### Naming

- Tables: `snake_case`, plural (e.g., `coach_profiles`, `content_blocks`)
- Columns: `snake_case`
- Indexes: `idx_{table}_{column(s)}`
- Policies: `{table}_{operation}_{role}` (e.g., `chapters_select_public`)
- Functions: `snake_case`
- Triggers: `on_{event}_{table}` or `set_{column}`

### RLS Policies

Every table MUST have RLS policies. Use `(select auth.uid())` with subselect for performance (verified Supabase pattern):

```sql
-- Public read access (published/active content)
CREATE POLICY "{table}_select_public" ON public.{table}
  FOR SELECT
  TO anon, authenticated
  USING ({visibility_condition});

-- User can manage own records (subselect pattern per Supabase docs)
CREATE POLICY "{table}_own" ON public.{table}
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = {user_id_column});

-- Chapter lead access (project helper function)
CREATE POLICY "{table}_chapter_lead" ON public.{table}
  FOR ALL
  TO authenticated
  USING (public.user_has_chapter_role(chapter_id, ARRAY['chapter_lead']));

-- Super admin full access
CREATE POLICY "{table}_all_super_admin" ON public.{table}
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'super_admin');
```

**Note**: UPDATE policies need both `USING` (row visibility) and `WITH CHECK` (write validation). Verify latest syntax at Supabase RLS docs.

### Indexes

Add indexes for:

- Foreign key columns (chapter_id, user_id, etc.)
- Columns used in WHERE clauses (status, is_active, is_published)
- Columns used in ORDER BY (created_at, sort_order)
- Partial indexes where applicable: `WHERE is_active = true`

### Column Types

- IDs: `UUID` with `gen_random_uuid()`
- Timestamps: `TIMESTAMPTZ` (always timezone-aware)
- Money: `INTEGER` in cents (never DECIMAL for currency)
- Email: `TEXT` with CHECK constraint
- Status/enum: `TEXT` with CHECK constraint listing valid values
- Flexible data: `JSONB`
- Arrays: `TEXT[]` for simple lists

### Security Rules

- Never store passwords (Supabase Auth handles this)
- Never store payment card data (Stripe handles this)
- Use CHECK constraints for enums instead of PostgreSQL ENUM types (easier to migrate)
- Always validate foreign key references

## Checklist

1. [ ] Table has `id`, `created_at`, `updated_at`
2. [ ] `updated_at` trigger applied
3. [ ] RLS enabled
4. [ ] RLS policies cover: public read, own records, chapter lead, super admin
5. [ ] Indexes on FKs, WHERE columns, ORDER BY columns
6. [ ] CHECK constraints on enum-like columns
7. [ ] Comments on non-obvious columns

## Output

After creating the migration, report:

1. Migration file path and number
2. Tables/columns created or modified
3. RLS policies added
4. Indexes added
5. Reminder: Run `npx supabase db reset` to apply locally, then `npx supabase gen types` to update TypeScript types
