# WIAL Platform — Remaining Work Plan

## Context

Full cross-reference of `docs/research.md` against the current codebase (post-Sprint 4 RBAC). The platform has a strong foundation: auth, RBAC, chapter system, coach directory, content editing, payments, events, and admin panel are all substantially complete. This plan covers everything remaining to reach a complete, demo-ready MVP.

**Key decisions confirmed with user:**

- Email: Resend (React Email templates)
- AI features: Skipped for now
- Event registration: Paid tickets via Stripe (new migration needed)
- Stripe: WIAL Global account only (chapter_id already tracked in payments table)
- Events in manage sidebar: Yes — add to ChapterManageSidebar
- Coach hours: Manual entry only (keep current)
- P1 priorities: All four — Organizational Client List, i18n string wiring, Content version history UI, Analytics

---

## What Is Already Complete

| Area                                                                     | Status |
| ------------------------------------------------------------------------ | ------ |
| Database schema (7 migrations, RLS, triggers, indexes)                   | ✅     |
| Auth (email/password, Google OAuth, password reset)                      | ✅     |
| RBAC (5 roles, 44 permissions, suspension system)                        | ✅     |
| Chapter system (create, provision, chapter-scoped routes)                | ✅     |
| Chapter request workflow (request → admin approval)                      | ✅     |
| Coach directory (search, filters, pagination, profiles)                  | ✅     |
| Coach application workflow (apply, Credly URL, review)                   | ✅     |
| Content blocks + inline editing (13 types, draft/publish, approval)      | ✅     |
| Events (CRUD, manage pages, chapter + global display)                    | ✅     |
| Payments (Stripe Checkout, webhook, 3 payment types)                     | ✅     |
| Admin panel (dashboard, users, coaches, chapters, approvals, payments)   | ✅     |
| Chapter manage panel (coaches, applications, approvals, settings, users) | ✅     |
| Suspension system (account, role, coach visibility)                      | ✅     |
| User dashboard (membership, payments, managed chapters)                  | ✅     |
| File upload API                                                          | ✅     |
| Audit logging                                                            | ✅     |

---

## Remaining Work — Ordered by Priority

---

### BLOCK 1: Email Integration (Resend)

**Why:** Contact forms have no delivery, approval/rejection notifications don't exist, dues reminders don't exist. This is a critical gap that makes several flows appear broken.

**Files to create/modify:**

- `src/lib/email/client.ts` — Resend client init
- `src/lib/email/templates/` — React Email templates:
  - `ContactFormReceipt.tsx` — confirmation to form submitter
  - `ContactFormNotification.tsx` — notification to chapter contact_email
  - `CoachApplicationApproved.tsx` — approval email to applicant
  - `CoachApplicationRejected.tsx` — rejection email with notes
  - `ContentApproved.tsx` — block approved notification to editor
  - `ContentRejected.tsx` — block rejected with reason to editor
  - `ChapterRequestReviewed.tsx` — chapter request outcome to requester
  - `MembershipExpiry.tsx` — reminder 30 days before expiry (future use)
- `src/features/chapters/actions/submitContactForm.ts` — add Resend send call
- `src/features/coaches/actions/coachApplication.ts` (reviewCoachApplicationAction) — add Resend send
- `src/features/content/actions/contentApproval.ts` — add Resend send on approve/reject
- `src/features/chapters/actions/requestChapter.ts` (review action) — add Resend send

**Dependencies to install:** `resend`, `@react-email/components`

**New env vars:** `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `noreply@wial.org`)

---

### BLOCK 2: Event Registration with Paid Tickets

**Why:** `event_registration` is defined as a payment_type in DB and Stripe but has no ticket_price field, no registration form, and no checkout flow. research.md P1 mentions "RSVP and ticketing integration."

**New migration: `00008_event_tickets.sql`**

- Add `ticket_price INTEGER` (cents, nullable — NULL = free) to `events` table
- Add `event_registrations` table:
  - `id`, `event_id` (FK), `user_id` (FK, nullable for guest), `guest_name`, `guest_email`
  - `payment_id` (FK → payments, nullable for free events)
  - `status` enum: `pending | confirmed | cancelled`
  - `registered_at`
- RLS: public can insert (guest registration), own read, chapter_lead/super_admin read chapter registrations
- Add `registration_count` view or function for capacity checks

**Files to create/modify:**

- `src/app/[chapter]/events/[id]/register/page.tsx` — registration form page
  - Free events: name + email form → creates event_registrations record → confirmation page
  - Paid events: redirects to Stripe checkout with event metadata
- `src/app/[chapter]/events/[id]/register/success/page.tsx` — post-payment confirmation
- `src/components/events/EventRegistrationForm.tsx` — client form component
- `src/components/events/EventCard.tsx` — add ticket_price display badge (Free / $XX)
- `src/app/[chapter]/events/[id]/page.tsx` — add "Register" CTA button
- `src/features/events/actions/manageEvents.ts` — add ticket_price to create/update schemas
- `src/features/payments/actions/createCheckoutSession.ts` — handle event_registration type (fetch event.ticket_price, validate capacity)
- `src/components/events/EventForm.tsx` — add ticket_price field (optional, "Leave blank for free event")
- `src/app/[chapter]/manage/events/page.tsx` (if not exists) — add registrations count column
- `src/app/api/payments/webhooks/route.ts` — handle event_registration: set event_registrations.status = 'confirmed'
- `messages/en.json` — add event registration strings

---

### BLOCK 3: Events in Chapter Manage Sidebar

**Why:** "Manage Events" is only reachable via the chapter events page hero button — not in the `/[chapter]/manage/` sidebar. Chapter leads can't easily find it.

**Files to modify:**

- `src/components/layout/ChapterManageSidebar.tsx` — add "Events" nav item (with badge if any unpublished events)
- Verify that `/[chapter]/events/manage/layout.tsx` permission check is consistent with the manage sidebar's gating logic

---

### BLOCK 4: Chapter Payment Report for Chapter Leads

**Why:** Super admin has `/admin/payments`; chapter leads have NO confirmed payments view in their manage panel. research.md requires "Chapter-level reporting of collected dues."

**Files to create/modify:**

- `src/app/[chapter]/manage/payments/page.tsx` — chapter-scoped payment table
  - Shows: user, payment type, amount, status, date, receipt link
  - Shows total collected (succeeded payments only)
  - Requires `payment:view_chapter` permission (already in permissions.ts for chapter_lead)
- `src/features/payments/queries/getPayments.ts` — add `getChapterPayments(supabase, chapterId)` query
- `src/components/layout/ChapterManageSidebar.tsx` — add "Payments" nav item

---

### BLOCK 5: Organizational Client List (P1)

**Why:** research.md P1 — "At either the Global or Chapter level, allow the ability to add specific clients supported by WIAL. With links to their website and their logo." Implementing as a new `client_grid` content block type to fit within the existing inline editing system.

**Files to create/modify:**

- `src/features/content/blocks/schemas.ts` — add `clientGridSchema`:
  - `clients[]`: `{ name, logoUrl, websiteUrl, description? }`
- `src/components/blocks/display/ClientGridBlock.tsx` — grid of client logos/names with links
- `src/components/blocks/editors/ClientGridBlockEditor.tsx` — editor with add/remove/reorder clients, logo upload
- `src/features/content/blocks/registry.ts` — register `client_grid` (requiresApproval: false, label: "Client Showcase")
- `messages/en.json` — add client_grid strings

---

### BLOCK 6: i18n — Wire All Strings

**Why:** next-intl infrastructure exists, `messages/en.json` exists, but ~50 pages and 73 components use hardcoded English strings. CLAUDE.md rule: "Never hardcode user-facing strings."

**Scope of work:**

- Audit every file in `src/app/` and `src/components/` for hardcoded string literals
- Add missing keys to `messages/en.json` organized by namespace:
  - `nav.*`, `auth.*`, `coaches.*`, `chapters.*`, `events.*`, `payments.*`, `admin.*`, `manage.*`, `content.*`, `common.*`
- Replace with `useTranslations('namespace')` (client) or `getTranslations('namespace')` (server)
- Pay attention to: button labels, heading text, placeholder text, error messages, empty states, toast messages, status labels
- Date/currency formatting: ensure `Intl.DateTimeFormat` / `Intl.NumberFormat` are used everywhere (not hardcoded formats)

**Files likely needing the most work:**

- All `src/app/(global)/*/page.tsx` pages
- All `src/app/[chapter]/*/page.tsx` pages
- `src/components/coaches/CoachDirectory.tsx`, `CoachCard.tsx`, `CoachProfileForm.tsx`
- `src/components/events/EventCard.tsx`, `EventForm.tsx`
- All admin pages

---

### BLOCK 7: Content Version History UI

**Why:** `content_versions` table auto-records every block change via trigger, but there is no UI to browse history or revert. research.md mentions "Content versioning + revert."

**Files to create/modify:**

- `src/features/content/queries/getApprovals.ts` — add `getBlockVersionHistory(supabase, blockId)` query
- `src/components/editor/BlockVersionHistory.tsx` — version list with timestamps, changed_by, content snapshot, "Revert to this version" button
- `src/features/content/actions/updateBlock.ts` — add `revertToVersionAction(blockId, versionId)` server action
  - Requires: same permission as editing the block
  - Sets block content = version.content, logs audit, revalidates page
- Wire into `BlockEditorModal.tsx` — add "Version History" tab/panel (lazy-loaded)

---

### BLOCK 8: Analytics — Basic SQL Dashboards

**Why:** research.md P1 — "Traffic analytics per chapter, membership growth tracking, payment conversion metrics." Using existing DB data (no third-party tool needed).

**Admin Dashboard enhancements (`src/app/admin/page.tsx`):**

- Payment conversion rate (sessions started vs. succeeded in last 30 days)
- New coaches per month (last 6 months, bar chart using native CSS or a lightweight lib)
- Membership active vs. expired count
- Chapter activity ranking (most content updates, most coach applications)

**Chapter Manage Dashboard enhancements (`src/app/[chapter]/manage/page.tsx`):**

- Coach count over time (monthly trend)
- Event attendance (registrations per event — after Block 2)
- Content approval turnaround time (avg days pending → approved)

**New query functions:**

- `src/features/payments/queries/getPayments.ts` — add `getPaymentStats(supabase, chapterId?)` returning conversion rate, total by type
- `src/app/admin/page.tsx` + `src/app/[chapter]/manage/page.tsx` — wire stats into existing stat card grid

**Note:** No third-party analytics. All data from Supabase. No charts library unless very lightweight (e.g., CSS-only bar charts via Tailwind widths).

---

### BLOCK 9: UX / Polish Gaps

#### 9a. Error Pages

- `src/app/not-found.tsx` — Global 404 page with WIAL branding + nav links
- `src/app/error.tsx` — Global 500 error boundary page

#### 9b. Home Page Stats — Make Editable

- Home page stats ("20+ countries, 500+ coaches...") are hardcoded
- These should be editable via a `stats` content block on the global home page
- The `stats` block type already exists — verify global home page uses it (or add a seed block)

#### 9c. Performance Audit

- Run Lighthouse on chapter landing, coach directory, home page
- Run `@next/bundle-analyzer` to verify content pages < 100KB JS
- Fix any bundles exceeding targets

#### 9d. E2E Test Coverage Check

- `e2e/` has: accessibility, auth, coaches, content, navigation, payments specs
- Verify events flow, event registration, and new BLOCK 2-8 features have coverage

---

## Critical Files to Touch (Summary)

| File                                                      | Change                                            |
| --------------------------------------------------------- | ------------------------------------------------- |
| `src/lib/email/client.ts`                                 | New — Resend client                               |
| `src/lib/email/templates/*.tsx`                           | New — React Email templates (7 templates)         |
| `src/features/chapters/actions/submitContactForm.ts`      | Add email send                                    |
| `src/features/coaches/actions/coachApplication.ts`        | Add email send on review                          |
| `src/features/content/actions/contentApproval.ts`         | Add email send on approve/reject                  |
| `supabase/migrations/00008_event_tickets.sql`             | New migration: ticket_price + event_registrations |
| `src/features/events/actions/manageEvents.ts`             | Add ticket_price to schemas                       |
| `src/components/events/EventForm.tsx`                     | Add ticket_price field                            |
| `src/app/[chapter]/events/[id]/register/page.tsx`         | New — registration page                           |
| `src/features/payments/actions/createCheckoutSession.ts`  | Handle event_registration type                    |
| `src/app/api/payments/webhooks/route.ts`                  | Handle event_registration confirmation            |
| `src/components/layout/ChapterManageSidebar.tsx`          | Add Events + Payments nav items                   |
| `src/app/[chapter]/manage/payments/page.tsx`              | New — chapter payment report                      |
| `src/features/content/blocks/schemas.ts`                  | Add clientGridSchema                              |
| `src/components/blocks/display/ClientGridBlock.tsx`       | New display block                                 |
| `src/components/blocks/editors/ClientGridBlockEditor.tsx` | New editor block                                  |
| `src/features/content/blocks/registry.ts`                 | Register client_grid                              |
| `messages/en.json`                                        | Wire all strings (~50 pages, 73 components)       |
| `src/components/editor/BlockVersionHistory.tsx`           | New — version history panel                       |
| `src/features/content/actions/updateBlock.ts`             | Add revertToVersionAction                         |
| `src/app/admin/page.tsx`                                  | Add payment conversion + growth stats             |
| `src/app/[chapter]/manage/page.tsx`                       | Add chapter-scoped stats                          |
| `src/app/not-found.tsx`                                   | New — 404 page                                    |
| `src/app/error.tsx`                                       | New — 500 error page                              |

---

## Verification Plan

1. **Email:** Submit contact form → verify email arrives at chapter contact_email. Approve coach application → verify applicant receives email.
2. **Event tickets:** Create event with ticket_price → navigate to event detail → click Register → complete Stripe test checkout → verify event_registrations record created with status=confirmed.
3. **Events in sidebar:** Log in as chapter_lead → navigate to /[chapter]/manage → verify Events link appears in sidebar → verify navigation works.
4. **Chapter payments:** Log in as chapter_lead → navigate to /[chapter]/manage/payments → verify only that chapter's payments are shown.
5. **Client grid block:** In edit mode, add a client_grid block → add 3 clients with logos → publish → verify public display.
6. **i18n:** Change browser language to something non-English — all strings should still render (in English for now but via translation keys).
7. **Version history:** Edit a content block → make 3 changes → open version history → revert to version 1 → verify content restored.
8. **Analytics:** Admin dashboard → verify payment conversion rate and coach growth stats are accurate vs. raw DB data.
9. **404:** Navigate to `/nonexistent` → verify branded 404 page.
10. **Performance:** Run `next build` + Lighthouse — verify chapter landing ≤ 200KB, coach directory ≤ 500KB.
