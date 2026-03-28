# WIAL Global Multi-Site Platform

> **IMPORTANT**: Before implementing any library integration, ALWAYS verify the current API patterns against live documentation. Model knowledge may be outdated. Key docs to check:
>
> - HeroUI v3: https://heroui.com/docs/react/components
> - TailwindCSS v4: https://tailwindcss.com/docs
> - Next.js 15: https://nextjs.org/docs
> - Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
> - next-intl: https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
> - Stripe Checkout: https://docs.stripe.com/checkout/quickstart

## Project Overview

Global multi-site platform for WIAL (World Institute for Action Learning) — a non-profit certifying Action Learning coaches across 20+ countries. Regional chapters get independent sub-sites with consistent branding, a centralized coach directory, and Stripe-based dues collection.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **UI**: HeroUI v3 (`@heroui/react` + `@heroui/styles`, React Aria Components, CSS-first theming, no framer-motion)
- **Styling**: TailwindCSS v4 (CSS variables via `@theme` directive)
- **Database**: Supabase (`@supabase/supabase-js` + `@supabase/ssr` for cookie-based auth)
- **Payments**: Stripe (Checkout Sessions, Webhooks)
- **i18n**: next-intl (English only for MVP, infrastructure for future languages)
- **Rich Text**: tiptap (ProseMirror-based, headless)
- **Validation**: Zod (runtime schema validation)
- **Testing**: Vitest + Testing Library + Playwright + axe-core
- **Deployment**: Vercel

### Critical Library Notes

- **HeroUI v3 CSS imports** (order matters): `@import "tailwindcss";` FIRST, then `@import "@heroui/styles";`
- **HeroUI v3 has NO framer-motion** — uses native CSS transitions/keyframes. Do NOT install framer-motion.
- **Next.js 15 params are Promises** — `params: Promise<{ chapter: string }>`, must `await params`
- **Supabase SSR**: Use `@supabase/ssr` (NOT `@supabase/auth-helpers-nextjs` which is deprecated)
- **next-intl without routing**: Config in `src/i18n/request.ts`, wrap next.config with `createNextIntlPlugin()`
- **Always verify patterns against live docs** before implementing — these libraries evolve fast

## Architecture Principles

### Server Components by Default

Every component is a Server Component unless it needs interactivity. Only add `'use client'` when you need:

- Event handlers (onClick, onChange, etc.)
- useState, useEffect, useRef, or other hooks
- Browser-only APIs

### Feature-Based Module Structure

```
src/features/{feature}/
  ├── hooks/         # Client-side React hooks
  ├── actions/       # Server Actions (form submissions, mutations)
  ├── queries/       # Supabase query functions (server-side data fetching)
  ├── types.ts       # Feature-specific TypeScript types
  └── utils.ts       # Feature-specific utilities (if needed)
```

### Component Organization

```
src/components/
  ├── ui/            # HeroUI-based primitive wrappers (only if customizing)
  ├── layout/        # Header, Footer, Nav, Sidebar (global shell)
  ├── editor/        # Inline editing components
  ├── coaches/       # Coach directory UI components
  ├── chapters/      # Chapter-specific UI components
  ├── payments/      # Payment flow UI components
  └── common/        # Shared: SEO, ErrorBoundary, LoadingState
```

### Route Structure

```
src/app/
  ├── (global)/      # Global public pages (about, certification, coaches, etc.)
  ├── (auth)/        # Auth pages (login, register, forgot-password, callback)
  ├── admin/         # Super admin dashboard (protected)
  ├── [chapter]/     # Dynamic chapter routing (usa, nigeria, etc.)
  └── api/           # Route handlers (webhooks, uploads)
```

## Coding Conventions

### TypeScript

- **Strict mode**: `strict: true`, `noUncheckedIndexedAccess: true`
- **No `any`**: Use `unknown` and narrow. `@typescript-eslint/no-explicit-any: error`
- **Zod for validation**: All external input (forms, API, URL params) validated with Zod schemas
- **Path aliases**: `@/*` maps to `./src/*`
- **Prefer `interface` over `type`** for object shapes. Use `type` for unions, intersections, and mapped types.
- **Export types explicitly**: `export type { ... }` or `export interface ...`

### Naming

- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase` — matches filename without extension
- **Hooks**: `useCamelCase` — prefixed with `use`
- **Server Actions**: `camelCase` — in `features/{feature}/actions/`
- **Constants**: `UPPER_SNAKE_CASE`
- **Database columns**: `snake_case` (PostgreSQL convention)
- **CSS variables**: `--kebab-case`
- **Zod schemas**: `camelCaseSchema` (e.g., `coachProfileSchema`)

### Components

- **One component per file** (exception: small helper components used only in that file)
- **Props interface above component**: Named `{ComponentName}Props`
- **Destructure props** in the function signature
- **No default exports** except for Next.js pages/layouts (required by framework)
- **Collocate styles**: Use Tailwind classes directly, no separate CSS files per component
- **Forward refs** when wrapping HeroUI components

### Imports

- **Order**: React/Next → External libs → `@/lib` → `@/features` → `@/components` → Relative → Types
- **No barrel files**: Import directly from the source file, never from `index.ts`
- **Tree-shake icons**: `import { Search } from 'lucide-react'` (not `import * as Icons`)

### State Management

- **URL state for filters/search**: Use `useSearchParams` for anything that should be shareable
- **Server state via Supabase**: Fetch in Server Components, pass as props
- **Client state only when necessary**: Prefer server-side over client-side state
- **No global state library**: Use React Context sparingly, only for truly global concerns (auth, edit mode)

## Security Rules

### Authentication

- **ALWAYS use `getUser()` or `getClaims()` on the server** to validate JWTs — NEVER trust `getSession()`
- `getUser()` makes a network call to Supabase (most secure). `getClaims()` reads JWT locally (faster). Verify which is current recommended method in Supabase docs before implementing.
- Client-side auth checks are for UI rendering only, never for authorization
- All mutations must verify auth server-side before executing

### Database

- **RLS on every table** — no exceptions
- **Parameterized queries only** — Supabase client handles this, but never string-concatenate SQL
- **Service role client** (`admin.ts`) only in API routes and server actions, never in client code
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

### Input Validation

- **Validate all external input with Zod** before processing (forms, URL params, API payloads)
- **Sanitize rich text** — never use `dangerouslySetInnerHTML` without DOMPurify
- File uploads: validate MIME type, enforce size limits (2MB images, 5MB chapter assets)

### Content Security

- Strict CSP headers configured in `next.config.ts`
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Payments

- **Stripe Checkout** (hosted page) — no card data on our servers
- **Webhook signature verification** on all Stripe webhook handlers
- Amount validation server-side — never trust client-provided amounts
- Use `stripe_checkout_session_id` as idempotency key

### Secrets

- Never commit `.env.local`, `.env`, or any file containing secrets
- All secrets accessed via `process.env` server-side only
- `NEXT_PUBLIC_` prefix only for truly public values (Supabase URL, Stripe publishable key)

## Accessibility (WCAG 2.1 AA)

### Required Practices

- **Use HeroUI components** for all interactive elements — they have React Aria accessibility built in
- **Skip-to-content link** as first focusable element in root layout
- **Heading hierarchy**: One `<h1>` per page, sequential `<h2>`–`<h6>`, never skip levels
- **All images require `alt` text** — enforced via `eslint-plugin-jsx-a11y`
- **Form labels**: Every input has an associated `<label>` or `aria-label`
- **Error messages**: Use `aria-live="polite"` regions for dynamic error announcements
- **Focus management**: Trap focus in modals/drawers, restore on close
- **Keyboard navigation**: All interactive elements reachable via Tab, operable via Enter/Space
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Motion**: Respect `prefers-reduced-motion` — no auto-playing animations

### Testing

- `eslint-plugin-jsx-a11y` in ESLint config (catches ~30% of a11y issues at lint time)
- `@axe-core/playwright` in E2E tests (automated WCAG scanning)
- Manual keyboard-only navigation test for every new interactive feature
- Screen reader testing (NVDA or VoiceOver) for complex interactions

## Internationalization (i18n)

### Current State

English only for MVP. But ALL user-facing strings must go through next-intl.

### Setup (verified: next-intl without i18n routing)

- Config: `src/i18n/request.ts` — uses `getRequestConfig()` with hardcoded `locale: 'en'`
- Plugin: `next.config.ts` wraps config with `createNextIntlPlugin()` from `next-intl/plugin`
- Provider: Root `layout.tsx` wraps children with `<NextIntlClientProvider>`
- Server: `getTranslations('namespace')` from `next-intl/server` (async, must await)
- Client: `useTranslations('namespace')` from `next-intl`

### Rules

- **Never hardcode user-facing strings** in components. Always use `useTranslations()` or `getTranslations()`
- Translation keys in `messages/en.json`, organized by feature namespace
- **Date/time formatting**: Use `Intl.DateTimeFormat` via `@/lib/utils/format.ts` — never hardcode formats
- **Currency formatting**: Use `Intl.NumberFormat` — amounts stored in cents, formatted at render time
- **Number formatting**: Use `Intl.NumberFormat` — respects locale grouping/decimal conventions
- **Text direction**: Prepare for RTL — use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) instead of physical (`ml-`, `mr-`, `pl-`, `pr-`, `left`, `right`) in Tailwind

### Translation Key Convention

```json
{
  "featureName": {
    "sectionName": {
      "elementName": "Translated string"
    }
  }
}
```

Example: `coaches.directory.searchPlaceholder`

## Performance Constraints

### Page Size Budgets

- Chapter landing page: **<= 200 KB** compressed
- Coach directory page: **<= 500 KB** compressed
- Total JS on content pages: **< 100 KB**

### Required Techniques

- **System font stack**: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` — zero custom fonts
- **Images**: AVIF primary, WebP fallback via Next.js Image. Max 50KB per image. Lazy-load below fold.
- **Dynamic imports**: Heavy libs (tiptap, Stripe Elements, calendar views) loaded only when needed
- **Server Components**: Default for all data-fetching and rendering. Client Components only for interactivity.
- **ISR**: Coach directory and events pages use `revalidate: 60`. Static pages use `revalidate: 3600`.
- **Bundle analysis**: Use `@next/bundle-analyzer` to verify. CI should fail if content page JS > 100KB.

## Database Patterns

### Supabase Client Usage

- **Browser**: `@/lib/supabase/client.ts` — `createBrowserClient()` from `@supabase/ssr`
- **Server Components/Actions**: `@/lib/supabase/server.ts` — `createServerClient()` from `@supabase/ssr` with Next.js `cookies()` from `next/headers`. Uses `getAll()`/`setAll()` cookie methods.
- **API Routes/Webhooks**: `@/lib/supabase/admin.ts` — service role client (bypasses RLS)
- **Verify current client setup patterns** against https://supabase.com/docs/guides/auth/server-side/nextjs before implementing

### Query Patterns

- Server-side data fetching goes in `features/{feature}/queries/`
- Each query function takes a Supabase client as parameter (for testability)
- Always handle errors: `const { data, error } = await supabase.from(...)`
- Never swallow errors silently — throw or return typed error objects

### Content Block Pattern

Content is stored as JSONB in `content_blocks` table. Each block type has:

- A Zod schema (validation)
- A display component (server-rendered, zero JS)
- An editor component (client, loaded in edit mode only)
- An entry in the block registry (`features/content/blocks/registry.ts`)

## Testing Patterns

### Unit Tests (Vitest)

- File: `*.test.ts` or `*.test.tsx` colocated with source
- Test utilities, Zod schemas, pure functions, RBAC logic
- Mock Supabase client for query tests

### Integration Tests (Vitest + Testing Library)

- Test component rendering with mock data
- Test form validation and submission
- Test filter/search interactions

### E2E Tests (Playwright)

- Directory: `e2e/`
- Test critical user flows: auth, chapter navigation, coach search, payment, edit mode
- Include `@axe-core/playwright` accessibility scan on every page

## Git Conventions

### Commit Messages

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `a11y`, `i18n`, `security`

Examples:

- `feat(coaches): add search and filter to directory page`
- `fix(payments): validate amount server-side before Stripe checkout`
- `a11y(nav): add skip-to-content link and focus management`
- `i18n(coaches): extract hardcoded strings to translation keys`

### Branch Naming

`type/short-description` — e.g., `feat/coach-directory`, `fix/rls-chapter-access`

## Environment Variables

```
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=              # Also referred to as "publishable key" in newer Supabase docs
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=

# Secret (server only)
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Important**: Always verify env var names against current Supabase/Stripe docs. Supabase has been transitioning naming conventions (anon_key vs publishable_key).

## Key Decisions Reference

| Decision        | Choice                              | Rationale                                      |
| --------------- | ----------------------------------- | ---------------------------------------------- |
| Chapter routing | Path-based (`/[chapter]`)           | Simpler than subdomains, works with Vercel     |
| Multi-tenancy   | Single DB, RLS                      | Supabase strength, no cross-DB queries         |
| Content model   | JSONB content blocks                | Flexible, versionable, supports inline editing |
| Rich text       | tiptap                              | Headless, lightweight, SSR-compatible          |
| State mgmt      | Server Components + URL state       | Minimal client JS, cacheable                   |
| Forms           | Server Actions + Zod                | Type-safe, progressive enhancement             |
| Images          | Supabase transforms + Next.js Image | Built-in AVIF/WebP, lazy loading               |
| Payments        | Stripe Checkout (hosted)            | PCI compliance delegated                       |
| Auth            | Supabase Auth                       | Native RLS integration, free                   |
