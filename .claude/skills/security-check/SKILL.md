---
name: security-check
description: Perform a focused security audit on a specific feature, route, or the full codebase against OWASP top 10 and project security rules.
user-invocable: true
---

# Security Check

Perform a focused security audit against OWASP top 10 and project security conventions.

## Usage

`/security-check [target]` — e.g., `/security-check payments` or `/security-check api routes` or `/security-check auth flow`

If `$ARGUMENTS` is empty, audit the entire codebase.

## Audit Categories

### 1. Authentication & Session Management

- [ ] Server-side auth uses `getUser()`, NEVER `getSession()`
- [ ] Protected routes call `requireAuth()` / `requireRole()` at the top
- [ ] API routes verify auth before processing
- [ ] No auth tokens stored in localStorage (cookies only, via Supabase SSR)
- [ ] OAuth callback validates state parameter
- [ ] Password reset tokens are single-use and time-limited (Supabase handles this)

### 2. Authorization (RBAC)

- [ ] Every Supabase table has RLS enabled
- [ ] RLS policies match the intended access patterns
- [ ] Server Actions verify user role before mutations
- [ ] Chapter-scoped actions verify `user_has_chapter_role()`
- [ ] Client-side role checks are for UI only — never for authorization
- [ ] Admin routes check for `super_admin` role

### 3. Input Validation (Injection Prevention)

- [ ] All form inputs validated with Zod schemas
- [ ] URL params / search params validated before use
- [ ] API request bodies validated before processing
- [ ] File uploads: MIME type validated, size limited
- [ ] No raw SQL queries — all via Supabase client (parameterized)
- [ ] No `eval()`, `Function()`, or dynamic code execution

### 4. XSS Prevention

- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] Rich text content rendered via tiptap server renderer (not raw HTML)
- [ ] User-generated content escaped by React's default behavior
- [ ] CSP headers configured in next.config.ts
- [ ] No inline scripts in HTML

### 5. Sensitive Data Protection

- [ ] No secrets in client-side code (only `NEXT_PUBLIC_` prefixed vars)
- [ ] No `.env` files committed to git
- [ ] No PII logged to console in production
- [ ] Supabase service role key only used in server-side code (`lib/supabase/admin.ts`)
- [ ] Payment amounts calculated server-side, never trusted from client

### 6. Payment Security

- [ ] Stripe Checkout (hosted page) used — no card data on our servers
- [ ] Webhook signature verified with `stripe.webhooks.constructEvent()`
- [ ] Payment amounts validated server-side against known prices
- [ ] Idempotency: duplicate webhook events handled gracefully
- [ ] No Stripe secret key in client bundles

### 7. API Security

- [ ] Rate limiting on sensitive endpoints (auth, payments)
- [ ] CORS configured correctly (not `*` in production)
- [ ] Stripe webhook endpoint skips CSRF but verifies signature
- [ ] File upload endpoint validates auth, MIME type, and size
- [ ] Error responses don't leak internal details (stack traces, SQL)

### 8. Security Headers (next.config.ts)

- [ ] `Content-Security-Policy` — restricts script/style/img sources
- [ ] `X-Frame-Options: DENY` — prevents clickjacking
- [ ] `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — restricts browser features (camera, mic, etc.)
- [ ] `Strict-Transport-Security` — enforces HTTPS

### 9. Dependency Security

- [ ] No known vulnerabilities (`npm audit`)
- [ ] Dependencies up to date (Dependabot or similar)
- [ ] Lock file committed (`package-lock.json`)
- [ ] No unnecessary dependencies

### 10. Data Integrity

- [ ] Database constraints enforce data validity (CHECK, NOT NULL, UNIQUE, FK)
- [ ] Content versioning prevents data loss on edits
- [ ] Audit log captures security-relevant actions
- [ ] Soft deletes preferred over hard deletes for user data

## Severity Levels

- **Critical**: Exploitable vulnerability (auth bypass, injection, exposed secrets)
- **High**: Significant risk (missing RLS, unvalidated input, missing auth check)
- **Medium**: Defense-in-depth gap (missing headers, no rate limiting)
- **Low**: Best practice improvement (logging, audit trail gaps)

## Output Format

```
## Security Audit: [target]

### Critical Issues
1. [file:line] — [description] — [OWASP category]
   Risk: [what could happen]
   Fix: [specific fix]

### High Issues
1. [file:line] — [description]
   Fix: [specific fix]

### Medium Issues
1. [file:line] — [description]
   Fix: [specific fix]

### Low Issues
1. [file:line] — [description]
   Fix: [specific fix]

### Passes
- [what's already secure]

### Summary
- Critical: X | High: X | Medium: X | Low: X | Passes: X
```
