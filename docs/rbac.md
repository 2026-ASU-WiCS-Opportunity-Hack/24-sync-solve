# RBAC & User Management — Implementation Plan

## Context

The WIAL platform has a solid database schema with roles, RLS policies, and an admin panel, but the **management layer** is incomplete: no role assignment UI, no suspension system, no multi-role support, no chapter-level management, and inconsistent permission enforcement in server actions. This plan completes the RBAC system end-to-end.

**Confirmed decisions from user:**

- Role hierarchy: `super_admin > chapter_lead > content_editor = coach > user`
- `chapter_lead` stays in DB (UI label: "Chapter Admin")
- Rename `public` → `user` (unauthenticated visitors aren't a role)
- Multiple roles per chapter allowed (e.g., coach + content_editor)
- Multi-chapter roles supported
- 3 suspension levels: account, role, profile visibility
- Chapter leads manage their chapter (assign/revoke roles, approve content + coaches)
- Permissions coded to be easily reconfigurable
- Coach onboarding: self-apply with Credly URL + fetch validation, OR admin direct assignment
- No account settings page (separate task)

---

## Audit Findings — Additional Requirements

These gaps were found by cross-referencing research.md against the codebase and original plan. All are addressed in the phases below.

| #   | Gap                                              | Source                   | Resolution                                                                                  |
| --- | ------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------- |
| A   | Chapter creation by chapter_leads (UC1)          | research.md UC1          | Chapter leads submit a "Request Chapter" form; super_admin approves/provisions              |
| B   | Membership status not tracked after payment      | research.md UC4          | Add `membership_status` + `membership_expires_at` to profiles; webhook sets on dues payment |
| C   | Dashboard multi-role blind spot                  | dashboard/page.tsx:63-74 | Fetch user_chapter_roles; show ALL managed chapters, not just profile.chapter_id            |
| D   | `updateCoachStatusAction` has no chapter scoping | updateCoachStatus.ts:34  | After chapter_lead can approve coaches, verify `coachProfile.chapter_id === actorChapterId` |
| E   | `useAuth.ts` fallback role still `'public'`      | useAuth.ts:37            | Change `?? 'public'` → `?? 'user'` (explicitly listed in modified files)                    |
| F   | `coaching_hours` not self-editable               | research.md CALC         | Add `coaching_hours` to coach profile self-edit form                                        |
| G   | Dashboard empty-state CTA doesn't link to apply  | dashboard/page.tsx:183   | Add `/coaches/apply` link on "No Profile" empty state                                       |
| H   | PayPal missing                                   | research.md P0           | **Out of scope for RBAC sprint — flagged as separate task**                                 |
| I   | Email notifications missing                      | research.md P0           | **Out of scope for RBAC sprint — flagged as separate task**                                 |
| J   | Report export                                    | research.md Global Admin | **Out of scope for RBAC sprint — flagged as separate task**                                 |
| K   | UC5: Org team licenses                           | research.md UC5          | **Not built — aspirational/future feature**                                                 |

---

## Phase 1: Database Migration

**New file:** `supabase/migrations/00006_rbac_suspension.sql`

### 1A. Rename `public` → `user`

PostgreSQL can't rename enum values directly. Strategy: add `user`, migrate data, add CHECK constraints to block future `public` usage.

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

UPDATE profiles SET role = 'user' WHERE role = 'public';
UPDATE user_chapter_roles SET role = 'user' WHERE role = 'public';

ALTER TABLE profiles ADD CONSTRAINT profiles_role_no_public CHECK (role != 'public');
ALTER TABLE user_chapter_roles ADD CONSTRAINT ucr_role_no_public CHECK (role != 'public');

-- Update default for new user creation
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';
```

### 1B. Suspension columns on `profiles`

```sql
ALTER TABLE profiles
  ADD COLUMN is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text;

CREATE INDEX idx_profiles_suspended ON profiles (is_suspended) WHERE is_suspended = true;
```

### 1C. Active/suspension on `user_chapter_roles`

```sql
ALTER TABLE user_chapter_roles
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text;

CREATE INDEX idx_ucr_active ON user_chapter_roles (is_active) WHERE is_active = true;
```

### 1D. Membership status on `profiles` (Gap B)

```sql
CREATE TYPE membership_status AS ENUM ('none', 'active', 'expired');

ALTER TABLE profiles
  ADD COLUMN membership_status membership_status NOT NULL DEFAULT 'none',
  ADD COLUMN membership_expires_at timestamptz;

CREATE INDEX idx_profiles_membership ON profiles (membership_status);
```

Stripe webhook (`api/payments/webhooks/route.ts`) must be updated: on `checkout.session.completed` with `payment_type = 'membership_dues'`, set `membership_status = 'active'` and `membership_expires_at = NOW() + INTERVAL '1 year'` on the user's profile.

### 1E. Chapter requests table (UC1 Gap A)

```sql
CREATE TABLE chapter_requests (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug           text NOT NULL,          -- desired slug (validated unique on submit)
  name           text NOT NULL,
  country_code   char(2) NOT NULL,
  timezone       text NOT NULL DEFAULT 'UTC',
  currency       char(3) NOT NULL DEFAULT 'USD',
  accent_color   text NOT NULL DEFAULT '#CC0000',
  contact_email  text,
  message        text,
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at    timestamptz,
  review_notes   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug)  -- prevent duplicate slug requests even before approval
);

CREATE INDEX idx_chapter_requests_status ON chapter_requests (status);

ALTER TABLE chapter_requests ENABLE ROW LEVEL SECURITY;

-- Chapter leads can submit and view own requests
CREATE POLICY "cr_own" ON chapter_requests
  FOR ALL USING (requested_by = auth.uid());

-- Super admin manages all
CREATE POLICY "cr_admin" ON chapter_requests
  FOR ALL USING (is_super_admin());

CREATE TRIGGER trg_chapter_requests_updated_at
  BEFORE UPDATE ON chapter_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

**Security rules enforced in server action:**

- Requester must be authenticated and have role `chapter_lead` or `super_admin`
- `slug` validated as globally unique against both `chapters` and pending `chapter_requests` tables
- Requester cannot request to become lead of a chapter where a `chapter_lead` already exists
- Max 3 pending requests per user at a time (anti-spam)

### 1G. Coach visibility suspension + Credly on `coach_profiles`

```sql
ALTER TABLE coach_profiles
  ADD COLUMN credly_url text,
  ADD COLUMN coaching_hours_verified integer,   -- admin-verified hours (separate from self-reported)
  ADD COLUMN profile_visibility_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN visibility_suspended_at timestamptz,
  ADD COLUMN visibility_suspended_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
```

Note: `coaching_hours` (existing) = self-reported. `coaching_hours_verified` (new) = admin-verified. The self-reported hours drive the display on the coach profile. Admin may verify and record separately. Certification_level changes remain admin-only.

### 1J. Coach applications table

```sql
CREATE TABLE coach_applications (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id          uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  credly_url          text NOT NULL,
  credly_verified     boolean NOT NULL DEFAULT false,
  certification_level certification_level,
  message             text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  review_notes        text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

CREATE INDEX idx_coach_app_status ON coach_applications (status);
CREATE INDEX idx_coach_app_chapter ON coach_applications (chapter_id);

CREATE TRIGGER trg_coach_applications_updated_at
  BEFORE UPDATE ON coach_applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### 1F. RLS for coach_applications

```sql
ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_app_own_read" ON coach_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "coach_app_own_insert" ON coach_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "coach_app_chapter_lead_read" ON coach_applications
  FOR SELECT USING (user_has_chapter_role(chapter_id, 'chapter_lead'));

CREATE POLICY "coach_app_chapter_lead_update" ON coach_applications
  FOR UPDATE USING (user_has_chapter_role(chapter_id, 'chapter_lead'));

CREATE POLICY "coach_app_admin_all" ON coach_applications
  FOR ALL USING (is_super_admin());
```

### 1G. Update existing DB functions for suspension awareness

```sql
-- user_has_chapter_role: only count active roles
CREATE OR REPLACE FUNCTION user_has_chapter_role(p_chapter_id uuid, p_role user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_chapter_roles
    WHERE user_id = auth.uid()
      AND chapter_id = p_chapter_id
      AND role = p_role
      AND is_active = true  -- NEW
  )
  OR (
    p_role IN ('chapter_lead', 'content_editor')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND chapter_id = p_chapter_id
        AND role IN ('super_admin', 'chapter_lead', 'content_editor')
        AND is_suspended = false  -- NEW
    )
  );
$$;

-- get_user_role: suspended users treated as 'user'
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN is_suspended THEN 'user'::user_role ELSE role END
  FROM public.profiles WHERE id = auth.uid();
$$;

-- Update coach public read policy for visibility suspension
DROP POLICY IF EXISTS "coaches_public_read" ON coach_profiles;
CREATE POLICY "coaches_public_read" ON coach_profiles
  FOR SELECT USING (
    is_published = true
    AND is_verified = true
    AND profile_visibility_suspended = false
  );
```

### 1H. New helper functions

```sql
-- Get all active chapter roles for a user
CREATE OR REPLACE FUNCTION get_user_chapter_roles(p_user_id uuid)
RETURNS TABLE(chapter_id uuid, role user_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ucr.chapter_id, ucr.role
  FROM public.user_chapter_roles ucr
  WHERE ucr.user_id = p_user_id AND ucr.is_active = true;
$$;

-- Count non-suspended super admins (for last-admin protection)
CREATE OR REPLACE FUNCTION count_active_super_admins()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.profiles
  WHERE role = 'super_admin' AND is_suspended = false;
$$;
```

### 1I. Update `handle_new_user()` trigger

The trigger currently sets no explicit role (uses column default). After changing the default to `'user'`, new signups automatically get `role = 'user'`. No trigger change needed — just the `ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'` above.

---

## Phase 2: Centralized Permission System

### New file: `src/lib/permissions/permissions.ts`

Pure TypeScript (no React, no Supabase). Importable from server and client code.

```typescript
export type Permission =
  | 'content:edit'
  | 'content:approve'
  | 'content:create'
  | 'coach_profile:approve'
  | 'coach_profile:publish'
  | 'coach_application:review'
  | 'event:create'
  | 'event:edit'
  | 'event:delete'
  | 'role:assign_coach'
  | 'role:assign_content_editor'
  | 'role:assign_chapter_lead'
  | 'role:revoke'
  | 'suspend:account'
  | 'suspend:role'
  | 'suspend:coach_visibility'
  | 'unsuspend:account'
  | 'unsuspend:role'
  | 'unsuspend:coach_visibility'
  | 'payment:view_own'
  | 'payment:view_chapter'
  | 'payment:view_global'
  | 'audit:view_chapter'
  | 'audit:view_global'
  | 'chapter:manage_settings'
  | 'chapter:create'
  | 'chapter:delete'
  | 'user:view_list'
  | 'user:view_chapter_list'

// Single source of truth — change one line to reconfigure who can do what
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  super_admin: [
    /* all permissions */
  ],
  chapter_lead: [
    'content:edit',
    'content:approve',
    'content:create',
    'coach_profile:approve',
    'coach_profile:publish', // ← Remove these to restrict to super_admin only
    'coach_application:review',
    'event:create',
    'event:edit',
    'event:delete',
    'role:assign_coach',
    'role:assign_content_editor',
    'role:revoke',
    'suspend:role',
    'suspend:coach_visibility',
    'unsuspend:role',
    'unsuspend:coach_visibility',
    'payment:view_own',
    'payment:view_chapter',
    'audit:view_chapter',
    'chapter:manage_settings',
    'user:view_chapter_list',
  ],
  content_editor: [
    'content:edit',
    'content:create',
    'event:create',
    'event:edit',
    'payment:view_own',
  ],
  coach: ['payment:view_own'],
  user: ['payment:view_own'],
}

// Exported functions:
// hasPermission(role, permission) → boolean
// getPermissions(role) → Permission[]
// hasAnyRolePermission(roles[], permission) → boolean
// roleCanAssign(actorRole, targetRole) → boolean
// roleCanSuspend(actorRole, targetRole) → boolean
```

### New file: `src/lib/permissions/context.ts`

Server-side only. Resolves the current user's full permission context.

```typescript
export interface PermissionContext {
  userId: string
  globalRole: UserRole
  chapterRoles: Map<string, UserRole[]> // chapterId → active roles
  isSuspended: boolean
}

// getPermissionContext() → PermissionContext | null
//   Fetches profile + user_chapter_roles in a single call
//   Returns null if not authenticated

// canPerformInChapter(ctx, chapterId, permission) → boolean
//   Checks if ANY of the user's roles in that chapter grants the permission
//   super_admin bypasses chapter scoping
```

### New file: `src/features/auth/hooks/usePermissions.ts`

Client-side React hook for UI rendering (not authorization).

```typescript
// usePermissions() → {
//   hasPermission(permission, chapterId?) → boolean
//   isLoading: boolean
//   chapterRoles: Map<string, UserRole[]>
// }
```

### New file: `src/components/rbac/PermissionGate.tsx`

Client component wrapping children with permission check.

```tsx
<PermissionGate permission="content:approve" chapterId={id}>
  <ApproveButton />
</PermissionGate>
```

---

## Phase 3: Type & Constant Updates

### Modify: `src/types/database.ts`

- `UserRole`: change `'public'` → `'user'`
- Add `coach_applications` table types (Row, Insert, Update)
- Add suspension columns to `profiles` Row/Insert/Update
- Add `is_active` + suspension columns to `user_chapter_roles` Row/Insert/Update
- Add `credly_url`, `profile_visibility_suspended` to `coach_profiles` Row/Insert/Update
- Add function types: `get_user_chapter_roles`, `count_active_super_admins`

### Modify: `src/types/index.ts`

- Add `CoachApplication` type from DB
- Update `AuthUser` to include:
  ```typescript
  isSuspended: boolean
  chapterRoles: Record<string, UserRole[]>
  ```

### Modify: `src/lib/utils/constants.ts`

- `ROLE_HIERARCHY`: `'public'` → `'user'`
- Add `ROLE_LABELS` (move from admin users page)
- Add `ROLE_COLORS` (move from admin users page)

### Modify: `src/lib/utils/validation.ts`

Add schemas:

- `credlyUrlSchema` — validates `https://www.credly.com/badges/...` format
- `coachApplicationSchema` — chapter_id, credly_url, message
- `roleAssignmentSchema` — user_id, chapter_id, role
- `suspensionSchema` — user_id, reason
- `roleSuspensionSchema` — extends suspensionSchema with chapter_id, role

---

## Phase 4: Middleware & Auth Updates

### Modify: `src/middleware.ts`

Between step 2 (session refresh) and step 3 (route protection):

```typescript
// 2.5. Check account suspension
// If suspended, redirect to /suspended (except /suspended itself and /api)
```

Add new route protection:

```typescript
// 5.5. Protect /[chapter]/manage/* — require auth (role check in layout.tsx)
```

### Modify: `src/features/auth/hooks/useAuth.ts`

After fetching profile, also fetch `user_chapter_roles` (active only). Build `chapterRoles` map. Change fallback from `'public'` to `'user'`. Add `isSuspended` to AuthUser.

### Modify: `src/lib/utils/serverAuth.ts`

Replace the two ad-hoc functions with the centralized permission system:

- `getCurrentUserRole()` → delegates to `getPermissionContext()`
- `canEditChapter()` → delegates to `canPerformInChapter(ctx, chapterId, 'content:edit')`
- Add `requirePermission(permission, chapterId?)` — throws if denied (for server actions)

---

## Phase 5: Server Actions

### New: `src/features/rbac/actions/roleManagement.ts`

- `assignRole(userId, chapterId, role)` — validates actor permissions, inserts user_chapter_roles, audit logs
- `revokeRole(userId, chapterId, role)` — validates, deletes from user_chapter_roles, audit logs
- `updateGlobalRole(userId, role)` — super_admin only, updates profiles.role, last-admin protection

### New: `src/features/rbac/actions/suspension.ts`

- `suspendAccount(userId, reason)` — super_admin only, self-prevention, last-admin check
- `unsuspendAccount(userId)` — super_admin only
- `suspendChapterRole(userId, chapterId, role, reason)` — chapter_lead (coach/editor) or super_admin
- `unsuspendChapterRole(userId, chapterId, role)` — mirror
- `suspendCoachVisibility(coachProfileId, reason)` — chapter_lead or super_admin
- `unsuspendCoachVisibility(coachProfileId)` — mirror

All actions: validate with Zod, check permissions via `requirePermission()`, audit log, return `ActionResult`.

### New: `src/features/chapters/actions/requestChapter.ts` (Gap A)

- `requestNewChapter(formData)` — requires chapter_lead or super_admin role; validates slug uniqueness against both `chapters` AND `chapter_requests` tables; checks no existing chapter_lead for that slug; rate-limits to 3 pending per user; creates `chapter_requests` row; audit logs
- `reviewChapterRequest(requestId, decision, notes)` — super_admin only; if approved: calls existing `createChapterAction` + `assignRole(requesterId, newChapterId, 'chapter_lead')`; audit logs

### New: `src/features/coaches/actions/coachApplication.ts`

- `applyForCoach(formData)` — auth required, Zod validate, rate limit (max 3 per 24h via DB count), fetch Credly URL to verify, create `coach_applications` row
- `reviewCoachApplication(applicationId, decision, notes)` — chapter_lead or super_admin, if approved: create coach_profile + assign coach role via user_chapter_roles
- `validateCredlyUrl(url)` — HTTP fetch with 5s timeout, check status, return `{ valid, badgeInfo? }`

### New: `src/features/rbac/queries/getUserRoles.ts`

- `getUserChapterRoles(supabase, userId)` — returns `{ chapterId, roles[], chapterName }[]`
- `getChapterMembers(supabase, chapterId)` — paginated list of users with their chapter roles

### New: `src/features/coaches/queries/getCoachApplications.ts`

- `getPendingApplications(supabase, chapterId?)` — pending applications list
- `getApplicationById(supabase, id)` — single application detail

### Modify existing server actions (add centralized permission checks):

| File                                             | Change                                                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/content/actions/updateBlock.ts`        | Replace inline role check → `requirePermission('content:edit', chapterId)`                                                                      |
| `features/content/actions/contentApproval.ts`    | `super_admin` check → `requirePermission('content:approve', chapterId)`                                                                         |
| `features/coaches/actions/updateCoachStatus.ts`  | Allow chapter_lead via `requirePermission('coach_profile:publish', chapterId)` + verify `coachProfile.chapter_id === actor's chapterId` (Gap D) |
| `features/coaches/actions/updateCoachProfile.ts` | Add suspension check                                                                                                                            |
| `features/events/actions/manageEvents.ts`        | Use centralized permissions + suspension check                                                                                                  |
| `features/auth/queries/getUsers.ts`              | Add last-admin protection to `updateUserRole()`                                                                                                 |
| `features/auth/hooks/useAuth.ts`                 | `?? 'public'` → `?? 'user'` fallback (Gap E); fetch user_chapter_roles + isSuspended                                                            |
| `features/coaches/actions/updateCoachProfile.ts` | Add `coaching_hours` to editable fields (Gap F)                                                                                                 |
| `api/payments/webhooks/route.ts`                 | On `membership_dues` succeeded: update `membership_status = 'active'`, `membership_expires_at = NOW() + 1 year` (Gap B)                         |

---

## Phase 6: Chapter Management Routes

Chapter leads get `/[chapter]/manage/` — separate from `/admin` (which stays super_admin-only).

### New routes:

| Route                                                    | Purpose                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/app/[chapter]/manage/layout.tsx`                    | Auth + chapter_lead guard, sidebar                                          |
| `src/app/[chapter]/manage/page.tsx`                      | Chapter dashboard (member count, coaches, pending applications/approvals)   |
| `src/app/[chapter]/manage/users/page.tsx`                | Chapter members list + role assign/revoke + suspension                      |
| `src/app/[chapter]/manage/coaches/page.tsx`              | Chapter coach profiles + published/verified toggles + visibility suspension |
| `src/app/[chapter]/manage/coaches/applications/page.tsx` | Coach application queue (approve/reject with Credly info)                   |
| `src/app/[chapter]/manage/approvals/page.tsx`            | Content approval queue (reuses ApprovalActions + ContentDiff)               |
| `src/app/[chapter]/manage/settings/page.tsx`             | Chapter settings form (reuses/adapts ChapterForm)                           |

### New components:

| Component                                     | Type   | Purpose                                                         |
| --------------------------------------------- | ------ | --------------------------------------------------------------- |
| `components/layout/ChapterManageSidebar.tsx`  | Server | Sidebar nav for `/[chapter]/manage/*` with badge counts         |
| `components/admin/UserRoleManager.tsx`        | Client | Role assignment/revocation per chapter per user                 |
| `components/admin/SuspensionControls.tsx`     | Client | Account/role/visibility suspension with confirmation modal      |
| `components/admin/RoleAssignmentForm.tsx`     | Client | Select chapter + role + submit                                  |
| `components/coaches/CoachApplicationForm.tsx` | Client | Credly URL input with live validation + chapter select + submit |
| `components/layout/RoleSwitcher.tsx`          | Client | Header dropdown showing active role context across chapters     |

---

## Phase 7: Admin UI Updates + Global Pages

### New pages:

| Route                                     | Purpose                                                       |
| ----------------------------------------- | ------------------------------------------------------------- |
| `src/app/(auth)/suspended/page.tsx`       | "Account suspended" page with reason + logout + contact admin |
| `src/app/(global)/coaches/apply/page.tsx` | Coach self-application form (requires auth)                   |

### New pages (additions from audit):

| Route                                        | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `src/app/(global)/chapters/request/page.tsx` | Chapter request form for chapter_leads (UC1 gap)        |
| `src/app/admin/chapter-requests/page.tsx`    | Super admin queue for chapter requests (approve/reject) |

### Modify existing:

| File                                 | Changes                                                                                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/admin/users/page.tsx`           | Add role assignment UI, suspension controls, link to detail page. `'Public'` → `'User'`                                                                                                             |
| `app/admin/page.tsx`                 | Add "Coach Applications" + "Suspended Users" stat cards                                                                                                                                             |
| `app/admin/coaches/page.tsx`         | Add visibility suspension column, credly_url column                                                                                                                                                 |
| `app/(global)/dashboard/page.tsx`    | Fetch user_chapter_roles to show ALL managed chapters (not just profile.chapter_id) (Gap C); `'public'` → `'user'`; empty-state adds link to `/coaches/apply` (Gap G); show membership_status badge |
| `components/layout/Header.tsx`       | Add RoleSwitcher (visible when user has multi-chapter roles)                                                                                                                                        |
| `components/layout/UserMenu.tsx`     | Multi-role aware links, `'public'` → `'user'`                                                                                                                                                       |
| `components/layout/AdminSidebar.tsx` | Add "Applications" nav item with badge count                                                                                                                                                        |

---

## Phase 8: i18n Keys

Add to `messages/en.json`:

- `rbac.roles.*` — role display labels
- `rbac.roleAssignment.*` — assign/revoke UI strings
- `rbac.suspension.*` — suspend/unsuspend UI strings
- `rbac.roleSwitcher.*` — role switcher strings
- `chapterManage.*` — chapter management nav + dashboard
- `coachApplication.*` — application form + validation messages

---

## Complete Permission Matrix

| Permission                 | super_admin | chapter_lead (own chapter) | content_editor (own chapter) | coach | user |
| -------------------------- | :---------: | :------------------------: | :--------------------------: | :---: | :--: |
| content:edit               |   Global    |          Chapter           |           Chapter            |   -   |  -   |
| content:approve            |   Global    |         Chapter\*          |              -               |   -   |  -   |
| content:create             |   Global    |          Chapter           |           Chapter            |   -   |  -   |
| coach_profile:approve      |   Global    |         Chapter\*          |              -               |   -   |  -   |
| coach_profile:publish      |   Global    |         Chapter\*          |              -               |   -   |  -   |
| coach_application:review   |   Global    |         Chapter\*          |              -               |   -   |  -   |
| event:create               |   Global    |          Chapter           |           Chapter            |   -   |  -   |
| event:edit                 |   Global    |          Chapter           |           Chapter            |   -   |  -   |
| event:delete               |   Global    |          Chapter           |              -               |   -   |  -   |
| role:assign_coach          |   Global    |          Chapter           |              -               |   -   |  -   |
| role:assign_content_editor |   Global    |          Chapter           |              -               |   -   |  -   |
| role:assign_chapter_lead   |   Global    |             -              |              -               |   -   |  -   |
| role:revoke                |   Global    |   Chapter (coach/editor)   |              -               |   -   |  -   |
| suspend:account            |   Global    |             -              |              -               |   -   |  -   |
| suspend:role               |   Global    |   Chapter (coach/editor)   |              -               |   -   |  -   |
| suspend:coach_visibility   |   Global    |          Chapter           |              -               |   -   |  -   |
| payment:view_own           |     Yes     |            Yes             |             Yes              |  Yes  | Yes  |
| payment:view_chapter       |   Global    |          Chapter           |              -               |   -   |  -   |
| payment:view_global        |   Global    |             -              |              -               |   -   |  -   |
| audit:view_chapter         |   Global    |          Chapter           |              -               |   -   |  -   |
| audit:view_global          |   Global    |             -              |              -               |   -   |  -   |
| chapter:manage_settings    |   Global    |          Chapter           |              -               |   -   |  -   |
| chapter:create             |   Global    |             -              |              -               |   -   |  -   |
| chapter:delete             |   Global    |             -              |              -               |   -   |  -   |
| user:view_list             |   Global    |             -              |              -               |   -   |  -   |
| user:view_chapter_list     |   Global    |          Chapter           |              -               |   -   |  -   |

\* = Configurable — remove from `chapter_lead` array in PERMISSION_MATRIX to restrict to super_admin.

---

## Edge Cases & Safety Guards

1. **Self-suspension prevention**: `suspendAccount`/`suspendRole` rejects when `targetUserId === actorUserId`
2. **Last super_admin protection**: Before demoting/suspending a super_admin, call `count_active_super_admins()`. Reject if result ≤ 1.
3. **Duplicate role assignment**: `UNIQUE(user_id, chapter_id, role)` constraint. Handle Postgres error `23505` gracefully.
4. **Credly fetch failures**: 5s timeout. If fetch fails, still create application with `credly_verified = false`. Admin sees "Unverified" badge.
5. **Suspended user routing**: Middleware redirects ALL requests (except `/suspended`, `/api`) to `/suspended`. Page shows reason + logout only.
6. **Enum migration**: `public` stays in PG enum but CHECK constraints + TypeScript types prevent its use.
7. **Role downgrade**: Allowed. Chapter leads can revoke coach/content_editor. Super_admin can revoke chapter_lead. Application validates `roleCanSuspend(actor, target)`.
8. **Rate limiting coach applications**: Max 3 applications per user per 24h (DB count check in server action).

---

## Out of Scope — Flagged for Future Sprints

These are P0/P1 gaps identified in research.md that are **not** part of this RBAC sprint:

| Item                                   | Why deferred                                                  |
| -------------------------------------- | ------------------------------------------------------------- |
| PayPal integration                     | Separate payments sprint — requires PayPal SDK setup          |
| Email notification system              | Requires adding email provider (Resend/SES) — separate sprint |
| Recertification reminders              | Depends on email system above                                 |
| Branding-update email to chapter leads | Depends on email system above                                 |
| Dues overdue email reminders           | Depends on email system above                                 |
| Report/CSV export                      | Admin reporting sprint                                        |
| UC5 bulk team licensing                | Future feature — not mentioned in Dec 17 notes as priority    |

---

## Implementation Order

| #   | Phase                                                                                   | Depends On                   |
| --- | --------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | DB migration (00006) + run                                                              | —                            |
| 2   | Permission system (`src/lib/permissions/`)                                              | Migration types              |
| 3   | Type + constant updates                                                                 | Migration                    |
| 4   | Zod schemas                                                                             | Types                        |
| 5   | Auth hook + usePermissions + middleware updates                                         | Permissions, types           |
| 6   | RBAC server actions (role mgmt + suspension)                                            | Permissions, types, schemas  |
| 7   | Coach application server actions + queries                                              | Permissions, types           |
| 8   | Update existing server actions with centralized checks                                  | Permissions                  |
| 9   | PermissionGate component                                                                | usePermissions hook          |
| 10  | Chapter management layout + sidebar                                                     | Permissions                  |
| 11  | Chapter management pages (dashboard, users, coaches, applications, approvals, settings) | Actions, queries, components |
| 12  | Admin UI updates (users page role mgmt, coaches, dashboard stats)                       | Actions, queries             |
| 13  | Suspended page + coach apply page                                                       | Server actions               |
| 14  | RoleSwitcher + Header/UserMenu updates                                                  | usePermissions               |
| 15  | Dashboard multi-role updates                                                            | usePermissions, types        |
| 16  | i18n keys                                                                               | All UI                       |
| 17  | Tests (permission system, server actions, E2E)                                          | All code                     |

---

## New Files (32)

```
supabase/migrations/00006_rbac_suspension.sql
src/lib/permissions/permissions.ts
src/lib/permissions/context.ts
src/lib/permissions/index.ts
src/features/rbac/actions/roleManagement.ts
src/features/rbac/actions/suspension.ts
src/features/rbac/queries/getUserRoles.ts
src/features/rbac/types.ts
src/features/coaches/actions/coachApplication.ts
src/features/coaches/queries/getCoachApplications.ts
src/features/auth/hooks/usePermissions.ts
src/components/rbac/PermissionGate.tsx
src/components/layout/RoleSwitcher.tsx
src/components/layout/ChapterManageSidebar.tsx
src/components/admin/UserRoleManager.tsx
src/components/admin/SuspensionControls.tsx
src/components/admin/RoleAssignmentForm.tsx
src/components/coaches/CoachApplicationForm.tsx
src/app/(auth)/suspended/page.tsx
src/app/(global)/coaches/apply/page.tsx
src/app/[chapter]/manage/layout.tsx
src/app/[chapter]/manage/page.tsx
src/app/[chapter]/manage/users/page.tsx
src/app/[chapter]/manage/coaches/page.tsx
src/app/[chapter]/manage/coaches/applications/page.tsx
src/app/[chapter]/manage/approvals/page.tsx
src/app/[chapter]/manage/settings/page.tsx
src/lib/permissions/permissions.test.ts
src/features/chapters/actions/requestChapter.ts
src/app/(global)/chapters/request/page.tsx
src/app/admin/chapter-requests/page.tsx
src/features/chapters/queries/getChapterRequests.ts
```

## Modified Files (21)

```
src/types/database.ts
src/types/index.ts
src/lib/utils/constants.ts
src/lib/utils/validation.ts
src/lib/utils/serverAuth.ts
src/middleware.ts
src/features/auth/hooks/useAuth.ts
src/features/content/actions/updateBlock.ts
src/features/content/actions/contentApproval.ts
src/features/coaches/actions/updateCoachStatus.ts
src/features/coaches/actions/updateCoachProfile.ts
src/features/events/actions/manageEvents.ts
src/features/auth/queries/getUsers.ts
src/app/admin/users/page.tsx
src/app/admin/page.tsx
src/app/admin/coaches/page.tsx
src/app/(global)/dashboard/page.tsx
src/components/layout/Header.tsx
src/components/layout/UserMenu.tsx
src/components/layout/AdminSidebar.tsx
src/components/coaches/CoachProfileForm.tsx        # add coaching_hours field (Gap F)
src/app/api/payments/webhooks/route.ts             # update membership_status on dues payment (Gap B)
messages/en.json
```

---

## Verification

1. **Migration**: Run `supabase db reset`, verify all tables/columns/constraints/functions exist
2. **Permission system**: Unit tests for `hasPermission`, `canPerformInChapter`, `roleCanAssign`, `roleCanSuspend`
3. **Role assignment**: Login as chapter_lead → assign coach role in chapter → verify user gets access
4. **Role revocation**: Revoke role → verify user loses access immediately
5. **Account suspension**: Suspend user → verify redirect to /suspended on all routes
6. **Role suspension**: Suspend chapter_lead role → verify they lose manage access but keep other roles
7. **Coach visibility suspension**: Hide coach → verify removed from public directory
8. **Self-prevention**: Try to suspend yourself → verify rejection
9. **Last admin**: Try to suspend only super_admin → verify rejection
10. **Coach application**: Submit with Credly URL → verify fetch validation → admin approves → user becomes coach
11. **Multi-role**: User with roles in 2 chapters → verify RoleSwitcher shows both → UI adapts per chapter
12. **RLS**: Login as chapter_lead → try to access another chapter's data → verify blocked
13. **Public → User rename**: Verify no references to `public` role in TypeScript, no `public` values in DB
14. **Membership status**: Complete dues payment → verify `membership_status = 'active'` on profile + `membership_expires_at` set 1 year out
15. **Chapter request flow**: Login as chapter_lead → submit chapter request → verify slug uniqueness enforced → super_admin approves → chapter created + chapter_lead role auto-assigned
16. **Chapter request deduplication**: Submit request for slug that already exists in `chapters` → verify rejected; submit duplicate slug in `chapter_requests` → verify rejected
17. **Coaching hours**: Login as coach → edit profile → update coaching_hours → verify saved; verify certification_level not editable
18. **Dashboard multi-role**: User with chapter_lead via user_chapter_roles (not profile.chapter_id) → verify all managed chapters appear on dashboard
19. **Coach apply CTA**: User with coach role but no profile → dashboard empty state shows link to /coaches/apply
