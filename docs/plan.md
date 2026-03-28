# WIAL Global Multi-Site Platform - MVP Implementation Plan

## Context

WIAL (World Institute for Action Learning) is a global non-profit certifying Action Learning coaches across 20+ countries. They need a platform where a main global website coexists with regional chapter sub-sites (USA, Nigeria, Brazil, etc.), all sharing consistent branding but allowing chapter-specific content editing. The current state is fragmented: inconsistent branding, no centralized coach directory, no standardized dues collection, and manual website management per chapter.

This plan covers **all P0 requirements**: public website, chapter provisioning, template inheritance, payment integration (Stripe), coach directory, core pages, and RBAC.

---

## Tech Stack

| Layer         | Technology              | Why                                                        |
| ------------- | ----------------------- | ---------------------------------------------------------- |
| Framework     | Next.js 15 (App Router) | SSG/ISR, server components, edge middleware                |
| UI Components | HeroUI v3               | 75+ accessible components, React Aria, CSS-first theming   |
| Styling       | TailwindCSS v4          | Utility-first, CSS variables, performant                   |
| Database      | Supabase (PostgreSQL)   | RLS, Auth, Storage, pgvector-ready for future AI           |
| Auth          | Supabase Auth           | Email/password + social, JWT, built-in RLS integration     |
| Payments      | Stripe (Checkout)       | PCI-compliant hosted page, webhooks                        |
| i18n          | next-intl               | English only for MVP, infrastructure for future languages  |
| Rich Text     | tiptap (ProseMirror)    | Headless, lightweight (~30KB), SSR-compatible              |
| Deployment    | Vercel                  | Native Next.js hosting, edge functions, image optimization |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (global)/                 # Route group: global pages
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Global homepage
│   │   ├── about/
│   │   ├── certification/
│   │   ├── coaches/              # Global coach directory
│   │   ├── resources/
│   │   ├── events/
│   │   └── contact/
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── callback/
│   ├── admin/                    # Super admin dashboard
│   │   ├── layout.tsx
│   │   ├── chapters/
│   │   ├── coaches/
│   │   ├── approvals/            # Content approval queue
│   │   ├── payments/
│   │   └── users/
│   ├── [chapter]/                # Dynamic chapter routing
│   │   ├── layout.tsx            # Chapter layout (accent colors, context)
│   │   ├── page.tsx              # Chapter homepage
│   │   ├── about/
│   │   ├── coaches/
│   │   ├── events/
│   │   ├── contact/
│   │   └── pay/
│   ├── api/
│   │   ├── payments/webhooks/    # Stripe webhook handler
│   │   └── upload/               # Image upload handler
│   ├── layout.tsx                # Root layout
│   └── middleware.ts             # Edge middleware (auth, chapter routing, RBAC)
├── components/
│   ├── ui/                       # HeroUI-based primitives
│   ├── layout/                   # Header, Footer, Nav, Sidebar
│   ├── editor/                   # Inline editing components
│   ├── coaches/                  # Coach directory components
│   ├── chapters/                 # Chapter-specific components
│   ├── payments/                 # Payment flow components
│   └── common/                   # Shared (SEO, ErrorBoundary)
├── features/                     # Feature modules (business logic)
│   ├── auth/
│   │   ├── hooks/                # useAuth()
│   │   ├── actions/              # Server actions (requireAuth, requireRole)
│   │   └── types.ts
│   ├── chapters/
│   │   ├── hooks/
│   │   ├── actions/
│   │   ├── queries/              # Supabase query functions
│   │   └── types.ts
│   ├── coaches/
│   │   ├── hooks/
│   │   ├── actions/
│   │   ├── queries/
│   │   └── types.ts
│   ├── content/                  # CMS / inline editor logic
│   │   ├── hooks/                # useEditMode()
│   │   ├── actions/
│   │   ├── queries/
│   │   ├── blocks/               # Content block definitions (registry, display, editor, schema per type)
│   │   └── types.ts
│   └── payments/
│       ├── hooks/
│       ├── actions/              # createCheckoutSession
│       ├── queries/
│       └── types.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (cookies-based)
│   │   ├── admin.ts              # Service role client
│   │   └── middleware.ts         # Auth middleware helper
│   ├── stripe/
│   │   ├── client.ts
│   │   └── config.ts
│   ├── utils/
│   │   ├── cn.ts                 # clsx + twMerge
│   │   ├── format.ts             # Date, currency (Intl APIs)
│   │   ├── validation.ts         # Shared Zod schemas
│   │   └── constants.ts
│   └── i18n/
│       ├── request.ts
│       └── config.ts
├── styles/
│   └── globals.css               # TailwindCSS v4 imports + WIAL theme tokens
├── types/
│   ├── database.ts               # Supabase generated types
│   └── index.ts
└── middleware.ts                  # Next.js edge middleware
```

Additional top-level:

```
supabase/
├── config.toml
├── migrations/
│   ├── 00001_initial_schema.sql
│   ├── 00002_rls_policies.sql
│   ├── 00003_functions.sql
│   └── 00004_seed.sql
└── seed.sql
messages/
└── en.json                       # next-intl English translations
scripts/
├── seed.ts                       # Faker-based seed data generator
└── generate-types.ts             # Supabase type generation
e2e/                              # Playwright E2E tests
```

---

## Database Schema

### Core Tables

**`chapters`** - Regional chapter sites

- `id`, `slug` (unique, e.g. 'usa', 'nigeria'), `name`, `country_code`, `timezone`, `currency`
- `accent_color` (chapter accent override), `logo_url`, `is_active`
- `stripe_account_id` (for future Stripe Connect)
- `contact_email`, `website_url`, `settings` (JSONB: feature flags, config)

**`profiles`** - Extends `auth.users`

- `id` (FK -> auth.users), `email`, `full_name`, `avatar_url`, `phone`
- `role` (enum: super_admin, chapter_lead, content_editor, coach, public)
- `chapter_id` (FK -> chapters, primary chapter)

**`user_chapter_roles`** - Multi-chapter role assignments

- `user_id`, `chapter_id`, `role`, `granted_by`
- UNIQUE(user_id, chapter_id, role)

**`coach_profiles`** - Coach directory entries

- `user_id` (FK -> profiles), `chapter_id` (FK -> chapters)
- `certification_level` (CALC/PALC/SALC/MALC), `bio`, `specializations[]`, `languages[]`
- `location_city`, `location_country`, `photo_url`, `contact_email`, `linkedin_url`
- `is_published` (requires admin approval), `is_verified`
- `certification_date`, `recertification_due`, `coaching_hours`
- `search_vector` (tsvector, generated, for full-text search)
- Future: `embedding vector(384)` column for AI search (pgvector)

**`pages`** - Page metadata

- `chapter_id` (NULL = global page), `slug`, `title`, `description`
- `is_published`, `sort_order`
- UNIQUE(chapter_id, slug)

**`content_blocks`** - Core of the inline editing system

- `page_id` (FK -> pages)
- `block_type` (hero, text, image, cta, team_grid, coach_list, event_list, testimonial, faq, contact_form, stats, video, divider)
- `content` (JSONB), `sort_order`, `is_visible`
- **Versioning**: `status` (draft/published/pending_approval/rejected), `published_version` (JSONB), `draft_version` (JSONB)
- **Approval**: `requires_approval` (bool), `approved_by`, `approved_at`, `rejection_reason`
- `created_by`, `updated_by`

**`content_versions`** - Audit trail (auto-created via trigger)

- `content_block_id`, `version_number`, `content`, `status`, `changed_by`

**`events`** - Chapter and global events

- `chapter_id` (NULL = global), `title`, `description`, `event_type`
- `start_date`, `end_date`, `timezone`, `location_name`, `is_virtual`, `virtual_link`
- `max_attendees`, `registration_url`, `image_url`, `is_published`

**`payments`** - Stripe payment records

- `user_id`, `chapter_id`, `stripe_payment_intent_id`, `stripe_checkout_session_id`
- `amount` (cents), `currency`, `payment_type` (enrollment_fee, certification_fee, membership_dues, event_registration)
- `status` (pending/processing/succeeded/failed/refunded), `receipt_url`

**`audit_log`** - All significant actions

- `user_id`, `action`, `entity_type`, `entity_id`, `chapter_id`
- `old_value` (JSONB), `new_value` (JSONB), `ip_address`, `user_agent`

### Database Functions & Triggers

- `handle_updated_at()` - Auto-update `updated_at` on all tables
- `handle_new_user()` - Auto-create `profiles` row on auth.users insert
- `auto_version_content()` - Auto-create `content_versions` row on content_block change
- `get_user_role()`, `get_user_chapter_id()`, `user_has_chapter_role()` - RLS helper functions

### Row-Level Security (RLS)

Every table has RLS enabled. Key policies:

- **Public**: Read active chapters, published content blocks, published coach profiles, published events
- **Coaches**: CRUD own profile, view own payments
- **Chapter leads**: CRUD content/coaches/events for their chapter, view chapter payments
- **Super admins**: Full access to everything
- **Payments**: Insert/update only via service role (Stripe webhooks), users see own, chapter leads see chapter

### Storage Buckets

- `avatars` (public, 2MB, image/\* only)
- `coach-photos` (public, 2MB, image/\* only)
- `chapter-assets` (public, 5MB, image/\* and PDF)
- `content-images` (public, 2MB, image/\* only)

---

## Authentication & RBAC

### Auth Flow

- Supabase Auth with email/password + Google OAuth + magic links
- `@supabase/ssr` for cookie-based session management in App Router
- **Always use `getUser()` on server (validates JWT), never trust `getSession()`**

### Role Hierarchy

1. `super_admin` - Full access to everything
2. `chapter_lead` - Full access to their chapter(s)
3. `content_editor` - Edit content on assigned chapter(s)
4. `coach` - Update own profile, pay dues
5. `public` - View published content only

### Edge Middleware (`src/middleware.ts`)

1. Refresh Supabase session via `getUser()`
2. Validate chapter slugs against cached list
3. Protect `/admin/*` (require super_admin)
4. Protect `/[chapter]/edit/*` (require chapter_lead or content_editor for that chapter)
5. Skip auth for `/api/payments/webhooks` (Stripe signature verification instead)

---

## Inline Editing System

### Architecture

- **Edit Mode Toggle**: Floating button (bottom-right) visible only to chapter_lead/content_editor
- **EditModeProvider**: React context that switches all editable blocks from display to edit mode
- **Content Block Registry** (`features/content/blocks/registry.ts`): Maps each `block_type` to `{ display, editor, schema, requiresApproval, label, icon }`

### Editable vs Locked Zones

**Locked (never editable)**: Header, Footer, Navigation, page URL structure, core brand colors (navy, red, white)

**Instant publish (no approval)**:

- Local events, team bios, accent colors/styling
- Section visibility toggles, section reorder
- Chapter contact info, coach directory filtering

**Requires approval**:

- Hero blocks (images, headline, CTA)
- Main about section content
- Any block where `requiresApproval: true` in registry

### Edit Flow

1. Chapter lead toggles edit mode ON
2. Editable blocks show blue dashed border + hover toolbar (Edit, Move Up/Down, Show/Hide)
3. Click opens inline editor with form fields specific to block type
4. On save:
   - If instant: `status: 'published'`, `published_version` updated, live immediately
   - If approval needed: `status: 'pending_approval'`, `draft_version` updated, live site shows old `published_version`
5. Version record auto-created via trigger
6. Super admin reviews in `/admin/approvals` with side-by-side diff, approves or rejects

### Rich Text

- tiptap (ProseMirror) loaded only in edit mode via dynamic import
- Extensions: bold, italic, link, heading (h2, h3), bullet/ordered list
- No tables, embeds, or arbitrary HTML (security)
- Output as JSON, rendered server-side (zero client JS for display)

---

## Coach Directory

### Global Directory (`/coaches`)

- Search: Full-text search via PostgreSQL `tsvector` (weighted: bio A, specializations B, location C)
- Filters: Certification level, country, chapter
- Results: Card grid (photo 80x80 AVIF thumbnail, name, cert badge, location, bio excerpt)
- Pagination: Cursor-based
- URL state: All filters in search params (shareable)
- Target: <= 500KB

### Chapter Directory (`/[chapter]/coaches`)

- Same component, pre-filtered to chapter

### Profile Self-Management (`/coaches/profile`)

- Coaches edit: bio, photo, specializations, languages, contact, LinkedIn
- Cannot edit: certification level, published status
- Profile changes go to `pending_changes` JSONB, admin approves -> merges

### Future AI Readiness

- `search_vector` tsvector column for current keyword search
- Commented `embedding vector(384)` column ready for pgvector
- Architecture allows swapping search implementation without UI changes

---

## Payment Integration (Stripe)

### Flow

1. User selects payment type: enrollment ($50/student), certification ($30/student), membership (variable)
2. Server action `createCheckoutSession` validates user, calculates amount, creates Stripe Checkout Session
3. Redirect to Stripe hosted checkout page (PCI-compliant)
4. Stripe webhook `POST /api/payments/webhooks` processes `checkout.session.completed`
5. Webhook verifies signature, creates/updates `payments` row, sends receipt

### Security

- No card data touches our servers (Stripe Checkout handles PCI)
- Webhook signature verification prevents spoofing
- Amount validation server-side (client cannot set arbitrary amounts)
- Idempotency via unique `stripe_checkout_session_id`

---

## Performance Targets

| Page            | Max Size    | Strategy                                     |
| --------------- | ----------- | -------------------------------------------- |
| Chapter landing | <= 200 KB   | SSG, system fonts, lazy load below-fold      |
| Coach directory | <= 500 KB   | ISR (60s), 80x80 AVIF thumbnails, pagination |
| Content pages   | < 100 KB JS | Server Components, dynamic import heavy libs |

### Key Techniques

- **SSG/ISR**: Pre-render all chapter pages, revalidate on content change via `revalidatePath()`
- **System font stack**: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` (saves 200-600KB)
- **Images**: AVIF > WebP > JPEG via Next.js Image, max 50KB per image, lazy load below-fold
- **Bundle**: Server Components default, dynamic import tiptap/Stripe/Calendar, tree-shake HeroUI via `optimizePackageImports`
- **Compression**: Brotli (Vercel automatic)

---

## i18n Infrastructure

- `next-intl` configured with English only (`locales: ['en']`)
- All user-facing strings in `messages/en.json` (nav, labels, placeholders)
- Date/currency formatting via `Intl` APIs with locale parameter
- Route structure ready for future locale prefix (`/es/about`)
- Content blocks ready for future `locale` column
- **No URL complexity for MVP** - add locale prefix when second language is added

---

## Security Checklist (OWASP)

1. **Injection**: Parameterized queries (Supabase client), Zod validation on all input
2. **Auth**: Supabase handles sessions, `getUser()` for server-side validation, secure cookies
3. **Data Exposure**: No card data stored, env vars for secrets, no PII in client bundles
4. **Access Control**: RLS on every table, server-side role checks, client checks for UI only
5. **XSS**: React escaping, no `dangerouslySetInnerHTML` without DOMPurify, strict CSP
6. **Misconfiguration**: CSP headers, X-Frame-Options: DENY, HTTPS only
7. **Logging**: audit_log table, Vercel runtime logs
8. **Dependencies**: Dependabot, `npm audit` in CI

---

## Build Order (5 Sprints)

### Sprint 1: Foundation

- Project setup (Next.js, HeroUI v3, TailwindCSS v4, TypeScript, ESLint, Prettier, Husky)
- Supabase project + all migrations (tables, RLS, functions, triggers)
- Auth (login, register, middleware, role checking)
- Root layout (Header, Footer, Nav)
- Theming (CSS variables, WIAL brand tokens)
- Seed data script (5 chapters, 50 coaches, 10 events)
- **Deliverable**: Authenticated shell with nav, login/register, seeded DB

### Sprint 2: Chapter System + Core Pages

- `[chapter]` dynamic routing + chapter layout
- Chapter slug validation in middleware
- PageRenderer + all display-mode block components
- Global homepage + chapter homepage
- About, Certification, Resources, Contact (global + chapter)
- Chapter provisioning admin flow (create chapter -> auto-generate pages + default content)
- **Deliverable**: Multi-site with all core pages rendering from DB

### Sprint 3: Coach Directory + Events

- Coach directory (global + chapter-filtered)
- Full-text search + filter UI
- Coach profile page + self-management
- Events calendar (global + chapter)
- Event CRUD for chapter leads
- **Deliverable**: Searchable coach directory + events calendar

### Sprint 4: Inline Editing + CMS

- Edit mode toggle + EditModeProvider
- All editor-mode block components
- tiptap integration for rich text
- Image upload flow
- Section reorder + show/hide
- Approval workflow (pending/approve/reject)
- Admin approval queue (`/admin/approvals`)
- Content versioning + revert
- **Deliverable**: Chapter leads can visually edit their sites

### Sprint 5: Payments + Polish

- Stripe Checkout integration
- Webhook handler
- Payment dashboard (admin + chapter level)
- i18n setup (next-intl with English)
- Performance audit (bundle analysis, image optimization, Lighthouse)
- Accessibility audit (axe, keyboard, screen reader)
- E2E test suite (Playwright)
- **Deliverable**: Complete MVP

---

## Critical Files

| File                                                     | Purpose                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/middleware.ts`                                      | Edge middleware: auth refresh, chapter routing, RBAC                  |
| `supabase/migrations/00001_initial_schema.sql`           | Complete DB schema, indexes, RLS, triggers                            |
| `src/features/content/blocks/registry.ts`                | Block type registry (display/editor/schema/approval mapping)          |
| `src/app/[chapter]/layout.tsx`                           | Chapter layout (slug validation, accent colors, template inheritance) |
| `src/features/payments/actions/createCheckoutSession.ts` | Stripe Checkout session creation + validation                         |

---

## Verification

1. **Auth**: Register, login, verify role-based access (admin routes blocked for coaches, chapter routes scoped)
2. **Chapters**: Navigate to `/usa`, `/nigeria` - verify different accent colors, content, coach lists
3. **Coach Directory**: Search "leadership" - verify results, filter by certification level, paginate
4. **Inline Editing**: Login as chapter lead, toggle edit mode, change text, verify instant publish vs approval flow
5. **Payments**: Initiate Stripe Checkout, complete with test card, verify webhook creates payment record
6. **Performance**: Lighthouse audit - target 90+ on all scores, verify page sizes meet targets
7. **Accessibility**: axe scan all pages, keyboard-only navigation test, screen reader test on coach directory
8. **Security**: Verify RLS by attempting cross-chapter data access, verify Stripe webhook rejects bad signatures

---

## Dependencies to Install

**Core**: `next`, `react`, `react-dom`, `typescript`, `@heroui/react`, `@heroui/styles`, `tailwindcss`, `@tailwindcss/postcss`, `@supabase/supabase-js`, `@supabase/ssr`

**Payments**: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`

**i18n**: `next-intl`

**UI/Content**: `lucide-react`, `clsx`, `tailwind-merge`, `sonner`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`

**Validation**: `zod`

**Dev**: `@types/node`, `@types/react`, `eslint`, `eslint-config-next`, `eslint-plugin-jsx-a11y`, `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `supabase`, `@faker-js/faker`

**Testing**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`, `@axe-core/playwright`
