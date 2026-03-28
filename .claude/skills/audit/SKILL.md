---
name: audit
description: Audit the WIAL platform for completeness against the plan, coding conventions, security, accessibility, i18n compliance, and performance budgets.
user-invocable: true
---

# WIAL Platform Audit

Audit the codebase for completeness and correctness against CLAUDE.md conventions and the implementation plan.

## Scope

If `$ARGUMENTS` specifies a scope (e.g., "security", "a11y", "coaches feature", "payments"), narrow the audit. Otherwise, audit everything.

## Audit Checklist

### 1. Architecture Compliance

Read `CLAUDE.md` and verify:

- [ ] **Feature structure**: Every feature in `src/features/` follows `hooks/ → actions/ → queries/ → types.ts`
- [ ] **Component organization**: Components in correct directories (ui/, layout/, editor/, coaches/, chapters/, payments/, common/)
- [ ] **Route structure**: (global)/, (auth)/, admin/, [chapter]/, api/ route groups correct
- [ ] **Server vs Client**: Components are Server Components by default. `'use client'` only where needed.
- [ ] **No barrel files**: No `index.ts` re-exports anywhere
- [ ] **Import order**: React/Next → External → @/lib → @/features → @/components → Relative → Types

### 2. Security Compliance

- [ ] **Auth**: All protected routes check auth via `getUser()`, never `getSession()`
- [ ] **RLS**: Every Supabase table has RLS enabled with appropriate policies
- [ ] **Input validation**: All external input validated with Zod before processing
- [ ] **No dangerouslySetInnerHTML**: Unless wrapped with DOMPurify
- [ ] **Secrets**: No secrets in client code. No `.env` files committed. NEXT*PUBLIC* only for public values.
- [ ] **CSP headers**: Configured in next.config.ts
- [ ] **Stripe webhooks**: Signature verified before processing
- [ ] **File uploads**: MIME type and size validated

### 3. Accessibility (WCAG 2.1 AA)

- [ ] **HeroUI components**: Used for all interactive elements
- [ ] **Skip-to-content link**: Present in root layout
- [ ] **Heading hierarchy**: One h1 per page, sequential h2-h6, no skipped levels
- [ ] **Image alt text**: All `<img>` and `<Image>` have alt text
- [ ] **Form labels**: Every input has associated label or aria-label
- [ ] **Focus management**: Modals trap focus, restore on close
- [ ] **Color contrast**: Verified for all text/background combinations
- [ ] **Keyboard navigation**: All interactive elements reachable via Tab
- [ ] **aria-live regions**: Used for dynamic content updates (errors, toasts)
- [ ] **prefers-reduced-motion**: Respected in all animations

### 4. Internationalization

- [ ] **No hardcoded strings**: All user-facing text goes through next-intl
- [ ] **Translation keys**: Present in messages/en.json for every visible string
- [ ] **Date/currency formatting**: Uses Intl APIs via utility functions, never hardcoded
- [ ] **Logical CSS properties**: Uses ms-/me-/ps-/pe-/start/end instead of ml-/mr-/pl-/pr-/left/right

### 5. Performance

- [ ] **System fonts**: No custom font imports (saves 200-600KB)
- [ ] **Image optimization**: Next.js Image component with AVIF/WebP, lazy loading below fold
- [ ] **Dynamic imports**: Heavy libs (tiptap, Stripe, calendar) loaded dynamically
- [ ] **Bundle size**: Content pages < 100KB JS
- [ ] **SSG/ISR**: Static pages pre-rendered, dynamic pages use appropriate revalidation

### 6. Code Quality

- [ ] **TypeScript strict mode**: No `any` types
- [ ] **Zod schemas**: Present for all content block types, forms, API inputs
- [ ] **Error handling**: Supabase queries handle { data, error } properly
- [ ] **Naming conventions**: Files kebab-case, components PascalCase, hooks useCamelCase
- [ ] **No unused code**: No commented-out code, no unused imports/variables

### 7. Feature Completeness

For each planned P0 feature, verify existence and completeness:

- [ ] **Public website**: Global homepage with all planned sections
- [ ] **Chapter provisioning**: Create chapter flow, default content generation
- [ ] **Template inheritance**: Header/footer locked, chapter customization within bounds
- [ ] **Coach directory**: Global + chapter-filtered, search, filters, profile pages
- [ ] **Payments**: Stripe Checkout, webhook handler, payment dashboard
- [ ] **RBAC**: All 5 roles enforced (super_admin, chapter_lead, content_editor, coach, public)
- [ ] **Inline editing**: Edit mode toggle, block editors, approval workflow
- [ ] **Core pages**: About, Certification, Coaches, Resources, Events, Contact

## Output Format

For each section, report:

- **PASS**: Items that are correct
- **FAIL**: Items with specific file paths and what needs fixing
- **MISSING**: Items that don't exist yet but should
- **WARN**: Items that work but deviate from conventions

End with a summary: total pass/fail/missing/warn counts and a prioritized fix list.
